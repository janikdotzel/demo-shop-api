import { Router } from "express";
import { parseOrderInput } from "./order.js";
import type { OrderService } from "./order.service.js";

export function orderRouter(orders: OrderService): Router {
  const router = Router();

  router.post("/", (req, res) => {
    const order = orders.place(parseOrderInput(req.body));
    res.status(201).location(`/orders/${order.id}`).json(order);
  });

  router.get("/:id", (req, res) => {
    res.json(orders.get(req.params.id));
  });

  router.post("/:id/cancel", (req, res) => {
    res.json(orders.cancel(req.params.id));
  });

  return router;
}
