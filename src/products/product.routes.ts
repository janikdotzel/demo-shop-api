import { Router } from "express";
import { validationError } from "../http-error.js";
import { parsePagination } from "../validation.js";
import { parseProductInput, parseProductPatch } from "./product.js";
import type { ProductRepository } from "./product.repository.js";

export function productRouter(products: ProductRepository): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const { limit, offset } = parsePagination(req.query);
    res.json({ ...products.list(limit, offset), limit, offset });
  });

  router.get("/search", (req, res) => {
    const q = (req.query.q as string).trim();
    if (q.length === 0 || q.length > 100) {
      throw validationError({ q: "must be between 1 and 100 characters" });
    }
    const { limit, offset } = parsePagination(req.query);
    res.json({ ...products.search(q, limit, offset), limit, offset });
  });

  router.get("/:id", (req, res) => {
    res.json(products.get(req.params.id));
  });

  router.post("/", (req, res) => {
    const product = products.create(parseProductInput(req.body));
    res.status(201).location(`/products/${product.id}`).json(product);
  });

  router.patch("/:id", (req, res) => {
    res.json(products.update(req.params.id, parseProductPatch(req.body)));
  });

  router.delete("/:id", (req, res) => {
    products.delete(req.params.id);
    res.status(204).end();
  });

  return router;
}
