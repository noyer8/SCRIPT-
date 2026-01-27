import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';
import type { Script, ScriptNode, ScriptNodeData, NodeType, PlayerState } from '../types';
import { DEFAULT_SCRIPT } from '../types';

interface StoreState {
  // Scripts
  scripts: Script[];
  currentScriptId: string | null;

  // Editor state
  selectedNodeId: string | null;
  isPanelOpen: boolean;

  // Player state
  player: PlayerState;

  // Script CRUD
  createScript: () => string;
  duplicateScript: (id: string) => string;
  deleteScript: (id: string) => void;
  updateScript: (id: string, updates: Partial<Script>) => void;
  setCurrentScript: (id: string | null) => void;

  // Node operations
  getCurrentScript: () => Script | null;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, data: Partial<ScriptNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;

  // React Flow handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // Panel
  togglePanel: () => void;

  // Player
  startPlayer: () => void;
  stopPlayer: () => void;
  goToNode: (nodeId: string) => void;
  goBack: () => void;
  updatePlayerNotes: (notes: string) => void;
}

const getDefaultNodeContent = (type: NodeType): string => {
  const contents: Record<NodeType, string> = {
    start: 'Bonjour, je suis [Votre nom] de [Entreprise]...',
    script: 'Entrez votre script ici...',
    question: 'Posez votre question ici...',
    objection: 'Réponse à l\'objection...',
    condition: 'Condition à vérifier...',
    action: 'Action à effectuer...',
    end: 'Merci pour votre temps. Bonne journée !',
    transfer: 'Je vous transfère vers...',
    callback: 'Je vous rappelle le...',
  };
  return contents[type];
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      scripts: [],
      currentScriptId: null,
      selectedNodeId: null,
      isPanelOpen: true,
      player: {
        isActive: false,
        currentNodeId: null,
        history: [],
        notes: '',
      },

      createScript: () => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newScript: Script = {
          ...DEFAULT_SCRIPT,
          id,
          name: `Script ${get().scripts.length + 1}`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          scripts: [...state.scripts, newScript],
          currentScriptId: id,
        }));
        return id;
      },

      duplicateScript: (id) => {
        const script = get().scripts.find((s) => s.id === id);
        if (!script) return '';

        const newId = uuidv4();
        const now = new Date().toISOString();
        const duplicated: Script = {
          ...script,
          id: newId,
          name: `${script.name} (copie)`,
          createdAt: now,
          updatedAt: now,
          nodes: script.nodes.map((node) => ({
            ...node,
            id: `${node.id}-copy-${uuidv4().slice(0, 8)}`,
          })),
        };

        // Update edge references
        const nodeIdMap = new Map<string, string>();
        script.nodes.forEach((node, index) => {
          nodeIdMap.set(node.id, duplicated.nodes[index].id);
        });

        duplicated.edges = script.edges.map((edge) => ({
          ...edge,
          id: uuidv4(),
          source: nodeIdMap.get(edge.source) || edge.source,
          target: nodeIdMap.get(edge.target) || edge.target,
        }));

        set((state) => ({
          scripts: [...state.scripts, duplicated],
          currentScriptId: newId,
        }));
        return newId;
      },

      deleteScript: (id) => {
        set((state) => ({
          scripts: state.scripts.filter((s) => s.id !== id),
          currentScriptId: state.currentScriptId === id ? null : state.currentScriptId,
        }));
      },

      updateScript: (id, updates) => {
        set((state) => ({
          scripts: state.scripts.map((s) =>
            s.id === id
              ? { ...s, ...updates, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      setCurrentScript: (id) => {
        set({ currentScriptId: id, selectedNodeId: null });
        get().stopPlayer();
      },

      getCurrentScript: () => {
        const { scripts, currentScriptId } = get();
        return scripts.find((s) => s.id === currentScriptId) || null;
      },

      addNode: (type, position) => {
        const script = get().getCurrentScript();
        if (!script) return;

        const nodeId = `${type}-${uuidv4().slice(0, 8)}`;
        const newNode: ScriptNode = {
          id: nodeId,
          type: 'scriptNode',
          position,
          data: {
            label: type.charAt(0).toUpperCase() + type.slice(1),
            type,
            content: getDefaultNodeContent(type),
          },
        };

        get().updateScript(script.id, {
          nodes: [...script.nodes, newNode],
        });
        set({ selectedNodeId: nodeId });
      },

      updateNode: (nodeId, data) => {
        const script = get().getCurrentScript();
        if (!script) return;

        get().updateScript(script.id, {
          nodes: script.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          ),
        });
      },

      deleteNode: (nodeId) => {
        const script = get().getCurrentScript();
        if (!script) return;

        get().updateScript(script.id, {
          nodes: script.nodes.filter((node) => node.id !== nodeId),
          edges: script.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
        });

        if (get().selectedNodeId === nodeId) {
          set({ selectedNodeId: null });
        }
      },

      setSelectedNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
      },

      onNodesChange: (changes) => {
        const script = get().getCurrentScript();
        if (!script) return;

        const updatedNodes = applyNodeChanges(changes, script.nodes) as ScriptNode[];
        get().updateScript(script.id, {
          nodes: updatedNodes,
        });
      },

      onEdgesChange: (changes) => {
        const script = get().getCurrentScript();
        if (!script) return;

        get().updateScript(script.id, {
          edges: applyEdgeChanges(changes, script.edges),
        });
      },

      onConnect: (connection) => {
        const script = get().getCurrentScript();
        if (!script) return;

        const newEdge: Edge = {
          ...connection,
          id: uuidv4(),
          type: 'smoothstep',
          animated: false,
          style: { strokeWidth: 2 },
        } as Edge;

        get().updateScript(script.id, {
          edges: addEdge(newEdge, script.edges),
        });
      },

      togglePanel: () => {
        set((state) => ({ isPanelOpen: !state.isPanelOpen }));
      },

      startPlayer: () => {
        const script = get().getCurrentScript();
        if (!script || script.nodes.length === 0) return;

        const startNode = script.nodes.find((n) => n.data.type === 'start') || script.nodes[0];

        set({
          player: {
            isActive: true,
            currentNodeId: startNode.id,
            history: [startNode.id],
            startTime: Date.now(),
            notes: '',
          },
        });
      },

      stopPlayer: () => {
        set({
          player: {
            isActive: false,
            currentNodeId: null,
            history: [],
            notes: '',
          },
        });
      },

      goToNode: (nodeId) => {
        set((state) => ({
          player: {
            ...state.player,
            currentNodeId: nodeId,
            history: [...state.player.history, nodeId],
          },
        }));
      },

      goBack: () => {
        const { player } = get();
        if (player.history.length <= 1) return;

        const newHistory = player.history.slice(0, -1);
        set({
          player: {
            ...player,
            currentNodeId: newHistory[newHistory.length - 1],
            history: newHistory,
          },
        });
      },

      updatePlayerNotes: (notes) => {
        set((state) => ({
          player: {
            ...state.player,
            notes,
          },
        }));
      },
    }),
    {
      name: 'scriptflow-storage',
      partialize: (state) => ({
        scripts: state.scripts,
      }),
    }
  )
);
