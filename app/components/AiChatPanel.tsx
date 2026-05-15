'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { Send, Bot, User, Code2, PlaySquare } from 'lucide-react';
import { NodeObject, ObjectType } from '../types';

export function AiChatPanel() {
  const { objects, selectedId, setObjects, chatHistory, setChatHistory, agentMode, setAgentMode, setOpenScriptIds, openScriptIds, setActiveScriptId } = useAppContext();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const generateSystemPrompt = () => {
    return `You are a Roblox Studio AI Assistant integrated into a web-based Roblox Studio clone.
The user is interacting with an Explorer window.
Current Workspace Objects JSON:
${JSON.stringify(objects, null, 2)}
Currently Selected Object ID: ${selectedId || 'None'}

You can talk to the user normally. If the user asks you to modify the workspace, you MUST output a JSON action block embedded in your response to perform the action.
Format for action blocks:
<action>{"type": "CREATE", "objectType": "Script", "name": "KillScript", "parentId": "workspace", "code": "print('kill')"}</action>
<action>{"type": "DELETE", "id": "obj-id"}</action>
<action>{"type": "RENAME", "id": "obj-id", "newName": "NewName"}</action>
<action>{"type": "MOVE", "id": "obj-id", "direction": "UP"}</action>

When they ask you to add/create a script or part, output the appropriate CREATE <action>.
If they ask for a script that does something, write the Lua code inside the "code" property of the CREATE action. Tell the user you have created it and opened it in the editor.

Remember to output standard text describing what you are doing alongside the <action> tags. Do not put backticks around the action tags.`;
  };

  const processResponseActions = (text: string) => {
    let newObjects = [...objects];
    let justCreatedScriptId: string | null = null;
    let newAgentMode = agentMode;

    const regex = /<action>([\s\S]*?)<\/action>/g;
    let match;
    const cleanText = text.replace(regex, '').trim();

    while ((match = regex.exec(text)) !== null) {
      try {
        const action = JSON.parse(match[1]);
        if (action.type === 'CREATE') {
          const newId = 'obj-' + Date.now() + Math.floor(Math.random() * 1000);
          newObjects.push({
            id: newId,
            type: action.objectType as ObjectType,
            name: action.name,
            parentId: action.parentId || 'workspace',
            code: action.code || ''
          });
          
          if (action.objectType === 'Script' || action.objectType === 'LocalScript') {
            justCreatedScriptId = newId;
            newAgentMode = 'Coding';
          } else {
            newAgentMode = 'Executing';
          }
        } 
        else if (action.type === 'DELETE') {
          const id = action.id;
          newObjects = newObjects.filter(o => o.id !== id && o.parentId !== id);
          newAgentMode = 'Executing';
        }
        else if (action.type === 'RENAME') {
           newObjects = newObjects.map(o => o.id === action.id ? { ...o, name: action.newName } : o);
           newAgentMode = 'Executing';
        }
        // ignoring MOVE for simplicity in AI parsing, rely on user using context menu
      } catch (e) {
        console.error("Failed to parse AI action", e, match[1]);
      }
    }

    setObjects(newObjects);
    setAgentMode(newAgentMode);

    if (justCreatedScriptId) {
      if (!openScriptIds.includes(justCreatedScriptId)) {
        setOpenScriptIds([...openScriptIds, justCreatedScriptId]);
      }
      setActiveScriptId(justCreatedScriptId);
    }

    return cleanText;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    setIsLoading(true);

    const updatedHistory = [...chatHistory, { id: Date.now().toString(), role: 'user' as const, content: userMsg }];
    setChatHistory(updatedHistory);

    try {
      // Puter.js chat
      const puter = (window as any).puter;
      if (!puter) throw new Error("Puter.js not loaded");

      const messages = [
        { role: 'system', content: generateSystemPrompt() },
        ...updatedHistory.map(m => ({ role: m.role, content: m.content }))
      ];

      const response = await puter.ai.chat(messages, { model: 'claude-sonnet-4-6' });
      const rawOutput = typeof response === 'string' ? response : (response?.message?.content || '');

      const textOutput = processResponseActions(rawOutput);

      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: textOutput || "(Action executed)"
      }]);
      
      // Reset mode to standard after a delay
      setTimeout(() => {
        setAgentMode('Standard');
      }, 3000);

    } catch (e: any) {
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${e.message || 'Could not reach AI.'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-72 flex-shrink-0 bg-[#222222] border-r border-[#333333] flex flex-col h-full text-[#e8e8e8]">
      <div className="p-2 border-b border-[#333333] flex items-center justify-between bg-[#2d2d2d]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#aaaaaa] flex items-center gap-2">
          <Bot size={14} className="text-[#00a2ff]" /> AI Assistant
        </span>
        <div className="text-[10px] text-[#00a2ff] flex items-center gap-1">
           {agentMode === 'Executing' ? <PlaySquare size={10} className="text-purple-400" /> : 
            agentMode === 'Coding' ? <Code2 size={10} className="text-green-400" /> : 
            <Bot size={10} className="text-[#00a2ff]" />}
           {agentMode} Mode
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-sans custom-scroll">
        {chatHistory.length === 0 ? (
          <div className="text-center text-[#aaaaaa] mt-10">
            <Bot size={32} className="mx-auto mb-2 opacity-50 text-[#00a2ff]" />
            <p>I am your Roblox Studio Assistant.</p>
            <p className="mt-2 text-[10px]">Ask me to create parts, scripts, or modify objects.</p>
          </div>
        ) : null}

        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded bg-[#00a2ff] flex-shrink-0 flex items-center justify-center text-[10px] text-white italic mt-1">AI</div>
            )}
            <div className={`p-2 rounded text-xs ${msg.role === 'user' ? 'bg-[#3d3d3d] border border-[#4d4d4d] max-w-[85%]' : 'bg-[#333333] leading-relaxed max-w-[85%]'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded bg-[#00a2ff] flex-shrink-0 flex items-center justify-center text-[10px] text-white italic mt-1">AI</div>
            <div className="bg-[#333333] p-2 rounded text-xs leading-relaxed flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#aaaaaa] rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-[#aaaaaa] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 bg-[#aaaaaa] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 border-t border-[#333333] bg-[#282828]">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask Assistant..."
            className="w-full bg-[#1b1b1b] border border-[#444444] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#00a2ff] pr-10"
          />
          <button 
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-0.5 rounded text-[#666666] hover:text-[#aaaaaa] disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
