/**
 * A table flagged as potentially leaking across tenant boundaries.
 */
export interface FlaggedTable {
  table: string;
  reason: string;
}

/**
 * Response shape for GET /isolation-check
 */
export interface IsolationCheckResponse {
  safe: string[];
  flagged: FlaggedTable[];
}
