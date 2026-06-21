import type { IsolationCheckResponse } from '@cascade-map/shared';
import { apiFetch } from './client';

export function fetchIsolationCheck(): Promise<IsolationCheckResponse> {
  return apiFetch<IsolationCheckResponse>('/api/isolation-check');
}
