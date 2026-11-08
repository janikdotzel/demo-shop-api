/**
 * Error type for every expected API failure.
 * The error handler in app.ts turns it into `{ error: { code, message, details? } }`.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function notFound(resource: string, id: string): HttpError {
  return new HttpError(404, "not_found", `${resource} ${id} not found`);
}

export function validationError(details: Record<string, string>): HttpError {
  return new HttpError(400, "validation_error", "Request body is invalid", details);
}
