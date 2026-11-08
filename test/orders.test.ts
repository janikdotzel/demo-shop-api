import { describe, expect, it } from "vitest";
import { setup } from "./helpers.js";

describe("orders API", () => {
  it("places an order, reserves stock and calculates totals", async () => {
    const { api, createProduct } = setup();
    const tv = await createProduct({ sku: "TV-1", priceCents: 49_900, stock: 5 });

    const res = await api.post("/orders").send({ items: [{ productId: tv.id, quantity: 2 }] }).expect(201);
    expect(res.body.status).toBe("placed");
    expect(res.body.totals).toEqual({
      subtotalCents: 99_800,
      discountCents: 0,
      shippingCents: 0,
      totalCents: 99_800,
      vatIncludedCents: 16_633,
    });

    const product = await api.get(`/products/${tv.id}`).expect(200);
    expect(product.body.stock).toBe(3);
  });

  it("applies coupons case-insensitively", async () => {
    const { api, createProduct } = setup();
    const p = await createProduct({ priceCents: 10_000 });
    const res = await api
      .post("/orders")
      .send({ items: [{ productId: p.id, quantity: 1 }], couponCode: "welcome10" })
      .expect(201);
    expect(res.body.couponCode).toBe("WELCOME10");
    expect(res.body.totals.discountCents).toBe(1_000);
  });

  it("rejects unknown coupons without reserving stock", async () => {
    const { api, createProduct } = setup();
    const p = await createProduct({ stock: 2 });
    const res = await api
      .post("/orders")
      .send({ items: [{ productId: p.id, quantity: 1 }], couponCode: "FREE100" })
      .expect(422);
    expect(res.body.error.code).toBe("invalid_coupon");
    const product = await api.get(`/products/${p.id}`).expect(200);
    expect(product.body.stock).toBe(2);
  });

  it("rejects orders that exceed stock without partial reservation", async () => {
    const { api, createProduct } = setup();
    const a = await createProduct({ sku: "A-1", stock: 5 });
    const b = await createProduct({ sku: "B-1", stock: 1 });
    await api
      .post("/orders")
      .send({ items: [{ productId: a.id, quantity: 2 }, { productId: b.id, quantity: 3 }] })
      .expect(409);
    const product = await api.get(`/products/${a.id}`).expect(200);
    expect(product.body.stock).toBe(5);
  });

  it("validates order items", async () => {
    const { api } = setup();
    await api.post("/orders").send({ items: [] }).expect(400);
    await api.post("/orders").send({ items: [{ productId: "x", quantity: 0 }] }).expect(400);
  });

  it("cancels an order once and returns the stock", async () => {
    const { api, createProduct } = setup();
    const p = await createProduct({ stock: 4 });
    const order = await api.post("/orders").send({ items: [{ productId: p.id, quantity: 3 }] }).expect(201);

    const cancelled = await api.post(`/orders/${order.body.id}/cancel`).expect(200);
    expect(cancelled.body.status).toBe("cancelled");
    expect((await api.get(`/products/${p.id}`)).body.stock).toBe(4);

    await api.post(`/orders/${order.body.id}/cancel`).expect(409);
  });
});
