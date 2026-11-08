# Contributing

## Workflow

- Branch from `main` and name the branch after the ticket, for example `SHOP-101-product-search`.
- Put the ticket key in the PR title, for example `SHOP-101: Add product search`.
- Every PR needs green CI (`npm run typecheck` and `npm test`) and one human approval.
- The AI review agent comments on every PR. It never approves or blocks. Comment `/ai-review`
  to get a re-review after you pushed fixes.

## Code conventions

- **Money** is always an integer amount of euro cents (`priceCents`, `totalCents`). Never use
  floating point for money.
- **Validation** happens at the route boundary with the parsers in `src/**/<entity>.ts`. Every
  field coming from a request is checked for type, range and length.
- **Errors** are thrown as `HttpError` with a snake_case `code`. Do not send raw error messages
  or stack traces to clients.
- **List endpoints** paginate with `limit` (default 20, max 100) and `offset`.
- **Critical paths**: `src/payment/**` (pricing, discounts, VAT) and the public API contract in
  `src/**/*.routes.ts`. Changes there need unit tests for edge cases and a note in the PR description.
- **Tests**: new behaviour needs tests in `test/`. Use `setup()` from `test/helpers.ts` for API tests.
- **Secrets** never go into the code or the repository.
