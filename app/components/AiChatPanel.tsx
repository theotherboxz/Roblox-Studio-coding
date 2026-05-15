'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { Send, Bot, Code2, PlaySquare, AlertTriangle, RefreshCw, Cpu, Cloud, LogOut, LogIn, User } from 'lucide-react';
import { ObjectType } from '../types';

// ─── Quota Configuration ──────────────────────────────────────────────────────
const QUOTA_KEY    = 'ai_quota';
const MAX_REQUESTS = 50;
const RESET_DAYS   = 7;
const RESET_MS     = RESET_DAYS * 24 * 60 * 60 * 1000;

interface QuotaData { count: number; resetAt: number; }

async function loadQuota(puter: any): Promise<QuotaData> {
  try {
    const raw = await puter.kv.get(QUOTA_KEY);
    if (raw) {
      const data: QuotaData = JSON.parse(raw);
      if (Date.now() >= data.resetAt) return freshQuota();
      return data;
    }
  } catch (_) {}
  return freshQuota();
}
function freshQuota(): QuotaData { return { count: 0, resetAt: Date.now() + RESET_MS }; }
async function saveQuota(puter: any, data: QuotaData) {
  try { await puter.kv.set(QUOTA_KEY, JSON.stringify(data)); } catch (_) {}
}

// ─── HuggingFace Models ───────────────────────────────────────────────────────
const HF_MODELS = [
  { id: 'HuggingFaceTB/SmolLM2-135M-Instruct', label: 'SmolLM2 135M — Fastest (~270 MB)',   dtype: 'q4' },
  { id: 'HuggingFaceTB/SmolLM2-360M-Instruct', label: 'SmolLM2 360M — Balanced (~720 MB)',  dtype: 'q4' },
  { id: 'Qwen/Qwen2.5-0.5B-Instruct',          label: 'Qwen2.5 0.5B — Best quality (~1 GB)', dtype: 'q4' },
];
type HfStatus = 'idle' | 'loading' | 'ready' | 'error';

