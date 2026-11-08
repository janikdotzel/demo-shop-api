import { describe, expect, it } from "vitest";
import { setup } from "./helpers.js";

describe("products API", () => {
  it("creates, reads, updates and deletes a product", async () => {
    const { api, createProduct } = setup();
    const created = await createProduct();

    const read = await api.get(`/products/${created.id}`).expect(200);
    expect(read.body).toMatchObject({ sku: "TV-1000", name: "Smart TV", priceCents: 49_900, stock: 10 });

    const updated = await api.patch(`/products/${created.id}`).send({ priceCents: 44_900 }).expect(200);
    expect(updated.body.priceCents).toBe(44_900);

    await api.delete(`/products/${created.id}`).expect(204);
    await api.get(`/products/${created.id}`).expect(404);
  });

  it("lists products with pagination", async () => {
    const { api, createProduct } = setup();
    await createProduct({ sku: "A-001" });
    await createProduct({ sku: "A-002" });
    await createProduct({ sku: "A-003" });

    const page = await api.get("/products?limit=2&offset=1").expect(200);
    expect(page.body.total).toBe(3);
    expect(page.body.items.map((p: { sku: string }) => p.sku)).toEqual(["A-002", "A-003"]);
  });

  it("rejects invalid pagination", async () => {
    const { api } = setup();
    const res = await api.get("/products?limit=500").expect(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("validates the request body", async () => {
    const { api } = setup();
    const res = await api.post("/products").send({ sku: "x", name: "", priceCents: 9.99, stock: -1 }).expect(400);
    expect(Object.keys(res.body.error.details).sort()).toEqual(["name", "priceCents", "sku", "stock"]);
  });

  it("rejects duplicate SKUs", async () => {
    const { createProduct, api } = setup();
    await createProduct({ sku: "DUP-1" });
    const res = await api.post("/products").send({ sku: "DUP-1", name: "Other", priceCents: 100, stock: 1 }).expect(409);
    expect(res.body.error.code).toBe("conflict");
  });

  it("does not allow changing the SKU", async () => {
    const { createProduct, api } = setup();
    const created = await createProduct();
    await api.patch(`/products/${created.id}`).send({ sku: "NEW-1" }).expect(400);
  });

  it("returns invalid_json for malformed bodies", async () => {
    const { api } = setup();
    const res = await api.post("/products").set("Content-Type", "application/json").send("{oops").expect(400);
    expect(res.body.error.code).toBe("invalid_json");
  });
});
