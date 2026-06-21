import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { TableNodeData } from '../features/schema-graph/schemaToFlow';

/**
 * Presentational component — pure render, no logic.
 * Logic lives in the hook / feature layer.
 */
function TableNodeComponent({ data }: NodeProps<TableNodeData>): JSX.Element {
  const borderClass = data.isFlagged
    ? 'border-2 border-amber-400 shadow-amber-200'
    : data.isHit
    ? 'border-2 border-red-500 shadow-red-200'
    : 'border border-slate-200';

  const headerClass = data.isHit
    ? 'bg-red-500 text-white'
    : data.isFlagged
    ? 'bg-amber-400 text-white'
    : 'bg-slate-700 text-white';

  return (
    <div
      className={`rounded-lg shadow-md overflow-hidden min-w-[200px] bg-white ${borderClass} ${
        data.isHit ? 'node-cascade-hit' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />

      {/* Table name header */}
      <div className={`px-3 py-2 text-sm font-semibold ${headerClass}`}>
        {data.isFlagged && <span className="mr-1">⚠</span>}
        {data.label}
      </div>

      {/* Columns */}
      <div className="divide-y divide-slate-100">
        {data.columns.map((col: { name: string; dataType: string; isNullable: boolean }) => (
          <div
            key={col.name}
            className="px-3 py-1 flex justify-between text-xs text-slate-600 hover:bg-slate-50"
          >
            <span className="font-mono">{col.name}</span>
            <span className="text-slate-400 ml-2">{col.dataType}</span>
          </div>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
}

export const TableNode = memo(TableNodeComponent);
