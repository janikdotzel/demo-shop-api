# demo-shop-api

A small CRUD REST API for a demo shop, built with Express 5 and TypeScript.
It exists to test an AI pull request review agent: open a PR and the agent posts a
comment-only review (summary plus a few inline comments).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/products?limit=20&offset=0` | List products |
| GET | `/products/:id` | Get a product |
| POST | `/products` | Create a product (`sku`, `name`, `priceCents`, `stock`) |
| PATCH | `/products/:id` | Update `name`, `priceCents` or `stock` |
| DELETE | `/products/:id` | Delete a product |
| POST | `/orders` | Place an order (`items: [{ productId, quantity }]`, optional `couponCode`) |
| GET | `/orders/:id` | Get an order |
| POST | `/orders/:id/cancel` | Cancel an order and return its stock |

Data is kept in memory. Prices are gross euro cents with 20% VAT included.

## Errors

Every error response has the same shape:

```json
{ "error": { "code": "validation_error", "message": "Request validation failed", "details": { "name": "must be a non-empty string" } } }
```

| Status | Code | When |
|---|---|---|
| 400 | `validation_error` | The body or query is invalid. `details` names each invalid field |
| 400 | `invalid_json` | The body is not valid JSON |
| 404 | `not_found` | The product, order or route does not exist |
| 409 | `conflict` | The SKU already exists |
| 409 | `insufficient_stock` | Not enough stock for an order |
| 409 | `already_cancelled` | The order was cancelled before |
| 422 | `invalid_coupon` | The coupon code is unknown |

## AI review

`.github/workflows/ai-review.yml` starts a review task for every new PR. Comment
`/ai-review` on a PR to request a re-review after pushing fixes. Add the label
`no-ai-review` to skip a PR. See [CONTRIBUTING.md](CONTRIBUTING.md) for the conventions
the reviewer checks.
