import React, { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../config/env';

export default function BreethMemoryInspector({ sessionId, isOpen, onClose }) {
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchMemory();
    }
  }, [isOpen, sessionId]);

  const fetchMemory = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/breeth/memory/${sessionId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setMemory(data.data);
      } else {
        setError('No active Breeth memory found for this session.');
      }
    } catch (err) {
      setError('Could not connect to Breeth memory endpoint.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-bold text-white text-xl">
              🧠
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Breeth Memory Inspector</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Breeth Sponsor Track Core
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time chronological events, reasoning memory, and progressive belief graph
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-2 pt-3">
          {[
            { id: 'timeline', label: 'Chronological Timeline', icon: '⏱️' },
            { id: 'reasoning', label: 'Reasoning Memory (WHY)', icon: '💡' },
            { id: 'progressive', label: 'Progressive Beliefs', icon: '📈' },
            { id: 'prompt', label: 'Retrieved Context', icon: '🎯' },
            { id: 'raw', label: 'Raw Breeth Graph', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 font-sans text-sm">
          {loading && (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Retrieving memory graph from Breeth...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-center">
              {error}
            </div>
          )}

          {!loading && memory && (
            <>
              {/* Tab 1: Chronological Timeline */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400">
                    Chronological step-by-step event log recorded in Breeth memory during this session:
                  </div>

                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                    {memory.timelineEvents && memory.timelineEvents.length > 0 ? (
                      memory.timelineEvents.map((evt, idx) => (
                        <div key={evt.eventId || idx} className="relative bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 space-y-1">
                          <div className="absolute -left-[21px] top-4 w-3 h-3 rounded-full bg-cyan-500 ring-4 ring-slate-900" />
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span className="font-mono text-cyan-400 font-semibold uppercase">{evt.eventType?.replace('_', ' ')}</span>
                            <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-slate-200 font-medium">{evt.details}</div>
                          {evt.reasoning && (
                            <div className="text-xs text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800 font-mono mt-1">
                              💡 WHY: {evt.reasoning}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 text-xs py-4">No timeline events recorded yet.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Reasoning Memory (WHY conclusions) */}
              {activeTab === 'reasoning' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400">
                    Explanatory reasoning memory stored in Breeth explaining <strong>WHY</strong> candidate conclusions were reached:
                  </div>

                  <div className="space-y-3">
                    {memory.reasoningLogs && memory.reasoningLogs.length > 0 ? (
                      memory.reasoningLogs.map((log, i) => (
                        <div key={i} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                              Concept: {log.concept}
                            </span>
                            <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-slate-200 text-xs">
                            <span className="font-semibold text-amber-400">Reasoning (WHY): </span>
                            {log.whyExplanation}
                          </div>
                          {log.followUpReason && (
                            <div className="text-xs text-slate-400 bg-slate-900 p-2 rounded font-mono">
                              👉 Next Question Action: {log.followUpReason}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-500 text-xs py-4">No reasoning logs recorded yet.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Progressive Beliefs */}
              {activeTab === 'progressive' && (
                <div className="space-y-6">
                  {/* Confidence Score Bar */}
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Candidate Confidence Level</span>
                      <span className="font-bold text-cyan-400 text-base">{memory.confidenceScore}/100</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${memory.confidenceScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Strengths */}
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Verified Strengths</h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {memory.strengths?.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Active Weaknesses */}
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Active Weaknesses</h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {memory.weaknesses?.map((w, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-400">!</span> {w}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Progressive Resolved Weaknesses */}
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Progressive Resolved</h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {memory.resolvedWeaknesses?.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-cyan-400">↺</span> {r}
                          </li>
                        ))}
                        {(!memory.resolvedWeaknesses || memory.resolvedWeaknesses.length === 0) && (
                          <li className="text-slate-500 text-xs italic">No resolved weaknesses yet.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Retrieved Context */}
              {activeTab === 'prompt' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    This is the exact Breeth memory context injected into Gemini LLM prompts before generating each new question:
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                    {memory.promptContext || 'No prompt context generated.'}
                  </pre>
                </div>
              )}

              {/* Tab 5: Raw Breeth Graph JSON */}
              {activeTab === 'raw' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Raw JSON entity representation stored in Breeth memory store:
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-cyan-300 overflow-x-auto max-h-96">
                    {JSON.stringify(memory, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div>Session ID: <span className="font-mono text-slate-200">{sessionId}</span></div>
          <button
            onClick={fetchMemory}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors flex items-center gap-1.5"
          >
            <span>🔄</span> Refresh Memory Graph
          </button>
        </div>
      </div>
    </div>
  );
}
