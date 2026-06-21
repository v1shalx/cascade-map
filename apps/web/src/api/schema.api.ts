import type { SchemaResponse } from '@cascade-map/shared';
import { apiFetch } from './client';

export function fetchSchema(): Promise<SchemaResponse> {
  return apiFetch<SchemaResponse>('/api/schema');
}
