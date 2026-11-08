import { randomUUID } from "node:crypto";
import { HttpError, notFound } from "../http-error.js";
import { calculateTotals } from "../payment/pricing.js";
import type { ProductRepository } from "../products/product.repository.js";
import type { Order, OrderInput, OrderLine } from "./order.js";

export class OrderService {
  private readonly orders = new Map<string, Order>();

  constructor(private readonly products: ProductRepository) {}

  get(id: string): Order {
    const order = this.orders.get(id);
    if (!order) throw notFound("Order", id);
    return order;
  }

  /**
   * Places an order. All products and stock levels are checked before any stock
   * is reserved, so a failed order never leaves stock partially reserved.
   */
  place(input: OrderInput): Order {
    const lines: OrderLine[] = input.items.map(({ productId, quantity }) => {
      const product = this.products.get(productId);
      if (product.stock < quantity) {
        throw new HttpError(409, "insufficient_stock", `Only ${product.stock} units of ${product.sku} left`);
      }
      return {
        productId,
        sku: product.sku,
        name: product.name,
        unitPriceCents: product.priceCents,
        quantity,
        lineTotalCents: product.priceCents * quantity,
      };
    });

    const totals = calculateTotals(lines, input.couponCode);

    for (const line of lines) {
      this.products.reserveStock(line.productId, line.quantity);
    }

    const now = new Date().toISOString();
    const order: Order = {
      id: randomUUID(),
      status: "placed",
      lines,
      ...(input.couponCode === undefined ? {} : { couponCode: input.couponCode.trim().toUpperCase() }),
      totals,
      createdAt: now,
      updatedAt: now,
    };
    this.orders.set(order.id, order);
    return order;
  }

  /** Cancels a placed order and returns its stock. Cancelling twice is rejected. */
  cancel(id: string): Order {
    const order = this.get(id);
    if (order.status === "cancelled") {
      throw new HttpError(409, "already_cancelled", `Order ${id} is already cancelled`);
    }
    for (const line of order.lines) {
      const product = this.products.get(line.productId);
      this.products.update(product.id, { stock: product.stock + line.quantity });
    }
    const cancelled: Order = { ...order, status: "cancelled", updatedAt: new Date().toISOString() };
    this.orders.set(id, cancelled);
    return cancelled;
  }
}
