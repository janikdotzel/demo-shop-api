import { validationError } from "../http-error.js";
import type { OrderTotals } from "../payment/pricing.js";
import { isNonEmptyString, isPositiveInteger, requireObject } from "../validation.js";

export type OrderStatus = "placed" | "cancelled";

export interface OrderLine {
  productId: string;
  sku: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  lines: OrderLine[];
  couponCode?: string;
  totals: OrderTotals;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
}

export interface OrderInput {
  items: OrderItemInput[];
  couponCode?: string;
}

export const MAX_ITEMS_PER_ORDER = 50;
export const MAX_QUANTITY_PER_ITEM = 99;

export function parseOrderInput(body: unknown): OrderInput {
  const input = requireObject(body);
  const details: Record<string, string> = {};

  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > MAX_ITEMS_PER_ORDER) {
    throw validationError({ items: `must be an array with 1-${MAX_ITEMS_PER_ORDER} entries` });
  }

  const seen = new Set<string>();
  const items: OrderItemInput[] = [];
  input.items.forEach((raw: unknown, index: number) => {
    const item = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
    if (!isNonEmptyString(item.productId, 64)) {
      details[`items[${index}].productId`] = "must be a product id";
      return;
    }
    if (!isPositiveInteger(item.quantity) || item.quantity > MAX_QUANTITY_PER_ITEM) {
      details[`items[${index}].quantity`] = `must be an integer between 1 and ${MAX_QUANTITY_PER_ITEM}`;
      return;
    }
    if (seen.has(item.productId)) {
      details[`items[${index}].productId`] = "must not appear twice";
      return;
    }
    seen.add(item.productId);
    items.push({ productId: item.productId, quantity: item.quantity });
  });

  if (input.couponCode !== undefined && !isNonEmptyString(input.couponCode, 32)) {
    details.couponCode = "must be a non-empty string with at most 32 characters";
  }
  if (Object.keys(details).length > 0) {
    throw validationError(details);
  }

  return input.couponCode === undefined ? { items } : { items, couponCode: input.couponCode as string };
}
