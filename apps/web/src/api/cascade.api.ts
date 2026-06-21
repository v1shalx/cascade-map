import type { CascadeResponse, CascadeScriptResponse, RowDetailsResponse } from '@cascade-map/shared';
import { apiFetch } from './client';

export function fetchCascade(table: string, id: number): Promise<CascadeResponse> {
  return apiFetch<CascadeResponse>(`/api/cascade?table=${encodeURIComponent(table)}&id=${id}`);
}

export function fetchCascadeScript(
  table: string,
  id: number,
  mode: 'hard' | 'soft',
): Promise<CascadeScriptResponse> {
  return apiFetch<CascadeScriptResponse>(
    `/api/cascade/script?table=${encodeURIComponent(table)}&id=${id}&mode=${mode}`,
  );
}

export function fetchRowDetails(table: string, id: number): Promise<RowDetailsResponse> {
  return apiFetch<RowDetailsResponse>(
    `/api/row-details?table=${encodeURIComponent(table)}&id=${id}`,
  );
}
