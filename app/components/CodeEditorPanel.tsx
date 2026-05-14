'use client';

import React from 'react';
import { useAppContext } from '../AppContext';
import { X, Play } from 'lucide-react';

export function CodeEditorPanel() {
  const { objects, openScriptIds, activeScriptId, setOpenScriptIds, setActiveScriptId, setObjects, setChatHistory } = useAppContext();

  if (openScriptIds.length === 0) {
    return (
      <div className="flex-1 bg-[#1b1b1b] flex flex-col h-full items-center justify-center text-[#aaaaaa]">
        <p>No scripts open</p>
        <p className="text-xs mt-2">Double-click a script in the Explorer to open</p>
      </div>
    );
  }

  const activeScript = objects.find(o => o.id === activeScriptId);
  const openScripts = openScriptIds.map(id => objects.find(o => o.id === id)).filter(Boolean) as typeof objects;

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newOpen = openScriptIds.filter(scriptId => scriptId !== id);
    setOpenScriptIds(newOpen);
    if (activeScriptId === id) {
      setActiveScriptId(newOpen.length > 0 ? newOpen[newOpen.length - 1] : null);
    }
  };

  const updateCode = (newCode: string) => {
    if (!activeScriptId) return;
    setObjects(objects.map(o => o.id === activeScriptId ? { ...o, code: newCode } : o));
  };

  const executeCode = () => {
    if (!activeScript) return;
    const code = activeScript.code || '';
    setChatHistory(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: `> Executing output from ${activeScript.name}:\n\n\`\`\`text\nRunning code...\n${code}\nExecution simulated.\n\`\`\``
    }]);
  };

  return (
    <div className="flex-1 bg-[#1b1b1b] flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <div className="h-8 bg-[#222222] border-b border-[#333333] flex overflow-x-auto no-scrollbar">
        {openScripts.map(script => (
          <div
            key={script.id}
            onClick={() => setActiveScriptId(script.id)}
            className={`px-4 flex items-center gap-2 border-r border-[#333333] text-xs cursor-pointer group flex-shrink-0
              ${activeScriptId === script.id ? 'bg-[#1b1b1b] border-t-2 border-t-[#00a2ff]' : 'bg-[#2d2d2d] opacity-60 border-t-2 border-t-transparent hover:opacity-100'}
            `}
          >
            <span className="text-[#00ff88] text-[10px]">{'{'} {'}'}</span>
            <span className="truncate max-w-40">{script.name}</span>
            <X 
              size={12} 
              className={`opacity-40 group-hover:opacity-100 transition-opacity`}
              onClick={(e) => closeTab(e, script.id)}
            />
          </div>
        ))}
        {openScripts.length > 0 && activeScriptId && (
          <div className="flex-1 flex justify-end items-center px-4 bg-[#222222]">
             <button
               className="flex items-center gap-1 text-[10px] bg-[#333333] border border-[#444444] hover:bg-[#3d3d3d] px-2 py-0.5 rounded text-[#e8e8e8]"
               onClick={executeCode}
             >
               <Play size={10} /> Run
             </button>
          </div>
        )}
      </div>

      {/* Editor */}
      {activeScript ? (
        <div className="flex-1 flex font-mono text-xs leading-relaxed overflow-hidden">
          {/* Gutter */}
          <div className="w-10 bg-[#222222] text-[#666666] text-right pr-2 py-4 select-none">
            {((activeScript.code || '').match(/\n/g) || []).map((_, i) => <div key={i}>{i + 1}</div>)}
            <div>{((activeScript.code || '').match(/\n/g) || []).length + 1}</div>
          </div>
          <div className="flex-1 relative border-none custom-scroll bg-[#1b1b1b]">
            <textarea
              value={activeScript.code || ''}
              onChange={(e) => updateCode(e.target.value)}
              className="w-full h-full bg-transparent text-[#d4d4d4] font-mono text-xs py-4 px-2 outline-none resize-none selection:bg-[#264f78]"
              spellCheck={false}
              placeholder="-- Write Lua code here"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
