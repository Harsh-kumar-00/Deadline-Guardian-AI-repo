import React, { useState } from "react";
import { 
  Sparkles, RefreshCw, Cpu, Send, MessageSquare, HelpCircle, 
  Play, AlertTriangle, CheckCircle, Clock 
} from "lucide-react";
import { Goal, WhatIfResult, RiskAnalysis, RescuePlan, WatchdogResult } from "../types";

interface Message {
  role: "user" | "model";
  text: string;
}

interface AIAssistantProps {
  goals: Goal[];
  persona: string;
  activeRiskAnalysis: { [subtaskId: string]: RiskAnalysis };
  activeRescuePlan: RescuePlan | null;
  watchdogResult: WatchdogResult | null;
}

export default function AIAssistant({ 
  goals, 
  persona, 
  activeRiskAnalysis, 
  activeRescuePlan, 
  watchdogResult 
}: AIAssistantProps) {
  const [activeSubTab, setActiveSubTab] = useState<"chat" | "simulation">("chat");

  // Chat States
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: `System Calibrated. I am your Deadline Guardian. I am not here to offer motivational encouragement or generic productivity advice. My sole function is to analyze your critical path and prevent your deadlines from collapsing.

Click one of the hotkeys on the right or ask me directly: **"What should I do right now to avoid missing my deadline?"**`
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  // Simulation States
  const [customScenario, setCustomScenario] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [simulationResult, setSimulationResult] = useState<WhatIfResult | null>(null);
  const [loadingSimulation, setLoadingSimulation] = useState(false);

  const presets = [
    {
      id: "skip",
      label: "What if I skip today's work entirely?",
      text: "What if I skip today's work entirely to attend another commitment?"
    },
    {
      id: "finish_high",
      label: "What if I finish my highest risk task first?",
      text: "What if I concentrate fully and complete my highest risk subtask today?"
    },
    {
      id: "delay",
      label: "What if I delay the deadline by 2 days?",
      text: "What if I extend the goal target timeline by 2 days?"
    }
  ];

  // Chat message submit handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loadingChat) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoadingChat(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          goals,
          persona,
          history: messages,
          activeRiskAnalysis,
          activeRescuePlan,
          watchdogResult
        })
      });

      if (!response.ok) throw new Error("Chat request failed");
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        { 
          role: "model", 
          text: "I experienced a minor connection issue with the central model. However, based on your current goal metrics, I strongly advise maintaining extreme focus on your active critical-path subtasks!" 
        }
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  // Run What-If Simulation handler
  const handleRunSimulation = async (scenarioText: string, presetId: string | null) => {
    if (!scenarioText.trim() || loadingSimulation) return;
    setLoadingSimulation(true);
    setSelectedPreset(presetId);
    
    try {
      const response = await fetch("/api/ai/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenarioText,
          goals,
          persona
        })
      });

      if (!response.ok) throw new Error("What-if simulation failed");
      const data = await response.json();
      setSimulationResult(data);
    } catch (err) {
      console.error("Simulation Error:", err);
    } finally {
      setLoadingSimulation(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-gray-800">
      
      {/* Redesigned Elevated Info Banner */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            INTELLIGENT DECISION CENTER
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">AI Companion Assistant</h3>
          <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
            Chat with the co-pilot about de-scoping strategies or run predictive simulations to model chronological risk and downstream impacts.
          </p>
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 max-w-md">
        <button
          onClick={() => setActiveSubTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === "chat" 
              ? "bg-white text-blue-600 shadow-sm border border-gray-150" 
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Co-Pilot Chat
        </button>
        <button
          onClick={() => setActiveSubTab("simulation")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSubTab === "simulation" 
              ? "bg-white text-blue-600 shadow-sm border border-gray-150" 
              : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Cpu className="w-4 h-4" />
          What-If Simulator
        </button>
      </div>

      {/* SUB-VIEWS */}

      {/* 1. INTERACTIVE CHAT CO-PILOT */}
      {activeSubTab === "chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Messages conversation stream */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col h-[500px] justify-between">
            <div className="space-y-4 overflow-y-auto pr-2 flex-1 mb-4">
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-3 animate-fade-in ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "model" && (
                    <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[85%] font-medium ${
                    m.role === "user" 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-gray-50 border border-gray-200 text-gray-800 rounded-bl-none"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              
              {loadingChat && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl text-xs text-gray-500 font-mono animate-pulse">
                    Guardian is typing tactical guidelines...
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ask: 'What should I do right now to avoid missing my deadline?'" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loadingChat}
                className="flex-1 bg-white border border-gray-250 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              />
              <button 
                type="submit" 
                disabled={loadingChat || !inputMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3.5 rounded-2xl transition shadow-sm flex items-center justify-center cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick-Help context recommendations column */}
          <div className="space-y-4 bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider">Quick Tactics Hotkeys</h4>
            <p className="text-[11px] text-gray-500 leading-normal">Instantly inject tactical prompts into your active discussion session:</p>
            
            <div className="space-y-2.5 pt-1">
              {[
                { label: "Ultimate Priority Action", text: "What should I do right now to avoid missing my deadline?" },
                { label: "Ruthless De-scoping", text: "Analyze my critical path and recommend exactly one ruthless de-scoping trade-off." },
                { label: "Brutal Timeline Audit", text: "Am I going to make it? Give me the brutal timeline audit based on remaining subtasks and exact deadlines." }
              ].map((hotkey, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInputMessage(hotkey.text);
                  }}
                  className="w-full text-left p-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-400 transition cursor-pointer hover:bg-blue-50/20"
                >
                  <span className="text-xs font-bold text-gray-900 block">{hotkey.label}</span>
                  <span className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{hotkey.text}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 2. PREDICTIVE WHAT-IF SIMULATOR */}
      {activeSubTab === "simulation" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Preset scenarios side column */}
          <div className="space-y-4 bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider">Select Preset Scenarios</h4>
            
            <div className="space-y-2 pt-1">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleRunSimulation(preset.text, preset.id)}
                  disabled={loadingSimulation || goals.length === 0}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 justify-between cursor-pointer ${
                    selectedPreset === preset.id 
                      ? "bg-blue-50/70 text-blue-700 border-blue-400 shadow-sm" 
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50/60"
                  } disabled:opacity-40`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-gray-400 tracking-wider uppercase">SCENARIO</span>
                    <span className="text-xs font-bold text-gray-800 block leading-tight">{preset.label}</span>
                  </div>
                  <Play className={`w-3.5 h-3.5 mt-0.5 shrink-0 transition-transform ${selectedPreset === preset.id ? "text-blue-600 rotate-90" : "text-gray-400"}`} />
                </button>
              ))}
            </div>

            <div className="relative flex items-center justify-center py-2.5">
              <span className="absolute w-full h-[1px] bg-gray-150" />
              <span className="relative bg-white px-2 text-[9px] font-mono text-gray-400 uppercase tracking-wider">OR CUSTOM SCENARIO</span>
            </div>

            <textarea
              rows={3}
              placeholder="What if I delay task B by 3 days? / What if I spend all night prepping behavioural answers?..."
              value={customScenario}
              onChange={(e) => setCustomScenario(e.target.value)}
              disabled={loadingSimulation || goals.length === 0}
              className="w-full bg-white border border-gray-250 rounded-xl px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
            />
            <button
              onClick={() => handleRunSimulation(customScenario, "custom")}
              disabled={loadingSimulation || !customScenario.trim() || goals.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" /> Launch Simulation
            </button>
          </div>

          {/* Results panel column */}
          <div className="lg:col-span-2">
            {loadingSimulation ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-16 flex flex-col items-center justify-center space-y-4 shadow-sm h-full">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <div className="text-center">
                  <h5 className="text-xs font-bold text-gray-700 uppercase font-mono">Synchronizing Models...</h5>
                  <p className="text-xs text-gray-500 mt-1">Calibrating downstream risk vectors and calculating time dilation coefficients...</p>
                </div>
              </div>
            ) : simulationResult ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-5 animate-fade-in shadow-sm">
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-blue-700 uppercase tracking-widest bg-blue-50 border border-blue-100 px-2.5 py-1 rounded">
                      MODEL SIMULATOR RESPONSE
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 mt-2.5">
                      Forecast Scenario Outcomes
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`border p-4 rounded-xl flex items-center gap-3.5 shadow-sm ${
                    simulationResult.riskImpact > 0 
                      ? "bg-red-50/50 border-red-100 text-red-800" 
                      : "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                  }`}>
                    <div className={`p-2 rounded-xl shrink-0 ${
                      simulationResult.riskImpact > 0 
                        ? "bg-red-100 text-red-700" 
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {simulationResult.riskImpact > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 uppercase font-bold block">RISK INDEX IMPACT</span>
                      <div className="text-xl font-mono font-bold">
                        {simulationResult.riskImpact > 0 ? `+${simulationResult.riskImpact}%` : `${simulationResult.riskImpact}%`} Risk
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                    <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-mono text-gray-400 uppercase font-bold block">DEADLINE COLLISION RANGE</span>
                      <p className="text-xs font-semibold text-gray-800 truncate" title={simulationResult.deadlineImpact}>
                        {simulationResult.deadlineImpact}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/60 border border-gray-150 p-4.5 rounded-xl space-y-2">
                  <span className="text-[9px] font-mono font-bold text-gray-400 uppercase block">Impacted Subtask Targets</span>
                  {simulationResult.tasksAffected && simulationResult.tasksAffected.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {simulationResult.tasksAffected.map((task, idx) => (
                        <span key={idx} className="bg-white border border-gray-250 text-gray-700 text-[11px] px-2.5 py-1 rounded-lg font-medium shadow-xs">
                          {task}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No specific subtasks directly impacted.</p>
                  )}
                </div>

                <div className="bg-blue-50/40 border border-blue-100/60 p-4.5 rounded-xl space-y-1.5">
                  <span className="text-[9px] font-mono font-bold text-blue-700 uppercase block">AI Strategic Re-route Directive</span>
                  <p className="text-xs text-gray-750 leading-relaxed italic border-l border-blue-300 pl-3">
                    &quot;{simulationResult.recoveryStrategy}&quot;
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center shadow-sm h-full flex flex-col items-center justify-center space-y-3">
                <Cpu className="w-10 h-10 text-gray-300" />
                <div>
                  <h5 className="text-xs font-bold text-gray-700 uppercase font-mono">Prediction Model Standby</h5>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">Select a template on the left or type custom scenarios to run predictive timeline friction modeling.</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
