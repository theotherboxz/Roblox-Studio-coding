'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { Send, Bot, Code2, PlaySquare, AlertTriangle, RefreshCw } from 'lucide-react';
import { NodeObject, ObjectType } from '../types';

// ─── Quota Configuration ──────────────────────────────────────────────────────
const QUOTA_KEY    = 'ai_quota';   // puter.kv storage key
const MAX_REQUESTS = 50;           // max AI calls per window (edit freely)
const RESET_DAYS   = 7;            // days per quota window
const RESET_MS     = RESET_DAYS * 24 * 60 * 60 * 1000;

interface QuotaData {
  count: number;
  resetAt: number; // epoch ms
}

// ─── puter.kv helpers ─────────────────────────────────────────────────────────
async function loadQuota(puter: any): Promise<QuotaData> {
  try {
    const raw = await puter.kv.get(QUOTA_KEY);
    if (raw) {
      const data: QuotaData = JSON.parse(raw);
      if (Date.now() >= data.resetAt) return freshQuota(); // expired → reset
      return data;
    }
  } catch (_) {}
  return freshQuota();
}

function freshQuota(): QuotaData {
  return { count: 0, resetAt: Date.now() + RESET_MS };
}

async function saveQuota(puter: any, data: QuotaData): Promise<void> {
  try { await puter.kv.set(QUOTA_KEY, JSON.stringify(data)); } catch (_) {}
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AiChatPanel() {
  const {
    objects, selectedId, setObjects,
    chatHistory, setChatHistory,
    agentMode, setAgentMode,
    setOpenScriptIds, openScriptIds, setActiveScriptId
  } = useAppContext();

  const [input, setInput]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [quota, setQuota]           = useState<QuotaData | null>(null);
  const [quotaReady, setQuotaReady] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load quota from puter.kv on mount
  useEffect(() => {
    const init = async () => {
      const puter = (window as any).puter;
      if (!puter) { setQuotaReady(true); return; }
      const data = await loadQuota(puter);
      setQuota(data);
      await saveQuota(puter, data); // persist reset if it was stale
      setQuotaReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  // Derived
  const quotaExceeded  = quota ? quota.count >= MAX_REQUESTS : false;
  const quotaRemaining = quota ? Math.max(0, MAX_REQUESTS - quota.count) : MAX_REQUESTS;
  const resetDate      = quota ? new Date(quota.resetAt) : null;
  const quotaPct       = quota ? (quota.count / MAX_REQUESTS) * 100 : 0;
  const barColor       = quotaPct >= 100 ? '#ef4444' : quotaPct >= 80 ? '#f59e0b' : '#00a2ff';

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

  const processResponseActions = (rawText: unknown) => {
    const text = typeof rawText === 'string' ? rawText : String(rawText ?? '');
    let newObjects = [...objects];
    let justCreatedScriptId: string | null = null;
    let newAgentMode = agentMode;

    const regex = /<action>([\s\S]*?)<\/action>/g;
    const cleanText = text.replace(regex, '').trim();
    regex.lastIndex = 0;

    let match;
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
        } else if (action.type === 'DELETE') {
          newObjects = newObjects.filter(o => o.id !== action.id && o.parentId !== action.id);
          newAgentMode = 'Executing';
        } else if (action.type === 'RENAME') {
          newObjects = newObjects.map(o => o.id === action.id ? { ...o, name: action.newName } : o);
          newAgentMode = 'Executing';
        }
      } catch (e) {
        console.error('Failed to parse AI action', e, match[1]);
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

  const extractRawOutput = (response: unknown): string => {
    if (typeof response === 'string') return response;
    if (response && typeof response === 'object') {
      const r = response as any;
      if (typeof r.text === 'string') return r.text;
      if (r.message?.content) {
        const content = r.message.content;
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) {
          return content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('');
        }
      }
    }
    return '';
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // ── Quota gate ──────────────────────────────────────────────────────────
    if (quotaExceeded) {
      const resetStr = resetDate
        ? resetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'soon';
      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `⛔ AI quota reached (${MAX_REQUESTS} requests / ${RESET_DAYS} days). Your quota resets on ${resetStr}.`
      }]);
      setInput('');
      return;
    }
    // ───────────────────────────────────────────────────────────────────────

    const userMsg = input;
    setInput('');
    setIsLoading(true);

    const updatedHistory = [
      ...chatHistory,
      { id: Date.now().toString(), role: 'user' as const, content: userMsg }
    ];
    setChatHistory(updatedHistory);

    try {
      const puter = (window as any).puter;
      if (!puter) throw new Error('Puter.js not loaded');

      const messages = [
        { role: 'system', content: generateSystemPrompt() },
        ...updatedHistory.map(m => ({ role: m.role, content: m.content }))
      ];

      const response = await puter.ai.chat(messages, { model: 'claude-sonnet-4-6' });
      const rawOutput = extractRawOutput(response);
      const textOutput = processResponseActions(rawOutput);

      // ── Increment & persist quota after a successful call ───────────────
      const newQuota: QuotaData = {
        count: (quota?.count ?? 0) + 1,
        resetAt: quota?.resetAt ?? (Date.now() + RESET_MS)
      };
      setQuota(newQuota);
      await saveQuota(puter, newQuota);
      // ───────────────────────────────────────────────────────────────────

      setChatHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: textOutput || '(Action executed)'
      }]);

      setTimeout(() => { setAgentMode('Standard'); }, 3000);

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

      {/* ── Header ── */}
      <div className="p-2 border-b border-[#333333] flex items-center justify-between bg-[#2d2d2d]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#aaaaaa] flex items-center gap-2">
          <Bot size={14} className="text-[#00a2ff]" /> AI Assistant
        </span>
        <div className="text-[10px] text-[#00a2ff] flex items-center gap-1">
          {agentMode === 'Executing' ? <PlaySquare size={10} className="text-purple-400" /> :
            agentMode === 'Coding'   ? <Code2 size={10} className="text-green-400" /> :
            <Bot size={10} className="text-[#00a2ff]" />}
          {agentMode} Mode
        </div>
      </div>

      {/* ── Quota bar ── */}
      {quotaReady && quota && (
        <div className="px-3 pt-2 pb-1.5 bg-[#252525] border-b border-[#333333]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-[#777777] uppercase tracking-wider">AI Quota</span>
            <span className="text-[9px]" style={{ color: barColor }}>
              {quotaExceeded ? '⛔ Limit reached' : `${quotaRemaining} / ${MAX_REQUESTS} remaining`}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(quotaPct, 100)}%`, backgroundColor: barColor }}
            />
          </div>
          {quotaExceeded && resetDate && (
            <p className="text-[9px] text-[#888888] mt-1 flex items-center gap-1">
              <RefreshCw size={8} />
              Resets {resetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-sans custom-scroll">
        {chatHistory.length === 0 && (
          <div className="text-center text-[#aaaaaa] mt-10">
            <Bot size={32} className="mx-auto mb-2 opacity-50 text-[#00a2ff]" />
            <p>I am your Roblox Studio Assistant.</p>
            <p className="mt-2 text-[10px]">Ask me to create parts, scripts, or modify objects.</p>
          </div>
        )}

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

      {/* ── Input ── */}
      <div className="p-3 border-t border-[#333333] bg-[#282828]">
        {quotaExceeded ? (
          <div className="flex items-center gap-2 bg-[#2a1a1a] border border-[#5a2a2a] rounded px-3 py-2 text-[10px] text-[#ef4444]">
            <AlertTriangle size={12} />
            Quota exceeded — resets in {RESET_DAYS} days
          </div>
        ) : (
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
        )}
      </div>

    </div>
  );
}
