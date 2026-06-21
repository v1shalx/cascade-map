/**
 * One BFS "wave" in a cascade simulation.
 * Each wave represents rows discovered at a given FK-hop depth.
 */
export interface CascadeWave {
    depth: number;
    table: string;
    ids: number[];
    /** True when the table had more matching rows than MAX_ROWS_PER_TABLE */
    truncated: boolean;
}
/**
 * Response shape for GET /cascade?table=&id=
 */
export interface CascadeResponse {
    root: {
        table: string;
        id: number;
    };
    waves: CascadeWave[];
    totalAffected: number;
}
/**
 * Response shape for GET /cascade/script?table=&id=&mode=
 */
export interface CascadeScriptResponse {
    mode: 'hard' | 'soft';
    sql: string;
}
/**
 * Lightweight row details for the click-to-inspect popup.
 * GET /row-details?table=&id=
 */
export type RowDetailsResponse = Record<string, unknown>;
//# sourceMappingURL=cascade.types.d.ts.map