// ─── Component ────────────────────────────────────────────────────────────────
export function AiChatPanel() {
  const {
    objects, selectedId, setObjects,
    chatHistory, setChatHistory,
    agentMode, setAgentMode,
    setOpenScriptIds, openScriptIds, setActiveScriptId,
  } = useAppContext();

  const [input, setInput]         = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Puter auth state ────────────────────────────────────────────────────────
  const [puterUser, setPuterUser]       = useState<string | null>(null);
  const [puterAuthReady, setPuterAuthReady] = useState(false);

  // ── Puter quota ─────────────────────────────────────────────────────────────
  const [quota, setQuota]           = useState<QuotaData | null>(null);
  const [quotaReady, setQuotaReady] = useState(false);

  // ── Model provider ──────────────────────────────────────────────────────────
  const [provider, setProvider]     = useState<'puter' | 'huggingface'>('puter');
  const [hfModelId, setHfModelId]   = useState(HF_MODELS[0].id);
  const [hfStatus, setHfStatus]     = useState<HfStatus>('idle');
  const [hfProgress, setHfProgress] = useState(0);
  const [hfMsg, setHfMsg]           = useState('');

  // Pipeline cache + cancellation token (incremented each time we start a new load)
  const pipelineRef    = useRef<any>(null);
  const loadedModelRef = useRef<string>('');
  const loadTokenRef   = useRef<number>(0); // used to cancel stale loads

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Init: load puter auth + quota ──────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const puter = (window as any).puter;
      if (!puter) { setPuterAuthReady(true); setQuotaReady(true); return; }

      // Auth
      try {
        const signedIn = await puter.auth.isSignedIn();
        if (signedIn) {
          const user = await puter.auth.getUser();
          setPuterUser(user?.username ?? 'Signed in');
        }
      } catch (_) {}
      setPuterAuthReady(true);

      // Quota
      const data = await loadQuota(puter);
      setQuota(data);
      await saveQuota(puter, data);
      setQuotaReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  // ── Reset HF state whenever the selected model changes ─────────────────────
  // Always reset — covers both mid-download cancellation and post-load switches.
  useEffect(() => {
    loadTokenRef.current += 1;      // invalidate any in-progress download
    pipelineRef.current    = null;
    loadedModelRef.current = '';
    setHfStatus('idle');
    setHfProgress(0);
    setHfMsg('');
  }, [hfModelId]);

  // ── Quota helpers ───────────────────────────────────────────────────────────
  const quotaExceeded  = quota ? quota.count >= MAX_REQUESTS : false;
  const quotaRemaining = quota ? Math.max(0, MAX_REQUESTS - quota.count) : MAX_REQUESTS;
  const resetDate      = quota ? new Date(quota.resetAt) : null;
  const quotaPct       = quota ? (quota.count / MAX_REQUESTS) * 100 : 0;
  const barColor       = quotaPct >= 100 ? '#ef4444' : quotaPct >= 80 ? '#f59e0b' : '#00a2ff';

  // ── Puter sign out ──────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    const puter = (window as any).puter;
    if (!puter) return;
    try {
      await puter.auth.signOut();
      setPuterUser(null);
      setQuota(freshQuota());
    } catch (e) {
      console.error('Sign out error', e);
    }
  };

  // ── Puter sign in ───────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    const puter = (window as any).puter;
    if (!puter) return;
    try {
      await puter.auth.signIn();
      const user = await puter.auth.getUser();
      setPuterUser(user?.username ?? 'Signed in');
      // Reload quota for new account
      const data = await loadQuota(puter);
      setQuota(data);
      await saveQuota(puter, data);
      setQuotaReady(true);
    } catch (e) {
      console.error('Sign in error', e);
    }
  };

  // ── System prompt ───────────────────────────────────────────────────────────
  const generateSystemPrompt = () =>
    `You are a Roblox Studio AI Assistant integrated into a web-based Roblox Studio clone.
Current Workspace Objects JSON:
${JSON.stringify(objects, null, 2)}
Currently Selected Object ID: ${selectedId || 'None'}

You can talk to the user normally. If the user asks you to modify the workspace, output a JSON action block:
<action>{"type": "CREATE", "objectType": "Script", "name": "KillScript", "parentId": "workspace", "code": "print('kill')"}</action>
<action>{"type": "DELETE", "id": "obj-id"}</action>
<action>{"type": "RENAME", "id": "obj-id", "newName": "NewName"}</action>
<action>{"type": "MOVE", "id": "obj-id", "direction": "UP"}</action>
Output standard text alongside the <action> tags. Do not use backticks around them.`;

  // ── Parse workspace actions from AI response ────────────────────────────────
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
          newObjects.push({ id: newId, type: action.objectType as ObjectType, name: action.name, parentId: action.parentId || 'workspace', code: action.code || '' });
          if (action.objectType === 'Script' || action.objectType === 'LocalScript') { justCreatedScriptId = newId; newAgentMode = 'Coding'; }
          else { newAgentMode = 'Executing'; }
        } else if (action.type === 'DELETE') {
          newObjects = newObjects.filter(o => o.id !== action.id && o.parentId !== action.id);
          newAgentMode = 'Executing';
        } else if (action.type === 'RENAME') {
          newObjects = newObjects.map(o => o.id === action.id ? { ...o, name: action.newName } : o);
          newAgentMode = 'Executing';
        }
      } catch (e) { console.error('Failed to parse AI action', e, match[1]); }
    }
    setObjects(newObjects);
    setAgentMode(newAgentMode);
    if (justCreatedScriptId) {
      if (!openScriptIds.includes(justCreatedScriptId)) setOpenScriptIds([...openScriptIds, justCreatedScriptId]);
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
        const c = r.message.content;
        if (typeof c === 'string') return c;
        if (Array.isArray(c)) return c.filter((x: any) => x.type === 'text').map((x: any) => x.text).join('');
      }
    }
    return '';
  };

  // ── Load HF model into browser ──────────────────────────────────────────────
  const ensureHFModel = async (): Promise<boolean> => {
    if (pipelineRef.current && loadedModelRef.current === hfModelId) return true;

    // Capture this load's token — if hfModelId changes mid-download, the token
    // will be stale and we bail out without updating UI.
    const myToken = ++loadTokenRef.current;

    setHfStatus('loading');
    setHfProgress(0);
    setHfMsg('Initialising Transformers.js…');

    try {
      const { pipeline, env } = await import('@huggingface/transformers');
      if (loadTokenRef.current !== myToken) return false; // switched away

      env.allowLocalModels = false;
      env.useBrowserCache  = true;

      const modelCfg = HF_MODELS.find(m => m.id === hfModelId) ?? HF_MODELS[0];
      setHfMsg(`Downloading ${modelCfg.id.split('/')[1]}…`);

      pipelineRef.current = await pipeline('text-generation', modelCfg.id, {
        dtype: modelCfg.dtype as any,
        progress_callback: (info: any) => {
          if (loadTokenRef.current !== myToken) return; // stale, ignore
          if (info.status === 'progress' && info.total) {
            const pct = Math.round((info.loaded / info.total) * 100);
            setHfProgress(pct);
            setHfMsg(`Downloading… ${(info.loaded / 1e6).toFixed(0)} MB (${pct}%)`);
          } else if (info.status === 'done') {
            setHfMsg('Finalising model…');
          }
        },
      });

      if (loadTokenRef.current !== myToken) { pipelineRef.current = null; return false; }

      loadedModelRef.current = hfModelId;
      setHfStatus('ready');
      setHfProgress(100);
      setHfMsg('');
      return true;
    } catch (err: any) {
      if (loadTokenRef.current !== myToken) return false;
      console.error('HF model load error', err);
      setHfStatus('error');
      setHfMsg(err?.message ?? 'Failed to load model');
      return false;
    }
  };

  // ── Run HF inference in browser ─────────────────────────────────────────────
  const runHFInference = async (history: { role: string; content: string }[]): Promise<string> => {
    const ok = await ensureHFModel();
    if (!ok) throw new Error('Model failed to load. Check browser console for details.');
    const messages = [{ role: 'system', content: generateSystemPrompt() }, ...history];
    const output: any = await pipelineRef.current(messages, { max_new_tokens: 512, temperature: 0.7, do_sample: true });
    const generated = output?.[0]?.generated_text;
    if (Array.isArray(generated)) return generated[generated.length - 1]?.content ?? '';
    return String(generated ?? '');
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (provider === 'puter' && quotaExceeded) {
      const resetStr = resetDate ? resetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'soon';
      setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `\u26D4 Quota reached (${MAX_REQUESTS} / ${RESET_DAYS} days). Resets ${resetStr}.\n\nSwitch to HuggingFace for unlimited local AI!` }]);
      setInput('');
      return;
    }

    const userMsg = input;
    setInput('');
    setIsLoading(true);
    const updatedHistory = [...chatHistory, { id: Date.now().toString(), role: 'user' as const, content: userMsg }];
    setChatHistory(updatedHistory);

    try {
      let rawOutput = '';
      const msgHistory = updatedHistory.map(m => ({ role: m.role, content: m.content }));

      if (provider === 'puter') {
        const puter = (window as any).puter;
        if (!puter) throw new Error('Puter.js not loaded');
        const response = await puter.ai.chat([{ role: 'system', content: generateSystemPrompt() }, ...msgHistory], { model: 'claude-sonnet-4-6' });
        rawOutput = extractRawOutput(response);
        const newQuota: QuotaData = { count: (quota?.count ?? 0) + 1, resetAt: quota?.resetAt ?? (Date.now() + RESET_MS) };
        setQuota(newQuota);
        await saveQuota(puter, newQuota);
      } else {
        rawOutput = await runHFInference(msgHistory);
      }

      const textOutput = processResponseActions(rawOutput);
      setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: textOutput || '(Action executed)' }]);
      setTimeout(() => { setAgentMode('Standard'); }, 3000);

    } catch (e: any) {
      setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `Error: ${e.message || 'Could not reach AI.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  const isHF        = provider === 'huggingface';
  const accentColor = isHF ? '#ff6b35' : '#00a2ff';

  return (
    <div className="w-72 flex-shrink-0 bg-[#222222] border-r border-[#333333] flex flex-col h-full text-[#e8e8e8]">

      {/* ── Header ── */}
      <div className="p-2 border-b border-[#333333] flex items-center justify-between bg-[#2d2d2d]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#aaaaaa] flex items-center gap-2">
          <Bot size={14} style={{ color: accentColor }} /> AI Assistant
        </span>
        <div className="text-[10px] flex items-center gap-1" style={{ color: accentColor }}>
          {agentMode === 'Executing' ? <PlaySquare size={10} className="text-purple-400" /> :
           agentMode === 'Coding'   ? <Code2 size={10} className="text-green-400" /> :
           <Bot size={10} style={{ color: accentColor }} />}
          {agentMode} Mode
        </div>
      </div>

      {/* ── Provider Switcher ── */}
      <div className="px-3 pt-2 pb-2 bg-[#252525] border-b border-[#333333] space-y-2">
        <div className="flex rounded-md overflow-hidden border border-[#3a3a3a] text-[10px]">
          <button
            onClick={() => setProvider('puter')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 font-medium transition-colors ${!isHF ? 'bg-[#00a2ff] text-white' : 'bg-[#1e1e1e] text-[#666] hover:text-[#aaa]'}`}
          >
            <Cloud size={10} /> Puter AI
          </button>
          <button
            onClick={() => setProvider('huggingface')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 font-medium transition-colors ${isHF ? 'bg-[#ff6b35] text-white' : 'bg-[#1e1e1e] text-[#666] hover:text-[#aaa]'}`}
          >
            <Cpu size={10} /> HuggingFace
          </button>
        </div>

        {/* ── Puter account row ── */}
        {!isHF && puterAuthReady && (
          <div className="flex items-center justify-between">
            {puterUser ? (
              <>
                <span className="text-[9px] text-[#888] flex items-center gap-1">
                  <User size={8} className="text-[#00a2ff]" /> {puterUser}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-[9px] text-[#888] hover:text-[#ef4444] transition-colors"
                  title="Sign out of Puter"
                >
                  <LogOut size={9} /> Sign out
                </button>
              </>
            ) : (
              <>
                <span className="text-[9px] text-[#666]">Not signed in</span>
                <button
                  onClick={handleSignIn}
                  className="flex items-center gap-1 text-[9px] text-[#00a2ff] hover:text-[#33b5ff] transition-colors"
                  title="Sign in to Puter"
                >
                  <LogIn size={9} /> Sign in
                </button>
              </>
            )}
          </div>
        )}

        {/* ── HuggingFace model picker ── */}
        {isHF && (
          <div className="space-y-1.5">
            <select
              value={hfModelId}
              onChange={e => setHfModelId(e.target.value)}
              className="w-full bg-[#1b1b1b] border border-[#444] rounded px-2 py-1 text-[10px] text-[#e8e8e8] focus:outline-none focus:border-[#ff6b35]"
            >
              {HF_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>

            {hfStatus === 'idle' && (
              <p className="text-[9px] text-[#666] flex items-center gap-1">
                <Cpu size={8} className="text-[#ff6b35]" /> Runs 100% in your browser — no API key needed
              </p>
            )}
            {hfStatus === 'loading' && (
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff6b35] rounded-full transition-all duration-300" style={{ width: `${hfProgress}%` }} />
                </div>
                <p className="text-[9px] text-[#ff6b35]">{hfMsg}</p>
              </div>
            )}
            {hfStatus === 'ready' && (
              <p className="text-[9px] text-green-400">&#10003; {hfModelId.split('/')[1]} loaded &amp; ready</p>
            )}
            {hfStatus === 'error' && (
              <p className="text-[9px] text-red-400">&#9888; {hfMsg}</p>
            )}
          </div>
        )}
      </div>

      {/* ── Quota bar (Puter only) ── */}
      {!isHF && quotaReady && quota && (
        <div className="px-3 pt-2 pb-1.5 bg-[#252525] border-b border-[#333333]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-[#777777] uppercase tracking-wider">AI Quota</span>
            <span className="text-[9px]" style={{ color: barColor }}>
              {quotaExceeded ? '⛔ Limit reached' : `${quotaRemaining} / ${MAX_REQUESTS} remaining`}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#3a3a3a] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(quotaPct, 100)}%`, backgroundColor: barColor }} />
          </div>
          {quotaExceeded && resetDate && (
            <p className="text-[9px] text-[#888888] mt-1 flex items-center gap-1">
              <RefreshCw size={8} /> Resets {resetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-sans custom-scroll">
        {chatHistory.length === 0 && (
          <div className="text-center text-[#aaaaaa] mt-10">
            <Bot size={32} className="mx-auto mb-2 opacity-50" style={{ color: accentColor }} />
            <p>I am your Roblox Studio Assistant.</p>
            <p className="mt-2 text-[10px]">Ask me to create parts, scripts, or modify objects.</p>
            {isHF && <p className="mt-2 text-[9px] text-[#ff6b35]">HuggingFace mode — model downloads on first message and is cached for future use.</p>}
          </div>
        )}

        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-[10px] text-white italic mt-1" style={{ backgroundColor: accentColor }}>AI</div>
            )}
            <div className={`p-2 rounded text-xs ${msg.role === 'user' ? 'bg-[#3d3d3d] border border-[#4d4d4d] max-w-[85%]' : 'bg-[#333333] leading-relaxed max-w-[85%]'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-[10px] text-white italic mt-1" style={{ backgroundColor: accentColor }}>AI</div>
            <div className="bg-[#333333] p-2 rounded text-xs leading-relaxed flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#aaaaaa] rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-[#aaaaaa] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 bg-[#aaaaaa] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              {isHF && hfStatus === 'loading' && <span className="text-[9px] text-[#ff6b35] ml-1">{hfMsg || 'Loading model…'}</span>}
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="p-3 border-t border-[#333333] bg-[#282828]">
        {!isHF && quotaExceeded ? (
          <div className="flex items-center gap-2 bg-[#2a1a1a] border border-[#5a2a2a] rounded px-3 py-2 text-[10px] text-[#ef4444]">
            <AlertTriangle size={12} /> Quota exceeded — switch to HuggingFace or sign in to another account
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={isHF ? 'Ask (runs locally in browser)…' : 'Ask Assistant…'}
              className="w-full bg-[#1b1b1b] border border-[#444444] rounded px-3 py-2 text-xs focus:outline-none pr-10"
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
