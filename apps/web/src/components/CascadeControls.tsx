import type { SchemaResponse } from '@cascade-map/shared';

interface PresetRow {
  label: string;
  table: string;
  id: number;
}

const PRESETS: PresetRow[] = [
  { label: 'Delete Tenant: Acme Corp', table: 'tenants', id: 1 },
  { label: 'Delete Tenant: Globex Industries', table: 'tenants', id: 2 },
  { label: 'Delete User: Alice Nguyen', table: 'users', id: 1 },
];

interface CascadeControlsProps {
  schema: SchemaResponse | null;
  status: 'idle' | 'loading' | 'animating' | 'done' | 'error';
  totalAffected: number;
  onSimulate: (table: string, id: number) => void;
  onReset: () => void;
}

/**
 * Presentational — preset buttons + status bar.
 */
export function CascadeControls({
  schema,
  status,
  totalAffected,
  onSimulate,
  onReset,
}: CascadeControlsProps): JSX.Element {
  const isRunning = status === 'loading' || status === 'animating';

  return (
    <div className="flex flex-col gap-3 p-4 bg-white border-b border-slate-200">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-slate-600 mr-1">Try it:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onSimulate(preset.table, preset.id)}
            disabled={isRunning || !schema}
            className="px-3 py-1.5 text-sm bg-slate-800 text-white rounded-md
                       hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors"
          >
            {preset.label}
          </button>
        ))}

        {(status === 'done' || status === 'error' || status === 'animating') && (
          <button
            onClick={onReset}
            className="ml-auto px-3 py-1.5 text-sm border border-slate-300 rounded-md
                       hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Status bar */}
      {status !== 'idle' && (
        <div
          className={`text-sm font-medium px-3 py-2 rounded-md ${
            status === 'error'
              ? 'bg-red-50 text-red-700'
              : status === 'done'
              ? 'bg-red-100 text-red-800'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {status === 'loading' && 'Running cascade simulation…'}
          {status === 'animating' && `Cascading… ${totalAffected} rows affected so far`}
          {status === 'done' && `This delete affects ${totalAffected} rows across ${schema?.tables.length ?? 0} tables`}
          {status === 'error' && 'Simulation failed — check the console'}
        </div>
      )}
    </div>
  );
}
