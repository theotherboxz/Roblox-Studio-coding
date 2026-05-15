import React from 'react';
import { Info, X } from 'lucide-react';

interface InfoModalProps {
  onClose: () => void;
}

export function InfoModal({ onClose }: InfoModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#2d2d2d] border border-[#444444] rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#444444] bg-[#222222]">
          <div className="flex items-center gap-2">
            <Info className="text-[#00a2ff] w-5 h-5" />
            <h2 className="text-sm font-bold text-white">About Roblox Studio Web</h2>
          </div>
          <button onClick={onClose} className="text-[#aaaaaa] hover:text-white transition">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 text-sm text-[#cccccc] space-y-5 overflow-y-auto max-h-[70vh] custom-scroll">
          <section>
            <h3 className="text-white font-semibold mb-2 text-base">What does this website do?</h3>
            <p className="leading-relaxed">
              This is a web-based coding and ideation environment inspired by the Roblox Studio layout. It provides a lightweight replica of the Studio interface directly in your browser, enabling you to:
            </p>
            <ul className="list-inside list-disc pl-2 mt-2 space-y-1">
              <li>Construct object hierarchies using the Explorer.</li>
              <li>Organize 3D parts, UI elements, events, and services.</li>
              <li>Write and edit Luau code in a dedicated Code Editor.</li>
            </ul>
          </section>
          
          <section>
            <h3 className="text-white font-semibold mb-2 text-base">How does the AI Agent work?</h3>
            <p className="mb-2 leading-relaxed">
              The AI Agent is an integrated coding assistant accessible via the left chat panel. It is designed to act as your pair programmer for Roblox development:
            </p>
            <ul className="list-inside list-disc pl-2 mt-2 space-y-2">
              <li><strong>Context Aware:</strong> The agent can read the code you are currently working on and analyze your project&apos;s structure.</li>
              <li><strong>Code Generation:</strong> Simply ask the AI to build game systems, write functions, or fix bugs, and it will generate Luau code snippets for you.</li>
              <li><strong>Architecture Advice:</strong> Unsure where to place a RemoteEvent or ServerScript? Ask the agent for best practices regarding Client-Server model patterns and Explorer structuring.</li>
              <li><strong>Instant Help:</strong> If you get stuck on an error or Roblox API issue, you can chat with the AI for immediate troubleshooting details without leaving the page.</li>
            </ul>
            
            <div className="mt-4 bg-[#222222] border border-[#333333] rounded p-3">
              <h4 className="text-white font-semibold text-sm mb-2">Agent Phases & Modes:</h4>
              <p className="text-xs mb-3">Depending on your request, the agent seamlessly transitions between different operational phases:</p>
              <div className="space-y-3">
                <div className="bg-[#1b1b1b] p-2 rounded border-l-2 border-[#ffcc00]">
                  <p className="text-xs font-semibold text-white mb-1">1. Execution Phase (Building)</p>
                  <p className="text-xs">If you simply ask to <span className="italic text-[#aaaaaa]">&quot;Create a Part&quot;</span>, the agent enters the execution phase, immediately inserting the requested object into the Explorer hierarchy.</p>
                </div>
                <div className="bg-[#1b1b1b] p-2 rounded border-l-2 border-[#00ff88]">
                  <p className="text-xs font-semibold text-white mb-1">2. Coding Phase (Scripting)</p>
                  <p className="text-xs">If your request requires logic, like <span className="italic text-[#aaaaaa]">&quot;Create a kill part&quot;</span>, the agent first executes the creation of the Part, then transitions into the coding phase to generate the Luau script required to handle the kill logic.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-[#222222] border border-[#333333] rounded p-3">
              <h4 className="text-white font-semibold text-sm mb-2">Example Workflows:</h4>
              <div className="space-y-3">
                <div className="bg-[#1b1b1b] p-2 rounded">
                  <p className="text-xs text-[#aaaaaa] italic">&quot;Create a DataStore script to save player currency.&quot;</p>
                  <p className="text-xs mt-1">The agent will generate a complete ServerScript using <code className="bg-[#333] px-1 rounded text-[10px]">DataStoreService</code>, ready to be pasted into ServerScriptService.</p>
                </div>
                <div className="bg-[#1b1b1b] p-2 rounded">
                  <p className="text-xs text-[#aaaaaa] italic">&quot;How do I make a door open when a player approaches?&quot;</p>
                  <p className="text-xs mt-1">The agent will provide a step-by-step guide on using <code className="bg-[#333] px-1 rounded text-[10px]">ProximityPrompt</code> or <code className="bg-[#333] px-1 rounded text-[10px]">Touched</code> events and give you the exact code to put in your Part.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#1b1b1b] p-4 rounded border border-[#333333]">
            <h3 className="text-gray-400 font-semibold mb-1 text-xs uppercase tracking-wider">Please Note</h3>
            <p className="text-xs">
              This web environment is specifically built for robust code drafting and project structure planning. To run, debug, or playtest your game visually, you can transfer your work to the official standalone Roblox Studio desktop application.
            </p>
          </section>
        </div>
        <div className="p-4 border-t border-[#444444] bg-[#222222] flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-[#00a2ff] text-white rounded text-xs font-semibold hover:bg-[#0088cc] transition shadow"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
 
