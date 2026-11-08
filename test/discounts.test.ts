import { describe, expect, it } from "vitest";
import { setup } from "./helpers.js";

describe("campaign discounts", () => {
  it("applies a campaign discount", async () => {
    const { api, createProduct } = setup();
    const product = await createProduct({ priceCents: 10_000 });

    const res = await api.post("/products/discounts").send({ productIds: [product.id], percent: 10 }).expect(200);

    expect(res.body.items[0].priceCents).toBe(9_000);
  });
});
