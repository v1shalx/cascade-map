interface RowPopupProps {
  table: string;
  id: number;
  data: Record<string, unknown> | null;
  loading: boolean;
  onClose: () => void;
}

/**
 * Click-to-inspect popup — shows a single row's data.
 */
export function RowPopup({ table, id, data, loading, onClose }: RowPopupProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-lg"
          aria-label="Close"
        >
          ✕
        </button>

        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
          {table}
        </h3>
        <p className="text-2xl font-bold text-slate-800 mb-4">Row #{id}</p>

        {loading && (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-slate-100 rounded" />
            ))}
          </div>
        )}

        {!loading && data && (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {Object.entries(data).map(([key, val]) => (
                <tr key={key}>
                  <td className="py-1.5 pr-4 font-mono text-slate-500 w-1/3">{key}</td>
                  <td className="py-1.5 text-slate-800 break-all">
                    {val === null ? (
                      <span className="text-slate-400 italic">null</span>
                    ) : (
                      String(val)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
