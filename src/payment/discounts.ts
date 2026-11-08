import { notFound, validationError } from "../http-error.js";
import type { Product } from "../products/product.js";
import type { ProductRepository } from "../products/product.repository.js";

export interface CampaignDiscount {
  productIds: string[];
  percent: number;
}

export function parseCampaignDiscount(body: unknown): CampaignDiscount {
  const input = (body ?? {}) as Record<string, unknown>;
  const details: Record<string, string> = {};
  const ids = input.productIds;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100 || !ids.every((id) => typeof id === "string" && id.length > 0)) {
    details.productIds = "must be a list of 1 to 100 product ids";
  }
  const percent = input.percent;
  if (typeof percent !== "number" || !Number.isInteger(percent) || percent < 1 || percent > 90) {
    details.percent = "must be an integer from 1 to 90";
  }
  if (Object.keys(details).length > 0) throw validationError(details);
  return { productIds: [...new Set(ids as string[])], percent: percent as number };
}

/**
 * Applies a campaign discount to the selected products (SHOP-102). All ids are checked before any
 * price changes, so an unknown id changes nothing.
 */
export function applyCampaignDiscount(products: ProductRepository, discount: CampaignDiscount): Product[] {
  const selected = discount.productIds.map((id) => {
    try {
      return products.get(id);
    } catch {
      throw notFound("Product", id);
    }
  });
  return selected.map((product) => {
    const priceCents = Math.max(1, Math.round((product.priceCents * (100 - discount.percent)) / 100));
    return products.update(product.id, { priceCents });
  });
}
