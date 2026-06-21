import { useCallback, useState } from 'react';
import { fetchCascade, fetchCascadeScript, fetchRowDetails } from '../api/cascade.api';
import type { CascadeResponse, CascadeScriptResponse, RowDetailsResponse } from '@cascade-map/shared';

type SimulationStatus = 'idle' | 'loading' | 'animating' | 'done' | 'error';

interface RowPopup {
  table: string;
  id: number;
  data: RowDetailsResponse | null;
  loading: boolean;
}

interface UseCascadeSimulationResult {
  status: SimulationStatus;
  error: string | null;
  /** IDs hit so far, keyed by table — grows wave by wave during animation */
  hitIds: Map<string, Set<number>>;
  /** Current wave depth being animated (0 = nothing yet) */
  currentDepth: number;
  totalAffected: number;
  popup: RowPopup | null;
  script: CascadeScriptResponse | null;
  scriptLoading: boolean;
  simulate: (table: string, id: number) => void;
  reset: () => void;
  openPopup: (table: string, id: number) => void;
  closePopup: () => void;
  generateScript: (table: string, id: number, mode: 'hard' | 'soft') => void;
}

const WAVE_DELAY_MS = 600;

export function useCascadeSimulation(): UseCascadeSimulationResult {
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hitIds, setHitIds] = useState<Map<string, Set<number>>>(new Map());
  const [currentDepth, setCurrentDepth] = useState(0);
  const [totalAffected, setTotalAffected] = useState(0);
  const [popup, setPopup] = useState<RowPopup | null>(null);
  const [script, setScript] = useState<CascadeScriptResponse | null>(null);
  const [scriptLoading, setScriptLoading] = useState(false);

  const simulate = useCallback((table: string, id: number) => {
    setStatus('loading');
    setError(null);
    setHitIds(new Map());
    setCurrentDepth(0);
    setTotalAffected(0);
    setScript(null);

    fetchCascade(table, id)
      .then((result: CascadeResponse) => {
        setStatus('animating');
        // Animate waves sequentially
        animateWaves(result);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Simulation failed');
        setStatus('error');
      });
  }, []);

  function animateWaves(result: CascadeResponse): void {
    // Include root in hit set immediately
    setHitIds(new Map([[result.root.table, new Set([result.root.id])]]));

    const waves = result.waves;
    let waveIndex = 0;

    function nextWave(): void {
      if (waveIndex >= waves.length) {
        setStatus('done');
        setTotalAffected(result.totalAffected);
        return;
      }

      const wave = waves[waveIndex++];
      if (!wave) return;

      setCurrentDepth(wave.depth);
      setHitIds((prev: Map<string, Set<number>>) => {
        const next = new Map(prev);
        const existing = next.get(wave.table) ?? new Set<number>();
        wave.ids.forEach((id: number) => existing.add(id));
        next.set(wave.table, existing);
        return next;
      });
      setTotalAffected((prev: number) => prev + wave.ids.length);

      setTimeout(nextWave, WAVE_DELAY_MS);
    }

    setTimeout(nextWave, WAVE_DELAY_MS);
  }

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setHitIds(new Map());
    setCurrentDepth(0);
    setTotalAffected(0);
    setPopup(null);
    setScript(null);
  }, []);

  const openPopup = useCallback((table: string, id: number) => {
    setPopup({ table, id, data: null, loading: true });
    fetchRowDetails(table, id)
      .then((data: RowDetailsResponse) => setPopup({ table, id, data, loading: false }))
      .catch(() => setPopup((prev: RowPopup | null) => prev ? { ...prev, loading: false } : null));
  }, []);

  const closePopup = useCallback(() => setPopup(null), []);

  const generateScript = useCallback((table: string, id: number, mode: 'hard' | 'soft') => {
    setScriptLoading(true);
    setScript(null);
    fetchCascadeScript(table, id, mode)
      .then((data: CascadeScriptResponse) => {
        setScript(data);
        setScriptLoading(false);
      })
      .catch(() => setScriptLoading(false));
  }, []);

  return {
    status, error, hitIds, currentDepth, totalAffected,
    popup, script, scriptLoading,
    simulate, reset, openPopup, closePopup, generateScript,
  };
}
