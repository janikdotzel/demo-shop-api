import request from "supertest";
import { createApp, createDependencies } from "../src/app.js";
import type { ProductInput } from "../src/products/product.js";

export function setup() {
  const deps = createDependencies();
  const app = createApp(deps);
  const api = request(app);

  async function createProduct(overrides: Partial<ProductInput> = {}) {
    const res = await api
      .post("/products")
      .send({ sku: "TV-1000", name: "Smart TV", priceCents: 49_900, stock: 10, ...overrides })
      .expect(201);
    return res.body as { id: string } & ProductInput;
  }

  return { deps, api, createProduct };
}
