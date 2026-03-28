import { NextResponse } from "next/server";

export type AppErrorCode =
  | "bad_request"
  | "internal_error"
  | "not_found"
  | "rate_limited"
  | "upstream_unavailable";

interface AppErrorOptions {
  cause?: unknown;
  code: AppErrorCode;
  headers?: HeadersInit;
  message: string;
  status: number;
}

export class AppError extends Error {
  readonly cause?: unknown;
  readonly code: AppErrorCode;
  readonly headers?: HeadersInit;
  readonly status: number;

  constructor({ code, message, status, headers, cause }: AppErrorOptions) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.headers = headers;
    this.cause = cause;
  }
}

export function badRequest(message: string, cause?: unknown) {
  return new AppError({
    code: "bad_request",
    message,
    status: 400,
    cause,
  });
}

export function notFound(message: string, cause?: unknown) {
  return new AppError({
    code: "not_found",
    message,
    status: 404,
    cause,
  });
}

export function rateLimited(message: string, retryAfterSeconds: number) {
  return new AppError({
    code: "rate_limited",
    message,
    status: 429,
    headers: {
      "Retry-After": String(retryAfterSeconds),
    },
  });
}

export function upstreamUnavailable(message: string, cause?: unknown) {
  return new AppError({
    code: "upstream_unavailable",
    message,
    status: 503,
    cause,
  });
}

export function internalError(
  message = "Something went wrong. Please try again.",
  cause?: unknown
) {
  return new AppError({
    code: "internal_error",
    message,
    status: 500,
    cause,
  });
}

export function asAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return internalError(undefined, error);
}

export function errorResponse(error: unknown) {
  const appError = asAppError(error);
  return NextResponse.json(
    {
      error: appError.message,
      code: appError.code,
    },
    {
      status: appError.status,
      headers: {
        "Cache-Control": "no-store",
        ...(appError.headers ?? {}),
      },
    }
  );
}
