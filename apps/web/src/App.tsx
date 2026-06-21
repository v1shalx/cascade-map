import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useSchemaGraph } from './hooks/useSchemaGraph';
import { useCascadeSimulation } from './hooks/useCascadeSimulation';
import { useIsolationCheck } from './hooks/useIsolationCheck';
import { schemaToFlow } from './features/schema-graph/schemaToFlow';

import { TableNode } from './components/TableNode';
import { CascadeControls } from './components/CascadeControls';
import { RowPopup } from './components/RowPopup';
import { SqlPanel } from './components/SqlPanel';
import { IsolationToggle } from './components/IsolationToggle';

const NODE_TYPES = { tableNode: TableNode };

export function App(): JSX.Element {
  const { schema, loading: schemaLoading, error: schemaError } = useSchemaGraph();
  const cascade = useCascadeSimulation();
  const isolation = useIsolationCheck();

  const flaggedTables = useMemo(() => {
    if (!isolation.visible || !isolation.result) return new Set<string>();
    return new Set(isolation.result.flagged.map((f: { table: string }) => f.table));
  }, [isolation.visible, isolation.result]);

  // Re-derive flow nodes/edges whenever hit state or isolation changes
  const flowData = useMemo(() => {
    if (!schema) return { nodes: [], edges: [] };
    return schemaToFlow(schema, cascade.hitIds, flaggedTables);
  }, [schema, cascade.hitIds, flaggedTables]);

  const [nodes, , onNodesChange] = useNodesState(flowData.nodes);
  const [edges, , onEdgesChange] = useEdgesState(flowData.edges);

  // Sync nodes when flowData changes (hit state / isolation toggle)
  const syncedNodes = useMemo(
    () =>
      nodes.map((n: { id: string; data: unknown; position: unknown }) => {
        const updated = flowData.nodes.find((fn: { id: string }) => fn.id === n.id);
        return updated ? { ...n, data: updated.data } : n;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flowData.nodes],
  );

  const handleNodeClick = useCallback(
    (_: unknown, node: { id: string }) => {
      const hitSet = cascade.hitIds.get(node.id);
      if (hitSet && hitSet.size > 0) {
        const firstId = [...hitSet][0];
        if (firstId !== undefined) cascade.openPopup(node.id, firstId);
      }
    },
    [cascade],
  );

  if (schemaLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="space-y-3 w-64 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded" />
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <p className="text-slate-400 text-sm text-center pt-2">Loading schema…</p>
        </div>
      </div>
    );
  }

  if (schemaError) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <p className="text-red-600 font-medium">Failed to connect to the API</p>
          <p className="text-slate-500 text-sm mt-1">{schemaError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-slate-900 text-white">
        <div>
          <h1 className="text-lg font-bold tracking-tight">cascade-map</h1>
          <p className="text-xs text-slate-400">Postgres FK visualizer + cascade simulator</p>
        </div>
        <IsolationToggle
          visible={isolation.visible}
          loading={isolation.loading}
          result={isolation.result}
          onToggle={isolation.toggle}
        />
      </header>

      {/* Cascade preset controls */}
      <CascadeControls
        schema={schema}
        status={cascade.status}
        totalAffected={cascade.totalAffected}
        onSimulate={cascade.simulate}
        onReset={cascade.reset}
      />

      {/* React-flow canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={syncedNodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.5}
          attributionPosition="bottom-right"
        >
          <Background color="#e2e8f0" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(node: { data: unknown }) => {
              const d = node.data as { isHit?: boolean; isFlagged?: boolean };
              if (d.isHit) return '#ef4444';
              if (d.isFlagged) return '#f59e0b';
              return '#94a3b8';
            }}
          />
        </ReactFlow>
      </div>

      {/* SQL panel — only shown after simulation completes */}
      {cascade.status === 'done' && schema && (
        <SqlPanel
          loading={cascade.scriptLoading}
          script={cascade.script}
          onGenerate={(mode: 'hard' | 'soft') => {
            // Find the root — use first hit table (always the simulated root)
            const rootTable = [...cascade.hitIds.keys()][0];
            const rootId = rootTable
              ? [...(cascade.hitIds.get(rootTable) ?? [])][0]
              : undefined;
            if (rootTable && rootId !== undefined) {
              cascade.generateScript(rootTable, rootId, mode);
            }
          }}
        />
      )}

      {/* Row popup */}
      {cascade.popup && (
        <RowPopup
          table={cascade.popup.table}
          id={cascade.popup.id}
          data={cascade.popup.data}
          loading={cascade.popup.loading}
          onClose={cascade.closePopup}
        />
      )}
    </div>
  );
}
