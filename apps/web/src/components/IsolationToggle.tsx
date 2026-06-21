import type { IsolationCheckResponse } from '@cascade-map/shared';

interface IsolationToggleProps {
  visible: boolean;
  loading: boolean;
  result: IsolationCheckResponse | null;
  onToggle: () => void;
}

/**
 * Toggle button + summary panel for the tenant isolation check.
 */
export function IsolationToggle({
  visible,
  loading,
  result,
  onToggle,
}: IsolationToggleProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onToggle}
        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
          visible
            ? 'bg-amber-400 border-amber-400 text-white'
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
        }`}
      >
        {loading ? 'Checking…' : '⚠ Isolation check'}
      </button>

      {visible && result && (
        <div className="absolute top-16 right-4 z-40 bg-white border border-slate-200
                        rounded-xl shadow-xl p-4 w-72 text-sm">
          <p className="font-semibold text-slate-800 mb-2">Tenant isolation report</p>

          {result.flagged.length === 0 ? (
            <p className="text-green-700 bg-green-50 rounded p-2">
              ✓ All tables are properly tenant-scoped
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-amber-700 font-medium">
                {result.flagged.length} table{result.flagged.length > 1 ? 's' : ''} flagged
              </p>
              {result.flagged.map((f: { table: string; reason: string }) => (
                <div key={f.table} className="bg-amber-50 border border-amber-200 rounded p-2">
                  <p className="font-mono font-semibold text-amber-900">{f.table}</p>
                  <p className="text-amber-700 text-xs mt-0.5">{f.reason}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-slate-400 text-xs mt-3">
            {result.safe.length} table{result.safe.length !== 1 ? 's' : ''} safe:{' '}
            {result.safe.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
