/**
 * A table flagged as potentially leaking across tenant boundaries.
 */
export interface FlaggedTable {
  table: string;
  reason: string;
}

/**
 * Response shape for GET /api/isolation-check
 */
export interface IsolationCheckResponse {
  safe: string[];
  flagged: FlaggedTable[];
}
