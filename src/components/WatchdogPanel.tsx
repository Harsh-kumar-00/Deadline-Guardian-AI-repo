import React from "react";
import { AlertTriangle, Clock, ShieldAlert, CheckCircle, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { Goal, WatchdogResult } from "../types";

interface WatchdogPanelProps {
  goals: Goal[];
  persona: string;
  onActionTriggered?: (action: string) => void;
  watchdogState: WatchdogResult | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function WatchdogPanel({ 
  goals, 
  persona, 
  watchdogState, 
  loading, 
  onRefresh 
}: WatchdogPanelProps) {

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-red-50 text-red-700 border-red-200 font-semibold";
      case "HIGH":
        return "bg-amber-50 text-amber-800 border-amber-200 font-semibold";
      case "MEDIUM":
        return "bg-blue-50 text-blue-700 border-blue-200 font-semibold";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return <ShieldAlert className="w-5 h-5 text-red-600" />;
      case "HIGH":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "MEDIUM":
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      {/* Background soft subtle blue radial */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-gray-900">AI Watchdog Guardian</h3>
            <p className="text-[11px] text-gray-500 font-mono">Proactive milestone surveillance calibrated for <strong className="text-blue-600 font-semibold">{persona}</strong></p>
          </div>
        </div>

        <button 
          onClick={onRefresh}
          disabled={loading || goals.length === 0}
          className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-gray-900 text-xs font-medium px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Re-evaluate Priorities
        </button>
      </div>

      {/* Main recommendation display */}
      {goals.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-xs italic leading-relaxed">
          Watchdog standby. Add a goal milestone or use the demo scenario to calibrate the AI prioritization engine.
        </div>
      ) : loading && !watchdogState ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
          <p className="text-xs text-gray-500 font-mono">Watchdog is computing critical deadline collision factors...</p>
        </div>
      ) : watchdogState ? (
        <div className="space-y-4">
          <div className="bg-blue-50/40 border border-blue-100/75 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-mono font-bold text-blue-700 uppercase tracking-wider bg-blue-100/80 px-2.5 py-1 rounded">
                  Recommended Action Path
                </span>
                <span className={`text-[9px] font-mono px-2.5 py-1 rounded border uppercase tracking-wider ${getUrgencyStyles(watchdogState.urgency)}`}>
                  {watchdogState.urgency} Urgency
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{getUrgencyIcon(watchdogState.urgency)}</div>
                <h4 className="text-lg font-bold text-gray-900 leading-snug">
                  {watchdogState.priorityAction}
                </h4>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed italic pl-8 border-l border-blue-200/50">
                &quot;{watchdogState.reason}&quot;
              </p>
            </div>

            <div className="flex md:flex-col items-center justify-between gap-2 bg-white border border-gray-200 p-4 rounded-xl shrink-0 min-w-[150px] shadow-sm">
              <div className="text-center md:text-left">
                <div className="text-[9px] font-mono text-gray-400 uppercase font-bold tracking-wider">Estimated Time</div>
                <div className="text-xl font-mono font-bold text-gray-800 mt-1 flex items-center justify-center md:justify-start gap-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  {watchdogState.estimatedHours} Hours
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center text-xs text-gray-400 italic">
          No assessment completed yet. Click &quot;Re-evaluate Priorities&quot; to prompt the Watchdog.
        </div>
      )}
    </div>
  );
}

