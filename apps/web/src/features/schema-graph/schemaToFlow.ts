import type { Node, Edge } from 'reactflow';
import type { SchemaResponse } from '@cascade-map/shared';
import { applyDagreLayout } from './layout';

export interface TableNodeData {
  label: string;
  columns: Array<{ name: string; dataType: string; isNullable: boolean }>;
  columnCount: number;
  isHit: boolean;
  isFlagged: boolean;
}

/**
 * Converts a SchemaResponse into react-flow nodes and edges,
 * then applies dagre layout.
 */
export function schemaToFlow(
  schema: SchemaResponse,
  hitIds: Map<string, Set<number>>,
  flaggedTables: Set<string>,
): { nodes: Node<TableNodeData>[]; edges: Edge[] } {
  const nodes: Node<TableNodeData>[] = schema.tables.map((table: SchemaResponse['tables'][number]) => ({
    id: table.name,
    type: 'tableNode',
    position: { x: 0, y: 0 }, // overwritten by dagre
    data: {
      label: table.name,
      columns: table.columns,
      columnCount: table.columns.length,
      isHit: (hitIds.get(table.name)?.size ?? 0) > 0,
      isFlagged: flaggedTables.has(table.name),
    },
  }));

  const edges: Edge[] = schema.relationships.map((rel: SchemaResponse['relationships'][number], i: number) => ({
    id: `edge-${i}-${rel.from}-${rel.fromCol}-${rel.to}`,
    source: rel.from,
    target: rel.to,
    label: `${rel.fromCol} → ${rel.toCol}`,
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#94a3b8' },
    labelStyle: { fontSize: 10, fill: '#64748b' },
    markerEnd: { type: 'arrowclosed' as const },
  }));

  return applyDagreLayout(nodes, edges) as {
    nodes: Node<TableNodeData>[];
    edges: Edge[];
  };
}
