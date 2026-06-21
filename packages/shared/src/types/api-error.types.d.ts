/**
 * Standard error shape returned by the API global exception filter.
 * Every error — validation, not-found, internal — uses this shape.
 */
export interface ApiErrorResponse {
    statusCode: number;
    message: string;
    error: string;
}
//# sourceMappingURL=api-error.types.d.ts.map