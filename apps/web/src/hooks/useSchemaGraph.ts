import { useEffect, useState } from 'react';
import { fetchSchema } from '../api/schema.api';
import type { SchemaResponse } from '@cascade-map/shared';

interface UseSchemaGraphResult {
  schema: SchemaResponse | null;
  loading: boolean;
  error: string | null;
}

export function useSchemaGraph(): UseSchemaGraphResult {
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchSchema()
      .then((data: SchemaResponse) => {
        if (!cancelled) {
          setSchema(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load schema');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { schema, loading, error };
}
