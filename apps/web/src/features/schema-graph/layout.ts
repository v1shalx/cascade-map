import dagre from '@dagrejs/dagre';
import type { Node, Edge } from 'reactflow';

const NODE_WIDTH = 220;
const NODE_HEIGHT_BASE = 80;
const NODE_HEIGHT_PER_COL = 24;

/**
 * Runs dagre top-down layout over the given nodes and edges.
 * Mutates x/y on each node's position. Returns the laid-out arrays.
 */
export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });

  for (const node of nodes) {
    const colCount = (node.data as { columnCount?: number }).columnCount ?? 3;
    const height = NODE_HEIGHT_BASE + colCount * NODE_HEIGHT_PER_COL;
    g.setNode(node.id, { width: NODE_WIDTH, height });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const laidOutNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT_BASE / 2,
      },
    };
  });

  return { nodes: laidOutNodes, edges };
}
