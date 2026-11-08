import { randomUUID } from "node:crypto";
import { HttpError, notFound } from "../http-error.js";
import type { Product, ProductInput } from "./product.js";

/** In-memory product store. Replace with a database adapter behind the same interface. */
export class ProductRepository {
  private readonly products = new Map<string, Product>();

  list(limit: number, offset: number): { items: Product[]; total: number } {
    const all = [...this.products.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { items: all.slice(offset, offset + limit), total: all.length };
  }

  get(id: string): Product {
    const product = this.products.get(id);
    if (!product) throw notFound("Product", id);
    return product;
  }

  create(input: ProductInput): Product {
    if ([...this.products.values()].some((p) => p.sku === input.sku)) {
      throw new HttpError(409, "conflict", `SKU ${input.sku} already exists`);
    }
    const now = new Date().toISOString();
    const product: Product = { id: randomUUID(), ...input, createdAt: now, updatedAt: now };
    this.products.set(product.id, product);
    return product;
  }

  update(id: string, patch: Partial<Omit<ProductInput, "sku">>): Product {
    const updated: Product = { ...this.get(id), ...patch, updatedAt: new Date().toISOString() };
    this.products.set(id, updated);
    return updated;
  }

  delete(id: string): void {
    if (!this.products.delete(id)) throw notFound("Product", id);
  }

  /** Reserves stock for an order. Fails without side effects if stock is insufficient. */
  reserveStock(id: string, quantity: number): Product {
    const product = this.get(id);
    if (product.stock < quantity) {
      throw new HttpError(409, "insufficient_stock", `Only ${product.stock} units of ${product.sku} left`);
    }
    return this.update(id, { stock: product.stock - quantity });
  }
}
