import { HttpError } from "../http-error.js";

/**
 * Pricing rules for orders. This module is a critical path: every change needs
 * unit tests for rounding, discounts and shipping.
 *
 * All amounts are gross euro cents (VAT included) and must stay integers.
 */
export const VAT_RATE_PERCENT = 20;
export const FREE_SHIPPING_THRESHOLD_CENTS = 5_000;
export const SHIPPING_FEE_CENTS = 495;

export interface Coupon {
  code: string;
  percentOff: number;
  maxDiscountCents: number;
}

const COUPONS: ReadonlyMap<string, Coupon> = new Map([
  ["WELCOME10", { code: "WELCOME10", percentOff: 10, maxDiscountCents: 2_000 }],
  ["VIP20", { code: "VIP20", percentOff: 20, maxDiscountCents: 10_000 }],
]);

export interface PriceLine {
  unitPriceCents: number;
  quantity: number;
}

export interface OrderTotals {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  /** VAT contained in totalCents, for the invoice. */
  vatIncludedCents: number;
}

export function findCoupon(code: string): Coupon {
  const coupon = COUPONS.get(code.trim().toUpperCase());
  if (!coupon) {
    throw new HttpError(422, "invalid_coupon", `Coupon ${code} is not valid`);
  }
  return coupon;
}

export function calculateTotals(lines: PriceLine[], couponCode?: string): OrderTotals {
  const subtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);

  let discountCents = 0;
  if (couponCode !== undefined) {
    const coupon = findCoupon(couponCode);
    discountCents = Math.min(Math.floor((subtotalCents * coupon.percentOff) / 100), coupon.maxDiscountCents);
  }

  const discountedCents = subtotalCents - discountCents;
  const shippingCents =
    discountedCents === 0 || discountedCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FEE_CENTS;
  const totalCents = discountedCents + shippingCents;
  const vatIncludedCents = Math.round((totalCents * VAT_RATE_PERCENT) / (100 + VAT_RATE_PERCENT));

  return { subtotalCents, discountCents, shippingCents, totalCents, vatIncludedCents };
}
