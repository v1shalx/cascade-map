import type { ApiErrorResponse } from '@cascade-map/shared';

const BASE_URL = import.meta.env['VITE_API_URL'] ?? '';

class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly error: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);

  if (!res.ok) {
    const body = (await res.json().catch(() => ({
      statusCode: res.status,
      message: res.statusText,
      error: 'Unknown',
    }))) as ApiErrorResponse;
    throw new ApiError(body.statusCode, body.message, body.error);
  }

  return res.json() as Promise<T>;
}

export { apiFetch, ApiError };
