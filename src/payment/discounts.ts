import type { Product } from "../products/product.js";
import type { ProductRepository } from "../products/product.repository.js";

export interface CampaignDiscount {
  productIds: string[];
  percent: number;
}

/**
 * Applies a campaign discount to the selected products (SHOP-102) and returns the updated
 * products. The new price replaces the current price.
 */
export function applyCampaignDiscount(products: ProductRepository, discount: CampaignDiscount): Product[] {
  const updated: Product[] = [];
  for (const id of discount.productIds) {
    const product = products.get(id);
    const priceCents = product.priceCents * (1 - discount.percent / 100);
    updated.push(products.update(id, { priceCents }));
  }
  return updated;
}
