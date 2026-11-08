import { validationError } from "../http-error.js";
import { isNonEmptyString, isNonNegativeInteger, requireObject } from "../validation.js";

export interface Product {
  id: string;
  sku: string;
  name: string;
  /** Gross price in euro cents. Never use floating point for money. */
  priceCents: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Pick<Product, "sku" | "name" | "priceCents" | "stock">;

const SKU_PATTERN = /^[A-Z0-9-]{3,32}$/;

export function parseProductInput(body: unknown): ProductInput {
  const input = requireObject(body);
  const details: Record<string, string> = {};

  if (typeof input.sku !== "string" || !SKU_PATTERN.test(input.sku)) {
    details.sku = "must be 3-32 characters: A-Z, 0-9 or -";
  }
  if (!isNonEmptyString(input.name, 200)) {
    details.name = "must be a non-empty string with at most 200 characters";
  }
  if (!isNonNegativeInteger(input.priceCents)) {
    details.priceCents = "must be a non-negative integer (euro cents)";
  }
  if (!isNonNegativeInteger(input.stock)) {
    details.stock = "must be a non-negative integer";
  }
  if (Object.keys(details).length > 0) {
    throw validationError(details);
  }

  return {
    sku: input.sku as string,
    name: (input.name as string).trim(),
    priceCents: input.priceCents as number,
    stock: input.stock as number,
  };
}

/** Validates a partial update. `sku` is immutable after creation. */
export function parseProductPatch(body: unknown): Partial<Omit<ProductInput, "sku">> {
  const input = requireObject(body);
  const details: Record<string, string> = {};
  const patch: Partial<Omit<ProductInput, "sku">> = {};

  if ("sku" in input) {
    details.sku = "cannot be changed";
  }
  if ("name" in input) {
    if (isNonEmptyString(input.name, 200)) patch.name = input.name.trim();
    else details.name = "must be a non-empty string with at most 200 characters";
  }
  if ("priceCents" in input) {
    if (isNonNegativeInteger(input.priceCents)) patch.priceCents = input.priceCents;
    else details.priceCents = "must be a non-negative integer (euro cents)";
  }
  if ("stock" in input) {
    if (isNonNegativeInteger(input.stock)) patch.stock = input.stock;
    else details.stock = "must be a non-negative integer";
  }
  if (Object.keys(details).length > 0) {
    throw validationError(details);
  }
  if (Object.keys(patch).length === 0) {
    throw validationError({ body: "must contain at least one of name, priceCents, stock" });
  }
  return patch;
}
