import { useCallback, useState } from 'react';
import { fetchIsolationCheck } from '../api/isolation.api';
import type { IsolationCheckResponse } from '@cascade-map/shared';

interface UseIsolationCheckResult {
  result: IsolationCheckResponse | null;
  loading: boolean;
  error: string | null;
  visible: boolean;
  toggle: () => void;
}

export function useIsolationCheck(): UseIsolationCheckResult {
  const [result, setResult] = useState<IsolationCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const toggle = useCallback(() => {
    setVisible((prev: boolean) => {
      const next = !prev;
      // Fetch on first open only
      if (next && !result && !loading) {
        setLoading(true);
        fetchIsolationCheck()
          .then((data: IsolationCheckResponse) => {
            setResult(data);
            setLoading(false);
          })
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : 'Failed to run isolation check');
            setLoading(false);
          });
      }
      return next;
    });
  }, [result, loading]);

  return { result, loading, error, visible, toggle };
}
