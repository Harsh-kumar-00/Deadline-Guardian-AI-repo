import React, { useState } from "react";
import { Compass, Sparkles, RefreshCw, Cpu, AlertTriangle, ShieldCheck, Terminal, HeartPulse, ShieldAlert } from "lucide-react";
import { Goal, AgentState } from "../types";

interface CommandCenterProps {
  goals: Goal[];
  persona: string;
  agents: AgentState[];
  loading: boolean;
  onRefresh: () => void;
}

export default function CommandCenter({ goals, persona, agents, loading, onRefresh }: CommandCenterProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200">
            <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
            Active
          </span>
        );
      case "thinking":
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Thinking
          </span>
        );
      case "standby":
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200">
            Standby
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider bg-gray-50 text-gray-400 px-2 py-0.5 rounded border border-gray-100">
            Idle
          </span>
        );
    }
  };

  const getAgentIcon = (id: string) => {
    switch (id) {
      case "planner":
        return <Compass className="w-5 h-5 text-blue-600" />;
      case "risk":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "schedule":
        return <HeartPulse className="w-5 h-5 text-blue-600" />;
      case "rescue":
        return <ShieldAlert className="w-5 h-5 text-amber-600" />;
      default:
        return <Cpu className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-gray-800">
      
      {/* CommandCenter Setup Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              MULTI-AGENT COLLABORATION BOARD
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">AI Command Center</h3>
            <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
              Monitor active states of 5 independent specialist AI Agents operating in parallel to defend your deadlines, adjust schedule allocations, and mitigate risks.
            </p>
          </div>
          
          <button 
            onClick={onRefresh}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-3 rounded-xl transition flex items-center gap-1.5 shadow-sm shrink-0 justify-center w-full sm:w-auto cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Synchronize Agents State
          </button>
        </div>
      </div>

      {/* Agents Mesh Status Visual */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-5">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Active Command Network Mesh</h4>
          </div>
          <div className="text-[11px] font-mono text-gray-500">
            Coordinated prompt sequence active • Persona override: <strong className="text-blue-600 font-bold">{persona}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div 
              key={agent.id} 
              className={`bg-white border rounded-2xl p-5 hover:border-gray-300 transition flex flex-col justify-between shadow-sm ${
                expandedAgent === agent.id ? "border-blue-500 ring-2 ring-blue-500/10" : "border-gray-200"
              }`}
            >
              <div className="space-y-4">
                {/* Agent Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                      {getAgentIcon(agent.id)}
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-gray-900">{agent.name}</h5>
                      <span className="text-[10px] font-mono text-gray-400 font-medium">{agent.role}</span>
                    </div>
                  </div>
                  {getStatusBadge(agent.status)}
                </div>

                {/* Agent Activity & Recommendation */}
                <div className="space-y-3">
                  <div className="bg-gray-50 border border-gray-150 p-3 rounded-lg space-y-1">
                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Last Activity Log</span>
                    <p className="text-xs text-gray-700 leading-relaxed font-mono">
                      {agent.lastAction}
                    </p>
                  </div>

                  <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100/70 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-blue-700">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Current Recommendation</span>
                    </div>
                    <p className="text-xs text-blue-900 leading-normal font-medium">
                      {agent.currentRecommendation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expander block */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                  className="w-full text-center text-gray-400 hover:text-gray-600 transition text-[10px] font-mono uppercase tracking-wider font-bold py-1 hover:bg-gray-50 rounded cursor-pointer"
                >
                  {expandedAgent === agent.id ? "Hide System Guidelines" : "View System Guidelines"}
                </button>
                
                {expandedAgent === agent.id && (
                  <div className="mt-3 bg-gray-50 border border-gray-200 p-3 rounded-lg animate-fade-in">
                    <div className="flex items-center gap-1 text-[9px] font-mono text-blue-600 uppercase font-bold border-b border-gray-200 pb-1.5 mb-2">
                      <Terminal className="w-3 h-3" /> core_agent_protocol.yaml
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed font-mono whitespace-pre-wrap">
                      {agent.systemPrompt}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}

