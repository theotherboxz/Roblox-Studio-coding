'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NodeObject, ObjectType, AgentMode, ChatMessage } from './types';

interface AppState {
  objects: NodeObject[];
  selectedId: string | null;
  openScriptIds: string[];
  activeScriptId: string | null;
  chatHistory: ChatMessage[];
  agentMode: AgentMode;
  
  setObjects: (objects: NodeObject[]) => void;
  setSelectedId: (id: string | null) => void;
  setOpenScriptIds: (ids: string[]) => void;
  setActiveScriptId: (id: string | null) => void;
  setChatHistory: (history: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setAgentMode: (mode: AgentMode) => void;
}

const defaultObjects: NodeObject[] = [
  { id: 'workspace', type: 'Workspace', name: 'Workspace', parentId: null },
  { id: 'camera', type: 'Camera', name: 'Camera', parentId: 'workspace' },
  { id: 'terrain', type: 'Terrain', name: 'Terrain', parentId: 'workspace' },
  { id: 'spawn-location', type: 'SpawnLocation', name: 'SpawnLocation', parentId: 'workspace' },
  { id: 'baseplate', type: 'Baseplate', name: 'Baseplate', parentId: 'workspace' },
  { id: 'players', type: 'Players', name: 'Players', parentId: null },
  { id: 'lighting', type: 'Lighting', name: 'Lighting', parentId: null },
  { id: 'material-service', type: 'MaterialService', name: 'MaterialService', parentId: null },
  { id: 'replicated-first', type: 'ReplicatedFirst', name: 'ReplicatedFirst', parentId: null },
  { id: 'replicated-storage', type: 'ReplicatedStorage', name: 'ReplicatedStorage', parentId: null },
  { id: 'server-script-service', type: 'ServerScriptService', name: 'ServerScriptService', parentId: null },
  { id: 'server-storage', type: 'ServerStorage', name: 'ServerStorage', parentId: null },
  { id: 'starter-gui', type: 'StarterGui', name: 'StarterGui', parentId: null },
  { id: 'starter-pack', type: 'StarterPack', name: 'StarterPack', parentId: null },
  { id: 'starter-player', type: 'StarterPlayer', name: 'StarterPlayer', parentId: null },
  { id: 'starter-character-scripts', type: 'Folder', name: 'StarterCharacterScripts', parentId: 'starter-player' },
  { id: 'starter-player-scripts', type: 'Folder', name: 'StarterPlayerScripts', parentId: 'starter-player' },
  { id: 'teams', type: 'Teams', name: 'Teams', parentId: null },
  { id: 'sound-service', type: 'SoundService', name: 'SoundService', parentId: null },
  { id: 'text-chat-service', type: 'TextChatService', name: 'TextChatService', parentId: null }
];

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [objects, setObjects] = useState<NodeObject[]>(defaultObjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openScriptIds, setOpenScriptIds] = useState<string[]>([]);
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [agentMode, setAgentMode] = useState<AgentMode>('Standard');

  return (
    <AppContext.Provider value={{
      objects, selectedId, openScriptIds, activeScriptId, chatHistory, agentMode,
      setObjects, setSelectedId, setOpenScriptIds, setActiveScriptId, setChatHistory, setAgentMode
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
