import type { Node, Edge } from '@xyflow/react';

// Types de nœuds disponibles
export type NodeType =
  | 'start'           // Nœud de départ
  | 'script'          // Script à lire
  | 'question'        // Question au prospect
  | 'responses'       // Réponses possibles du client
  | 'objection'       // Gestion d'objection
  | 'condition'       // Condition/branchement
  | 'action'          // Action à effectuer
  | 'end'             // Fin de l'appel
  | 'transfer'        // Transfert d'appel
  | 'callback';       // Rappel programmé

// Données d'un nœud de script
export interface ScriptNodeData {
  label: string;
  type: NodeType;
  content: string;
  notes?: string;
  options?: NodeOption[];
  color?: string;
  [key: string]: unknown;
}

// Option de réponse pour les questions
export interface NodeOption {
  id: string;
  label: string;
  targetNodeId?: string;
}

// Nœud React Flow personnalisé
export type ScriptNode = Node<ScriptNodeData, 'scriptNode'>;

// Script complet
export interface Script {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodes: ScriptNode[];
  edges: Edge[];
  tags?: string[];
}

// État du player/exécution
export interface PlayerState {
  isActive: boolean;
  currentNodeId: string | null;
  history: string[];
  startTime?: number;
  notes: string;
}

// Configuration des types de nœuds
export const NODE_TYPE_CONFIG: Record<NodeType, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  start: {
    label: 'Départ',
    color: '#22c55e',
    icon: 'Play',
    description: 'Point de départ du script'
  },
  script: {
    label: 'Script',
    color: '#3b82f6',
    icon: 'FileText',
    description: 'Texte à lire au prospect'
  },
  question: {
    label: 'Question',
    color: '#8b5cf6',
    icon: 'HelpCircle',
    description: 'Question avec options de réponse'
  },
  responses: {
    label: 'Réponses Client',
    color: '#6366f1',
    icon: 'MessageSquare',
    description: 'Plusieurs phrases possibles du client'
  },
  objection: {
    label: 'Objection',
    color: '#f59e0b',
    icon: 'AlertTriangle',
    description: 'Réponse à une objection'
  },
  condition: {
    label: 'Condition',
    color: '#06b6d4',
    icon: 'GitBranch',
    description: 'Branchement conditionnel'
  },
  action: {
    label: 'Action',
    color: '#ec4899',
    icon: 'Zap',
    description: 'Action à effectuer'
  },
  end: {
    label: 'Fin',
    color: '#ef4444',
    icon: 'Square',
    description: 'Fin de l\'appel'
  },
  transfer: {
    label: 'Transfert',
    color: '#14b8a6',
    icon: 'PhoneForwarded',
    description: 'Transfert vers un autre interlocuteur'
  },
  callback: {
    label: 'Rappel',
    color: '#f97316',
    icon: 'Clock',
    description: 'Programmer un rappel'
  },
};

// Template de script par défaut
export const DEFAULT_SCRIPT: Omit<Script, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Nouveau Script',
  description: '',
  nodes: [
    {
      id: 'start-1',
      type: 'scriptNode',
      position: { x: 250, y: 50 },
      data: {
        label: 'Départ',
        type: 'start',
        content: 'Bonjour, je suis [Votre nom] de [Entreprise]. Est-ce que je parle bien à [Nom du prospect] ?',
      },
    },
  ],
  edges: [],
};
