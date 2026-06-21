import { useState } from 'react';
import type { CascadeScriptResponse } from '@cascade-map/shared';

interface SqlPanelProps {
  loading: boolean;
  script: CascadeScriptResponse | null;
  onGenerate: (mode: 'hard' | 'soft') => void;
}

/**
 * SQL script panel — mode toggle, generate button, copyable code block.
 */
export function SqlPanel({ loading, script, onGenerate }: SqlPanelProps): JSX.Element {
  const [mode, setMode] = useState<'hard' | 'soft'>('hard');
  const [copied, setCopied] = useState(false);

  function handleCopy(): void {
    if (!script) return;
    void navigator.clipboard.writeText(script.sql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="border-t border-slate-200 p-4 bg-slate-50">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-medium text-slate-700">Generate safe-delete SQL</span>

        {/* Mode toggle */}
        <div className="flex rounded-md border border-slate-300 overflow-hidden text-sm">
          {(['hard', 'soft'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 ${
                mode === m
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {m === 'hard' ? 'Hard delete' : 'Soft delete'}
            </button>
          ))}
        </div>

        <button
          onClick={() => onGenerate(mode)}
          disabled={loading}
          className="px-3 py-1 text-sm bg-red-600 text-white rounded-md
                     hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>

        {script && (
          <button
            onClick={handleCopy}
            className="ml-auto px-3 py-1 text-sm border border-slate-300 rounded-md
                       hover:bg-white transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        )}
      </div>

      {script && (
        <pre className="text-xs font-mono bg-slate-900 text-green-400 rounded-lg p-4
                        overflow-auto max-h-64 leading-relaxed">
          {script.sql}
        </pre>
      )}
    </div>
  );
}
