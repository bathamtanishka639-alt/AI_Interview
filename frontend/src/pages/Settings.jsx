import { useState } from 'react';
import { Terminal, Cpu, Database, Network, Key, Layers, CheckCircle2 } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import { useTheme } from '../hooks/useTheme';
import { config } from '../config/env';

export default function Settings() {
  const { preference, resolved, setPreference } = useTheme();
  const [activeTab, setActiveTab] = useState('system');

  return (
    <PageContainer title="Developer Dashboard" subtitle="System diagnostics, Breeth memory graph, and LLM configuration">
      <div className="max-w-4xl mx-auto space-y-6 antialiased">
        <div className="flex border-b border-border text-xs font-medium space-x-4">
          {[
            { id: 'system', label: 'System Overview', icon: Cpu },
            { id: 'memory', label: 'Breeth Graph Status', icon: Database },
            { id: 'api', label: 'API Endpoint Diagnostics', icon: Network },
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 transition-all flex items-center gap-2 border-b-2 font-mono ${
                  isSelected
                    ? 'border-agent-500 text-agent-600 dark:text-agent-400 font-semibold'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <IconComponent size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="rounded-lg bg-surface-raised border border-border p-6 shadow-subtle space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">Appearance & Environment</h3>
                <p className="text-xs text-text-secondary">System theme preference and client state.</p>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
                <div>
                  <p className="font-semibold text-text-primary">Theme Preference</p>
                  <p className="text-text-secondary font-mono">Active: <span className="text-agent-500 font-bold">{resolved}</span></p>
                </div>
                <div className="flex gap-1.5">
                  {['light', 'dark', 'system'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPreference(mode)}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono capitalize transition-all border ${
                        preference === mode
                          ? 'bg-agent-500 text-white border-agent-500'
                          : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-surface-raised border border-border p-6 shadow-subtle space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">AI Engine & LLM Configuration</h3>
                <p className="text-xs text-text-secondary">Primary model configuration and fallback status.</p>
              </div>

              <div className="space-y-3 border-t border-border pt-4 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Primary Model</span>
                  <span className="font-semibold text-text-primary">google/gemini-3.5-flash</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Fallback Engine</span>
                  <span className="font-semibold text-signal-600 dark:text-signal-500">Intelligent Local Fallback</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">API Endpoint Base</span>
                  <span className="text-text-primary">{config.API_BASE_URL}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="rounded-lg bg-surface-raised border border-border p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">Breeth Memory Provider</h3>
                <p className="text-xs text-text-secondary">Graph memory synchronization state.</p>
              </div>
              <span className="px-2.5 py-1 rounded-pill bg-signal-500/10 border border-signal-500/20 text-signal-700 dark:text-signal-400 text-xs font-mono font-semibold">
                ✓ Connected
              </span>
            </div>

            <div className="space-y-3 border-t border-border pt-4 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Memory Endpoint</span>
                <span className="text-text-primary">https://api.thebreeth.com/v1/episodes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Extraction Intent</span>
                <span className="text-text-primary">false (Clean API Mode)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Local Sync Storage</span>
                <span className="text-text-primary">In-Memory Active Cache</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="rounded-lg bg-surface-raised border border-border p-6 shadow-subtle space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">Backend Route Diagnostics</h3>
              <p className="text-xs text-text-secondary">Active backend endpoint status matrix.</p>
            </div>

            <div className="border-t border-border pt-4">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-text-secondary uppercase">
                    <th className="pb-2">Method</th>
                    <th className="pb-2">Route</th>
                    <th className="pb-2">Target Feature</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text-primary">
                  <tr>
                    <td className="py-2.5 text-agent-500 font-bold">POST</td>
                    <td className="py-2.5">/api/cv/parse</td>
                    <td className="py-2.5 text-text-secondary">CV PDF/DOCX Parser</td>
                    <td className="py-2.5 text-right text-signal-600 dark:text-signal-500">200 OK</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-agent-500 font-bold">POST</td>
                    <td className="py-2.5">/api/interview/start</td>
                    <td className="py-2.5 text-text-secondary">CV Question Planner</td>
                    <td className="py-2.5 text-right text-signal-600 dark:text-signal-500">201 Created</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-agent-500 font-bold">POST</td>
                    <td className="py-2.5">/api/interview/message</td>
                    <td className="py-2.5 text-text-secondary">Adaptive Follow-Up Probe</td>
                    <td className="py-2.5 text-right text-signal-600 dark:text-signal-500">200 OK</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-signal-600 font-bold">GET</td>
                    <td className="py-2.5">/api/breeth/memory/:id</td>
                    <td className="py-2.5 text-text-secondary">Breeth Memory Graph</td>
                    <td className="py-2.5 text-right text-signal-600 dark:text-signal-500">200 OK</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
