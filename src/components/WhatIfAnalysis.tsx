import React, { useState } from "react";
import { Sparkles, AlertTriangle, CheckCircle, RefreshCw, Cpu, Clock, Play } from "lucide-react";
import { Goal, WhatIfResult } from "../types";

interface WhatIfAnalysisProps {
  goals: Goal[];
  persona: string;
}

export default function WhatIfAnalysis({ goals, persona }: WhatIfAnalysisProps) {
  const [customScenario, setCustomScenario] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleRunSimulation = async (scenarioText: string, presetId: string | null) => {
    if (!scenarioText.trim()) return;
    setLoading(true);
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
      setResult(data);
    } catch (err) {
      console.error("Simulation Error:", err);
      alert("Failed to run What-If prediction. Check your API settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-gray-800">
      
      {/* Simulation Setup Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="space-y-3">
          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            PREDICTIVE SIMULATION MATRIX
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">AI What-If Simulation Engine</h3>
          <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
            Hypothesize about shifts in your schedule or progress. Gemini will forecast risk adjustments, list downstream task impacts, and recommend optimal recovery pathways.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Scenario selection column */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Select Scenario Target</h4>
            
            {/* Presets List */}
            <div className="space-y-2.5">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleRunSimulation(preset.text, preset.id)}
                  disabled={loading || goals.length === 0}
                  className={`w-full text-left p-4 rounded-xl text-xs font-semibold border transition flex items-start gap-3 justify-between cursor-pointer ${
                    selectedPreset === preset.id 
                      ? "bg-blue-50/70 text-blue-700 border-blue-400 shadow-sm" 
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50/60"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-gray-400 block tracking-wider uppercase">SCENARIO PRESET</span>
                    <span className="text-gray-800 font-medium">{preset.label}</span>
                  </div>
                  <Play className={`w-3.5 h-3.5 mt-0.5 shrink-0 transition-transform ${selectedPreset === preset.id ? "text-blue-600 rotate-90" : "text-gray-400"}`} />
                </button>
              ))}
            </div>

            <div className="relative flex items-center justify-center py-2">
              <span className="absolute w-full h-[1px] bg-gray-100" />
              <span className="relative bg-white px-3 text-[10px] font-mono text-gray-400 uppercase tracking-wider">OR CUSTOM INQUIRY</span>
            </div>

            {/* Custom Input */}
            <div className="space-y-2.5">
              <textarea
                rows={3}
                placeholder="What if I delay Task B by 3 days? / What if I spend all night prepping behavioural answers?..."
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                disabled={loading || goals.length === 0}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
              />
              <button
                onClick={() => handleRunSimulation(customScenario, "custom")}
                disabled={loading || !customScenario.trim() || goals.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:cursor-not-allowed"
              >
                {loading && selectedPreset === "custom" ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compiling Forecast...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Launch Custom Simulation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Prediction report column */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 flex flex-col items-center justify-center space-y-4 shadow-sm">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <div className="text-center">
                <h5 className="text-sm font-semibold text-gray-800">Synchronizing Predictive Model...</h5>
                <p className="text-xs text-gray-500 mt-1">Simulating risk factors, variance, and scheduling conflicts under this scenario</p>
              </div>
            </div>
          ) : result ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in shadow-sm">
              
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-100 pb-5 gap-4">
                <div>
                  <span className="text-[9px] font-mono font-bold text-blue-700 uppercase tracking-widest bg-blue-50 border border-blue-100 px-2.5 py-1 rounded">
                    GEMINI SIMULATED PREDICTION REPORT
                  </span>
                  <h4 className="text-lg font-bold text-gray-900 mt-3 leading-snug">
                    Forecast for: &quot;{selectedPreset === "skip" ? presets[0].label : selectedPreset === "finish_high" ? presets[1].label : selectedPreset === "delay" ? presets[2].label : customScenario}&quot;
                  </h4>
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Risk Impact Metric */}
                <div className={`border p-5 rounded-xl flex items-center gap-4 shadow-sm ${
                  result.riskImpact > 0 
                    ? "bg-red-50/50 border-red-100 text-red-800" 
                    : "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                }`}>
                  <div className={`p-3 rounded-xl shrink-0 ${
                    result.riskImpact > 0 
                      ? "bg-red-100 text-red-700" 
                      : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {result.riskImpact > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-gray-400 uppercase font-bold tracking-wider">RISK LEVEL ADJUSTMENT</span>
                    <div className="text-2xl font-mono font-bold mt-0.5">
                      {result.riskImpact > 0 ? `+${result.riskImpact}%` : `${result.riskImpact}%`} Risk
                    </div>
                  </div>
                </div>

                {/* Deadline Impact Metric */}
                <div className="bg-white border border-gray-200 p-5 rounded-xl flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-mono text-gray-400 uppercase font-bold tracking-wider">DEADLINE HORIZON METRIC</span>
                    <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate" title={result.deadlineImpact}>
                      {result.deadlineImpact}
                    </p>
                  </div>
                </div>

              </div>

              {/* Downstream affected subtasks list */}
              <div className="bg-gray-50/60 border border-gray-150 p-5 rounded-xl space-y-3">
                <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Downstream Subtasks Affected</span>
                {result.tasksAffected && result.tasksAffected.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.tasksAffected.map((task, idx) => (
                      <span key={idx} className="bg-white border border-gray-250 text-gray-700 text-xs px-3 py-1.5 rounded-lg font-medium shadow-sm">
                        {task}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No specific subtasks directly impacted or goals list empty.</p>
                )}
              </div>

              {/* Recovery Guidance Strategy */}
              <div className="bg-blue-50/50 border border-blue-100/70 p-5 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <Cpu className="w-4 h-4" />
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest">AI Directed Recovery Strategy</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed italic border-l border-blue-300 pl-4">
                  &quot;{result.recoveryStrategy}&quot;
                </p>
              </div>

            </div>
          ) : (
            <div className="border border-dashed border-gray-200 rounded-2xl p-16 text-center max-w-xl mx-auto space-y-4 bg-white shadow-sm">
              <Cpu className="w-12 h-12 text-gray-300 mx-auto" />
              <div>
                <h4 className="text-sm font-semibold text-gray-700">Predictive Simulation Model Idle</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  Select one of the scenario templates or query custom events to calibrate downriver risk adjustments and receive AI recovery directives.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

