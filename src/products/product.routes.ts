import { Router } from "express";
import { applyCampaignDiscount } from "../payment/discounts.js";
import { parsePagination } from "../validation.js";
import { parseProductInput, parseProductPatch } from "./product.js";
import type { ProductRepository } from "./product.repository.js";

export function productRouter(products: ProductRepository): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const { limit, offset } = parsePagination(req.query);
    res.json({ ...products.list(limit, offset), limit, offset });
  });

  router.get("/:id", (req, res) => {
    res.json(products.get(req.params.id));
  });

  router.post("/", (req, res) => {
    const product = products.create(parseProductInput(req.body));
    res.status(201).location(`/products/${product.id}`).json(product);
  });

  router.post("/discounts", (req, res) => {
    const { productIds, percent } = req.body;
    res.json({ items: applyCampaignDiscount(products, { productIds, percent }) });
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
