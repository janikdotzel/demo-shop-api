import express, { type ErrorRequestHandler } from "express";
import { HttpError } from "./http-error.js";
import { orderRouter } from "./orders/order.routes.js";
import { OrderService } from "./orders/order.service.js";
import { ProductRepository } from "./products/product.repository.js";
import { productRouter } from "./products/product.routes.js";

export interface AppDependencies {
  products: ProductRepository;
  orders: OrderService;
}

export function createDependencies(): AppDependencies {
  const products = new ProductRepository();
  return { products, orders: new OrderService(products) };
}

export function createApp(deps: AppDependencies = createDependencies()) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/products", productRouter(deps.products));
  app.use("/orders", orderRouter(deps.orders));

  app.use((req, _res, next) => {
    next(new HttpError(404, "not_found", `Route ${req.method} ${req.path} not found`));
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
      return;
    }
    if (err instanceof SyntaxError && "status" in err && err.status === 400) {
      res.status(400).json({ error: { code: "invalid_json", message: "Request body is not valid JSON" } });
      return;
    }
    console.error(err);
    res.status(500).json({ error: { code: "internal_error", message: "Unexpected error" } });
  };
  app.use(errorHandler);

  return app;
}
