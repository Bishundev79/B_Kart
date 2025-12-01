import { NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}

export interface ApiSuccess<T = any> {
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Standard error response format
 */
export function errorResponse(
  message: string,
  status: number = 400,
  code?: string,
  details?: any
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error: message,
      code,
      details,
    },
    { status }
  );
}

/**
 * Standard success response format
 */
export function successResponse<T = any>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      data,
      message,
    },
    { status }
  );
}

/**
 * Unauthorized response (401)
 */
export function unauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<ApiError> {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

/**
 * Forbidden response (403)
 */
export function forbiddenResponse(
  message: string = 'Forbidden'
): NextResponse<ApiError> {
  return errorResponse(message, 403, 'FORBIDDEN');
}

/**
 * Not found response (404)
 */
export function notFoundResponse(
  message: string = 'Not found'
): NextResponse<ApiError> {
  return errorResponse(message, 404, 'NOT_FOUND');
}

/**
 * Validation error response (400)
 */
export function validationErrorResponse(
  message: string,
  details?: any
): NextResponse<ApiError> {
  return errorResponse(message, 400, 'VALIDATION_ERROR', details);
}

/**
 * Server error response (500)
 */
export function serverErrorResponse(
  message: string = 'Internal server error'
): NextResponse<ApiError> {
  return errorResponse(message, 500, 'SERVER_ERROR');
}

/**
 * Conflict response (409)
 */
export function conflictResponse(
  message: string
): NextResponse<ApiError> {
  return errorResponse(message, 409, 'CONFLICT');
}
