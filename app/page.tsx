'use client';

import React, { useState } from 'react';
import { AppProvider } from './AppContext';
import { ExplorerPanel } from './components/ExplorerPanel';
import { CodeEditorPanel } from './components/CodeEditorPanel';
import { AiChatPanel } from './components/AiChatPanel';
import { InfoModal } from './components/InfoModal';
import { Info } from 'lucide-react';

export default function Home() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <AppProvider>
      <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#1b1b1b] text-[#e8e8e8] font-sans">
        {/* Top Menu Bar */}
        <div className="h-9 w-full bg-[#222222] border-b border-[#333333] flex items-center justify-between px-4 text-xs select-none flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 opacity-80">
              <div className="w-4 h-4 bg-[#00a2ff] rounded-sm flex items-center justify-center font-bold text-[10px] text-white">R</div>
              <span className="font-medium">Roblox Studio Web</span>
            </div>
          </div>
          
          <button 
            onClick={() => setShowInfo(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#333333] hover:bg-[#444444] text-[#cccccc] hover:text-white transition"
          >
            <Info size={14} className="text-[#00a2ff]" />
            <span>About & Help</span>
          </button>
        </div>

        {/* Main Workspace */}
        <div className="flex flex-1 w-full overflow-hidden">
          {/* Left: AI Chat */}
          <AiChatPanel />

          {/* Middle: Code Editor */}
          <div className="flex-1 flex flex-col relative w-full h-full min-w-0">
             <CodeEditorPanel />
          </div>

          {/* Right: Explorer Panel */}
          <ExplorerPanel />
        </div>

        {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      </div>
    </AppProvider>
  );
}
