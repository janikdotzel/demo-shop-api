import { describe, expect, it } from "vitest";
import { calculateTotals, findCoupon, SHIPPING_FEE_CENTS } from "../src/payment/pricing.js";

describe("calculateTotals", () => {
  it("charges shipping below the free-shipping threshold", () => {
    const totals = calculateTotals([{ unitPriceCents: 1_999, quantity: 2 }]);
    expect(totals.shippingCents).toBe(SHIPPING_FEE_CENTS);
    expect(totals.totalCents).toBe(3_998 + SHIPPING_FEE_CENTS);
  });

  it("ships for free from 50 euros after discount", () => {
    expect(calculateTotals([{ unitPriceCents: 5_000, quantity: 1 }]).shippingCents).toBe(0);
    // 55.00 - 10% = 49.50, so shipping applies again
    expect(calculateTotals([{ unitPriceCents: 5_500, quantity: 1 }], "WELCOME10").shippingCents).toBe(
      SHIPPING_FEE_CENTS,
    );
  });

  it("caps the coupon discount", () => {
    const totals = calculateTotals([{ unitPriceCents: 100_000, quantity: 1 }], "WELCOME10");
    expect(totals.discountCents).toBe(2_000);
  });

  it("computes the included VAT on the final total", () => {
    const totals = calculateTotals([{ unitPriceCents: 12_000, quantity: 1 }]);
    expect(totals.vatIncludedCents).toBe(2_000);
  });

  it("keeps every amount an integer", () => {
    const totals = calculateTotals([{ unitPriceCents: 333, quantity: 3 }], "VIP20");
    for (const value of Object.values(totals)) {
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe("findCoupon", () => {
  it("rejects unknown codes", () => {
    expect(() => findCoupon("NOPE")).toThrowError(/not valid/);
  });
});
