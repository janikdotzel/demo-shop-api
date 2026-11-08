import { validationError } from "./http-error.js";

export type JsonObject = Record<string, unknown>;

export function requireObject(body: unknown): JsonObject {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw validationError({ body: "must be a JSON object" });
  }
  return body as JsonObject;
}

export function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

export function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/**
 * Parses `limit` and `offset` query parameters for list endpoints.
 * Defaults: limit 20, offset 0. The limit is capped at 100.
 */
export function parsePagination(query: Record<string, unknown>): { limit: number; offset: number } {
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  const details: Record<string, string> = {};
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    details.limit = "must be an integer between 1 and 100";
  }
  if (!Number.isInteger(offset) || offset < 0) {
    details.offset = "must be a non-negative integer";
  }
  if (Object.keys(details).length > 0) {
    throw validationError(details);
  }
  return { limit, offset };
}
