import React, { useState, useEffect } from "react";
import { 
  X, CheckSquare, Square, Clock, Flame, AlertTriangle, 
  CheckCircle, RefreshCw, Cpu, Calendar, Zap, AlertCircle, ArrowLeft, Play,
  MessageSquare, Plus, Trash2, ChevronDown, ChevronUp, FileText
} from "lucide-react";
import { Goal, Subtask, RiskAnalysis, ScheduleResponse, RescuePlan } from "../types";
import { auth, googleProvider, getCachedAccessToken, setCachedAccessToken } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface GoalDetailsProps {
  goal: Goal;
  persona: string;
  onClose: () => void;
  onToggleSubtask: (goalId: string, subtaskId: string) => void;
  onUpdateProgress: (goalId: string, subtaskId: string, progress: number) => void;
  onAddSubtaskNote?: (goalId: string, subtaskId: string, content: string, type: "progress" | "blocker") => void;
  onDeleteSubtaskNote?: (goalId: string, subtaskId: string, noteId: string) => void;
  initialSubTab?: "breakdown" | "risk" | "schedule" | "rescue";
}

export default function GoalDetails({ 
  goal, 
  persona, 
  onClose, 
  onToggleSubtask, 
  onUpdateProgress,
  onAddSubtaskNote,
  onDeleteSubtaskNote,
  initialSubTab
}: GoalDetailsProps) {
  // Tabs within details: "breakdown" | "risk" | "schedule" | "rescue"
  const [activeSubTab, setActiveSubTab] = useState<"breakdown" | "risk" | "schedule" | "rescue">("breakdown");

  // Local states for subtask notes/blockers
  const [expandedNotes, setExpandedNotes] = useState<{ [subtaskId: string]: boolean }>({});
  const [newNoteText, setNewNoteText] = useState<{ [subtaskId: string]: string }>({});
  const [newNoteType, setNewNoteType] = useState<{ [subtaskId: string]: "progress" | "blocker" }>({});

  const toggleNotesExpanded = (subtaskId: string) => {
    setExpandedNotes(prev => ({ ...prev, [subtaskId]: !prev[subtaskId] }));
  };

  const handleAddNoteSubmit = (subtaskId: string) => {
    const text = newNoteText[subtaskId] || "";
    if (!text.trim() || !onAddSubtaskNote) return;
    const type = newNoteType[subtaskId] || "progress";
    onAddSubtaskNote(goal.id, subtaskId, text.trim(), type);
    // Clear draft content
    setNewNoteText(prev => ({ ...prev, [subtaskId]: "" }));
  };

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Local AI states
  const [loadingRisk, setLoadingRisk] = useState<string | null>(null);
  const [riskAnalysisMap, setRiskAnalysisMap] = useState<{ [subtaskId: string]: RiskAnalysis }>({});
  
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null);

  const [loadingRescue, setLoadingRescue] = useState(false);
  const [rescuePlanData, setRescuePlanData] = useState<RescuePlan | null>(null);
  const [panicLevel, setPanicLevel] = useState<"Normal" | "High" | "Critical">("High");
  const [hoursLeft, setHoursLeft] = useState<number>(12);
  const [originalEstimate, setOriginalEstimate] = useState<number>(8);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Google Docs Export States and Handlers
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const handleGoogleDocsExport = async () => {
    setExportError(null);
    const token = getCachedAccessToken();
    if (!token) {
      setShowAuthPrompt(true);
      return;
    }

    setExporting(true);
    try {
      // 1. Create document
      const createResponse = await fetch("https://docs.googleapis.com/v1/documents", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${goal.title} - Project Description`,
        }),
      });

      if (!createResponse.ok) {
        const errData = await createResponse.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Failed to create Google Doc");
      }

      const docData = await createResponse.json();
      const documentId = docData.documentId;

      // 2. Format contentText
      let contentText = `${goal.title.toUpperCase()}\n`;
      contentText += `=========================================\n\n`;
      contentText += `PROJECT SUMMARY DETAILS\n`;
      contentText += `-----------------------------------------\n`;
      contentText += `Deadline: ${goal.deadline}\n`;
      contentText += `Priority: ${goal.priority}\n`;
      contentText += `AI Threat Level / Risk: ${goal.overallRiskScore || 50}%\n\n`;

      contentText += `AI FEASIBILITY SYNTHESIS\n`;
      contentText += `-----------------------------------------\n`;
      contentText += `${goal.overallAnalysis || "Calibrating feasibility indices..."}\n\n`;

      contentText += `SUBTASKS & CURRENT PROGRESS\n`;
      contentText += `-----------------------------------------\n`;
      goal.subtasks.forEach((st, idx) => {
        contentText += `${idx + 1}. [${st.completed ? "COMPLETED" : `${st.progress}%`}] ${st.title}\n`;
        contentText += `   - Risk Factor: ${st.riskFactor}\n`;
        if (st.riskAnalysis) {
          contentText += `   - Analysis: ${st.riskAnalysis}\n`;
        }
        if (st.notes && st.notes.length > 0) {
          contentText += `   - Logged Notes & Blockers:\n`;
          st.notes.forEach(note => {
            contentText += `     * [${note.type.toUpperCase()}] ${note.content}\n`;
          });
        }
        contentText += `\n`;
      });

      if (scheduleData) {
        contentText += `AI 5-DAY ROADMAP & TIMEBOXING\n`;
        contentText += `-----------------------------------------\n`;
        if (scheduleData.productivityTip) {
          contentText += `AI Roadmap Insight: "${scheduleData.productivityTip}"\n\n`;
        }
        scheduleData.days.forEach((day, dIdx) => {
          contentText += `${day.dayName} (${day.focus})\n`;
          day.items.forEach(item => {
            contentText += `   [${item.timeSlot}] ${item.taskTitle}\n`;
            contentText += `   Objective: ${item.objective} (Est: ${item.duration})\n`;
          });
          contentText += `\n`;
        });
      }

      if (rescuePlanData) {
        contentText += `CRISIS RESCUE EMERGENCIES SUMMARY\n`;
        contentText += `-----------------------------------------\n`;
        if (rescuePlanData.mindsetHack) {
          contentText += `Psychological Resilience Guideline: "${rescuePlanData.mindsetHack}"\n\n`;
        }
        contentText += `Immediate Escape Actions:\n`;
        rescuePlanData.immediateActions.forEach((act, idx) => {
          contentText += `   ${idx + 1}. ${act}\n`;
        });
        contentText += `\nRuthless De-Scoping Cuts:\n`;
        rescuePlanData.descopeSuggestions.forEach((ds, idx) => {
          contentText += `   * ${ds}\n`;
        });
        contentText += `\n`;
      }

      contentText += `-----------------------------------------\n`;
      contentText += `Generated automatically on ${new Date().toLocaleString()} by AI Threat Guard - Powered by Google Gemini.`;

      // 3. Batch Update Document with single text insert
      const batchUpdateResponse = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                text: contentText,
                location: {
                  index: 1,
                },
              },
            },
          ],
        }),
      });

      if (!batchUpdateResponse.ok) {
        const errData = await batchUpdateResponse.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Failed to populate Google Doc");
      }

      setExportUrl(`https://docs.google.com/document/d/${documentId}/edit`);
    } catch (err: any) {
      console.error("Export error:", err);
      setExportError(err.message || "An unexpected error occurred during Google Doc export.");
    } finally {
      setExporting(false);
    }
  };

  const handleAuthAndExport = async () => {
    setShowAuthPrompt(false);
    setExporting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
        setExporting(false);
        setTimeout(() => {
          handleGoogleDocsExport();
        }, 100);
      } else {
        throw new Error("Failed to authenticate. Access token missing.");
      }
    } catch (err: any) {
      console.error("Popup Sign-in Error:", err);
      setExportError(err.message || "Could not authenticate your Google Account. Please check if popup blocker is active.");
      setExporting(false);
    }
  };

  // Stats calculation
  const totalSubtasks = goal.subtasks.length;
  const completedCount = goal.subtasks.filter((s) => s.completed).length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedCount / totalSubtasks) * 100) : 0;
  const highRiskCount = goal.subtasks.filter((s) => s.riskFactor === "High" && !s.completed).length;

  // Countdown timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, secondsRemaining]);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Run AI Risk Assessment for a subtask
  const runAIRiskAssessment = async (subtask: Subtask) => {
    setLoadingRisk(subtask.id);
    try {
      const hoursRemainingCalc = Math.max(2, subtask.estimatedHours * (1 - subtask.progress / 100));
      const response = await fetch("/api/ai/risk-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: subtask.title,
          deadline: goal.deadline,
          progress: subtask.progress,
          hoursRemaining: hoursRemainingCalc
        })
      });
      if (!response.ok) throw new Error("Risk assessment failed");
      const data = await response.json();
      setRiskAnalysisMap(prev => ({ ...prev, [subtask.id]: data }));
    } catch (err) {
      console.error("Risk Assessment Error:", err);
    } finally {
      setLoadingRisk(null);
    }
  };

  // Run AI Schedule Generator specifically for this goal
  const generateGoalSchedule = async () => {
    setLoadingSchedule(true);
    try {
      const allSubtasks = goal.subtasks.map((st) => ({
        title: st.title,
        goalTitle: goal.title,
        deadline: goal.deadline,
        progress: st.progress,
        completed: st.completed,
        riskFactor: st.riskFactor || "Medium",
        estimatedHours: st.estimatedHours,
      }));

      const response = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: allSubtasks,
          persona
        })
      });
      if (!response.ok) throw new Error("Failed to generate schedule");
      const data = await response.json();
      setScheduleData(data);
    } catch (err) {
      console.error("Schedule Gen Error:", err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Run AI Rescue Plan specifically for this goal
  const triggerRescueMode = async (subtask: Subtask) => {
    setLoadingRescue(true);
    try {
      const response = await fetch("/api/ai/rescue-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: subtask.title,
          deadline: goal.deadline,
          hoursLeft,
          originalEstimate,
          panicLevel
        })
      });
      if (!response.ok) throw new Error("Rescue formulation failed");
      const data = await response.json();
      setRescuePlanData(data);
      setSecondsRemaining(hoursLeft * 3600);
      setIsTimerActive(true);
    } catch (err) {
      console.error("Rescue Error:", err);
    } finally {
      setLoadingRescue(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 animate-fade-in text-gray-800">
      
      {/* Back button & Header Info */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition cursor-pointer"
            title="Back to Goals List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                goal.priority === "High" ? "bg-red-50 border-red-200 text-red-700" :
                goal.priority === "Medium" ? "bg-amber-50 border-amber-200 text-amber-700" :
                "bg-green-50 border-green-200 text-green-700"
              }`}>
                {goal.priority} Priority
              </span>
              <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> Deadline: {goal.deadline}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-1.5">{goal.title}</h3>
          </div>
        </div>
        
        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono font-bold text-gray-400 uppercase">AI Threat Level</div>
          <div className="flex items-center gap-2 justify-end mt-1">
            <div className={`w-3 h-3 rounded-full ${
              (goal.overallRiskScore || 50) > 70 ? "bg-red-500 animate-pulse" :
              (goal.overallRiskScore || 50) > 35 ? "bg-amber-500" : "bg-emerald-500"
            }`} />
            <span className="text-sm font-bold font-mono text-gray-800">{goal.overallRiskScore || 50}%</span>
          </div>
        </div>
      </div>

      {/* Goal Overview analysis card */}
      <div className="bg-blue-50/30 border border-blue-100/70 p-4.5 rounded-2xl flex items-start gap-3">
        <Cpu className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
        <div>
          <span className="text-[9px] font-mono font-bold text-blue-700 uppercase tracking-wider block">AI Feasibility Synthesis</span>
          <p className="text-xs text-gray-700 leading-relaxed mt-1 font-medium">{goal.overallAnalysis || "Calibrating feasibility indices..."}</p>
        </div>
      </div>

      {/* Export to Google Docs control card */}
      <div className="bg-emerald-50/40 border border-emerald-100 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-750">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-emerald-700 uppercase tracking-wider block">Google Workspace Integration</span>
            <p className="text-xs text-gray-650 leading-relaxed mt-1 font-medium">Export this comprehensive AI-optimized project structure directly into a Google Doc.</p>
          </div>
        </div>
        <button
          onClick={handleGoogleDocsExport}
          disabled={exporting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        >
          {exporting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5" />
              Generate Google Doc
            </>
          )}
        </button>
      </div>

      {/* Internal Tabs - Follows Material tab design */}
      <div className="flex border-b border-gray-150 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab("breakdown")}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === "breakdown" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          📊 Breakdown & Tasks
        </button>
        <button
          onClick={() => {
            setActiveSubTab("risk");
            // Automatically run risk assessment for first incomplete subtask if empty
            const firstIncomplete = goal.subtasks.find(s => !s.completed);
            if (firstIncomplete && !riskAnalysisMap[firstIncomplete.id]) {
              runAIRiskAssessment(firstIncomplete);
            }
          }}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === "risk" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          🛡️ Predictive Risk
        </button>
        <button
          onClick={() => {
            setActiveSubTab("schedule");
            if (!scheduleData) {
              generateGoalSchedule();
            }
          }}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === "schedule" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          📅 AI 5-Day Schedule
        </button>
        <button
          onClick={() => {
            setActiveSubTab("rescue");
            // Set first incomplete subtask as default rescue target
            const firstIncomplete = goal.subtasks.find(s => !s.completed);
            if (firstIncomplete) {
              setOriginalEstimate(firstIncomplete.estimatedHours);
            }
          }}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeSubTab === "rescue" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          🔥 Crisis Rescue Mode
        </button>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. BREAKDOWN & PROGRESS SLIDERS */}
      {activeSubTab === "breakdown" && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 uppercase font-mono tracking-wider">Subtask Surveillance ({progressPercent}% Finished)</h4>
            <span className="text-xs text-gray-500 font-medium">Estimated: {goal.subtasks.reduce((acc, curr) => acc + curr.estimatedHours, 0)} hours total</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goal.subtasks.map((st) => (
              <div key={st.id} className="bg-gray-50/40 border border-gray-200 rounded-2xl p-4.5 space-y-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onToggleSubtask(goal.id, st.id)}
                        className="text-gray-400 hover:text-blue-600 transition cursor-pointer shrink-0 mt-0.5"
                      >
                        {st.completed ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                      </button>
                      <div>
                        <span className={`text-xs sm:text-sm font-bold leading-snug ${st.completed ? "line-through text-gray-400 font-normal" : "text-gray-800"}`}>
                          {st.title}
                        </span>
                        <p className="text-[11px] text-gray-500 mt-1 pl-0.5 leading-relaxed">{st.riskAnalysis}</p>
                      </div>
                    </div>
                    
                    <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                      st.riskFactor === "High" ? "bg-red-50 text-red-700 border border-red-100" :
                      st.riskFactor === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                      "bg-green-50 text-green-700 border border-green-100"
                    }`}>
                      {st.riskFactor} Risk
                    </span>
                  </div>

                  {!st.completed && (
                    <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-2 shadow-xs">
                      <div className="flex justify-between text-[9px] text-gray-400 font-mono font-bold">
                        <span>COMPLETION RATIO</span>
                        <span>{st.progress}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={st.progress}
                        onChange={(e) => onUpdateProgress(goal.id, st.id, parseInt(e.target.value))}
                        className="w-full accent-blue-600 bg-gray-200 h-1.5 rounded-full appearance-none cursor-pointer"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-gray-400 font-mono font-bold">EST: {st.estimatedHours} HOURS</span>
                        <button
                          onClick={() => {
                            setActiveSubTab("risk");
                            runAIRiskAssessment(st);
                          }}
                          className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Cpu className="w-3 h-3" /> Analyze Risk
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes/Blockers Section */}
                <div className="mt-2 border-t border-gray-100 pt-2.5">
                  <button
                    onClick={() => toggleNotesExpanded(st.id)}
                    className="w-full flex items-center justify-between text-left text-[11px] font-semibold text-gray-500 hover:text-gray-800 transition py-1 px-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                      Notes & Blockers
                      <span className="bg-gray-200 px-1.5 py-0.2 rounded-full font-mono text-[9px] text-gray-650 font-bold">
                        {(st.notes || []).length}
                      </span>
                    </span>
                    {expandedNotes[st.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {expandedNotes[st.id] && (
                    <div className="mt-2.5 space-y-2.5 pl-1 animate-fade-in">
                      {/* Form to add note */}
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">ADD NOTE / BLOCKER</span>
                          <div className="flex bg-gray-200 p-0.5 rounded-lg text-[9px] font-bold">
                            <button
                              type="button"
                              onClick={() => setNewNoteType(prev => ({ ...prev, [st.id]: "progress" }))}
                              className={`px-2 py-0.5 rounded-md transition ${
                                (newNoteType[st.id] || "progress") === "progress"
                                  ? "bg-white text-emerald-700 shadow-xs font-bold"
                                  : "text-gray-500 hover:text-gray-900"
                              }`}
                            >
                              Progress
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewNoteType(prev => ({ ...prev, [st.id]: "blocker" }))}
                              className={`px-2 py-0.5 rounded-md transition ${
                                (newNoteType[st.id] || "progress") === "blocker"
                                  ? "bg-white text-red-700 shadow-xs font-bold"
                                  : "text-gray-500 hover:text-gray-900"
                              }`}
                            >
                              Blocker
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder={(newNoteType[st.id] || "progress") === "blocker" ? "Describe blocker..." : "Describe progress..."}
                            value={newNoteText[st.id] || ""}
                            onChange={(e) => setNewNoteText(prev => ({ ...prev, [st.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddNoteSubmit(st.id);
                              }
                            }}
                            className="flex-1 bg-white border border-gray-250 rounded-lg px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddNoteSubmit(st.id)}
                            disabled={!(newNoteText[st.id] || "").trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-1.5 transition flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Notes list */}
                      {(st.notes || []).length === 0 ? (
                        <p className="text-[10px] text-gray-400 italic pl-1">No notes or blockers logged yet.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {(st.notes || []).map((note) => (
                            <div
                              key={note.id}
                              className={`group/note flex items-start justify-between gap-2 p-2 rounded-xl border text-xs leading-normal relative transition ${
                                note.type === "blocker"
                                  ? "bg-red-50/50 border-red-100 text-red-900"
                                  : "bg-emerald-50/40 border-emerald-100 text-emerald-900"
                              }`}
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[8px] font-mono font-bold uppercase px-1 py-0.1 rounded ${
                                    note.type === "blocker"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}>
                                    {note.type}
                                  </span>
                                  <span className="text-[9px] font-mono text-gray-400">
                                    {new Date(note.createdAt).toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </span>
                                </div>
                                <p className="text-[11px] font-medium leading-normal break-words">
                                  {note.content}
                                </p>
                              </div>

                              {onDeleteSubtaskNote && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteSubtaskNote(goal.id, st.id, note.id)}
                                  className="text-gray-400 hover:text-red-600 transition shrink-0 self-center opacity-0 group-hover/note:opacity-100 p-1 rounded-md hover:bg-black/5 cursor-pointer"
                                  title="Delete Note"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. PREDICTIVE RISK ANALYSIS */}
      {activeSubTab === "risk" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase font-mono tracking-wider">Predictive Vulnerability Analysis</h4>
              <p className="text-xs text-gray-500 mt-0.5">Choose an active subtask to model timeline friction and mitigation pathways.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sidebar with incomplete subtasks */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block mb-1">Target Subtasks</span>
              {goal.subtasks.map((st) => (
                <button
                  key={st.id}
                  onClick={() => runAIRiskAssessment(st)}
                  disabled={loadingRisk === st.id}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer text-xs ${
                    loadingRisk === st.id ? "bg-gray-50 opacity-60" :
                    riskAnalysisMap[st.id] 
                      ? "bg-blue-50/40 border-blue-200 text-blue-900" 
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <span className="font-bold truncate block">{st.title}</span>
                    <span className="text-[10px] font-mono text-gray-400">Hours Estimated: {st.estimatedHours}h</span>
                  </div>
                  {loadingRisk === st.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                  ) : (
                    <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      st.riskFactor === "High" ? "bg-red-50 text-red-700" :
                      st.riskFactor === "Medium" ? "bg-amber-50 text-amber-700" :
                      "bg-green-50 text-green-700"
                    }`}>
                      {st.riskFactor}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Analysis details pane */}
            <div className="lg:col-span-2 bg-gray-50/50 border border-gray-200 rounded-2xl p-5 sm:p-6 min-h-[250px] flex flex-col justify-between">
              
              {/* Check if any analysis is loaded */}
              {Object.keys(riskAnalysisMap).length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <Cpu className="w-10 h-10 text-gray-300" />
                  <div>
                    <h5 className="text-xs font-bold text-gray-700 uppercase font-mono">No analysis loaded</h5>
                    <p className="text-xs text-gray-400 max-w-xs mt-1">Select one of the target subtasks on the left to trigger real-time Gemini AI risk modelling.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 flex-1">
                  
                  {/* Select which loaded analysis to display */}
                  {goal.subtasks.filter(s => riskAnalysisMap[s.id]).map((st) => {
                    const rAnalysis = riskAnalysisMap[st.id];
                    return (
                      <div key={st.id} className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
                          <div>
                            <span className="text-[9px] font-mono font-bold text-blue-700 uppercase tracking-widest block">AI RISK ASSESSMENT SUMMARY</span>
                            <h5 className="text-sm font-bold text-gray-900 mt-1">{st.title}</h5>
                          </div>
                          
                          <div className={`font-mono font-bold text-xs px-3 py-1.5 rounded-xl border ${
                            rAnalysis.riskTier === "High" ? "bg-red-50 text-red-700 border-red-200" :
                            rAnalysis.riskTier === "Medium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-green-50 text-green-700 border-green-200"
                          }`}>
                            Score: {rAnalysis.riskScore}/100
                          </div>
                        </div>

                        <p className="text-xs text-gray-700 leading-relaxed italic border-l-2 border-blue-400 pl-4">
                          &quot;{rAnalysis.assessmentText}&quot;
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Core Risk Drivers</span>
                            <ul className="list-disc pl-4 space-y-1.5 text-xs text-gray-600 mt-2 leading-relaxed">
                              {rAnalysis.reasons.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-blue-700 uppercase">AI Mitigation Tactics</span>
                            <ul className="list-decimal pl-4 space-y-1.5 text-xs text-blue-950 mt-2 leading-relaxed font-semibold">
                              {rAnalysis.mitigationActions.map((m, i) => <li key={i}>{m}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })[0] || (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <Cpu className="w-10 h-10 text-gray-300" />
                      <div>
                        <h5 className="text-xs font-bold text-gray-700 uppercase font-mono">Select Loaded Report</h5>
                        <p className="text-xs text-gray-400 max-w-xs mt-1">Select a subtask on the left to see its risk analysis response.</p>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* 3. AI SCHEDULE ROADMAP */}
      {activeSubTab === "schedule" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase font-mono tracking-wider">Adaptive Copilot Timeboxing</h4>
              <p className="text-xs text-gray-500 mt-0.5">Gemini structures a highly logical 5-day daily calendar specific to this goal's subtasks.</p>
            </div>
            
            <button
              onClick={generateGoalSchedule}
              disabled={loadingSchedule}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSchedule ? "animate-spin" : ""}`} /> 
              {loadingSchedule ? "Rebuilding..." : "Regenerate Goal Roadmap"}
            </button>
          </div>

          {loadingSchedule ? (
            <div className="bg-gray-50 border border-gray-250 p-12 rounded-2xl flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
              <p className="text-xs text-gray-500 font-mono">Gemini is structuring a custom hours-allocated schedule...</p>
            </div>
          ) : scheduleData ? (
            <div className="space-y-6">
              
              {/* Product Insight */}
              {scheduleData.productivityTip && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 shadow-xs">
                  <Zap className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wide">AI Roadmap Insight</span>
                    <p className="text-xs text-blue-900 mt-0.5 italic leading-relaxed font-semibold">
                      &quot;{scheduleData.productivityTip}&quot;
                    </p>
                  </div>
                </div>
              )}

              {/* Day grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scheduleData.days.slice(0, 3).map((day, dIdx) => (
                  <div key={dIdx} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                      <div>
                        <h5 className="font-bold text-sm text-gray-900">{day.dayName}</h5>
                        <p className="text-[11px] text-blue-600 font-bold mt-0.5">{day.focus}</p>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-gray-400 bg-gray-50 border border-gray-250 px-2 py-0.5 rounded">
                        DAY {dIdx + 1}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {day.items.map((item, iIdx) => (
                        <div key={iIdx} className="bg-gray-50/50 border border-gray-150 rounded-xl p-3 flex gap-2.5 items-start">
                          <span className="text-[8px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap mt-0.5">
                            {item.timeSlot}
                          </span>
                          <div className="space-y-0.5 min-w-0">
                            <h6 className="text-[11px] font-bold text-gray-900 truncate">{item.taskTitle}</h6>
                            <p className="text-[10px] text-gray-500 leading-normal line-clamp-2">{item.objective}</p>
                            <span className="text-[9px] text-gray-400 font-mono font-bold block pt-1">Est: {item.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-gray-200 rounded-2xl p-10 text-center bg-white shadow-xs max-w-md mx-auto space-y-3">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto" />
              <div>
                <h5 className="text-xs font-bold text-gray-700 uppercase font-mono">No roadmap structured yet</h5>
                <p className="text-xs text-gray-400 mt-1">Request a structured 5-day daily focus timebox layout tailored perfectly for this goal milestone.</p>
              </div>
              <button
                onClick={generateGoalSchedule}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Structure Schedule Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. CRISIS RESCUE MODE */}
      {activeSubTab === "rescue" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Active timer alert card if configured */}
          {isTimerActive && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-pulse text-amber-900">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-full text-amber-600">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-amber-800 text-sm">EMERGENCY ACTIVE</h5>
                  <p className="text-xs text-amber-700 mt-0.5">Focusing purely on de-scoped core logic routes. All distractions paused.</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-amber-500 font-mono font-bold tracking-wider uppercase block">RESCUE COUNTDOWN</span>
                <span className="text-xl font-mono font-bold text-amber-600 mt-0.5 block">{formatCountdown(secondsRemaining)}</span>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-600">
                <Flame className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 font-mono uppercase tracking-wider">Configure Crisis parameters</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Calibrate panic rates and remaining hours to formulate a brutal Hour-1 to Hour-6 emergency sprint.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select target subtask */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 font-mono uppercase">Target Lagging Subtask</label>
                <select
                  onChange={(e) => {
                    const st = goal.subtasks.find(s => s.id === e.target.value);
                    if (st) {
                      setOriginalEstimate(st.estimatedHours);
                    }
                  }}
                  className="w-full bg-white border border-gray-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {goal.subtasks.filter(s => !s.completed).map((st) => (
                    <option key={st.id} value={st.id}>
                      [{st.riskFactor} Risk] {st.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Panic Level */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 font-mono uppercase">Level of Panic</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Normal", "High", "Critical"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPanicLevel(level)}
                      className={`py-1.5 rounded-lg text-[11px] font-bold transition border cursor-pointer ${
                        panicLevel === level 
                          ? "bg-amber-50 text-amber-700 border-amber-300 font-semibold" 
                          : "bg-white text-gray-400 border-gray-200 hover:text-gray-650"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Time Remaining */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 font-mono uppercase">Time Remaining Until Submission (Hours)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="48" 
                  value={hoursLeft}
                  onChange={(e) => setHoursLeft(parseInt(e.target.value) || 12)}
                  className="w-full bg-white border border-gray-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Original Estimate */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 font-mono uppercase">Original Task Estimate (Hours)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="48" 
                  value={originalEstimate}
                  onChange={(e) => setOriginalEstimate(parseInt(e.target.value) || 8)}
                  className="w-full bg-white border border-gray-250 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const selectedSelect = goal.subtasks.find(s => !s.completed);
                if (selectedSelect) {
                  triggerRescueMode(selectedSelect);
                }
              }}
              disabled={loadingRescue}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {loadingRescue ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> Formulating Crisis Directives...
                </>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 animate-pulse" /> Trigger Rescue Sprint
                </>
              )}
            </button>
          </div>

          {/* Rescue Plan Results */}
          {rescuePlanData && (
            <div className="space-y-6 animate-fade-in">
              {/* Mindset block */}
              {rescuePlanData.mindsetHack && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3 shadow-xs text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wide">Psychological Resilience Trigger</span>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed italic font-semibold">
                      &quot;{rescuePlanData.mindsetHack}&quot;
                    </p>
                  </div>
                </div>
              )}

              {/* Action columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="space-y-6">
                  {/* Immediate actions */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-50 rounded-lg text-red-600 border border-red-100">
                        <Zap className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-gray-800 text-xs uppercase font-mono tracking-wide">Immediate Escape Actions</h5>
                    </div>
                    <ul className="space-y-3">
                      {rescuePlanData.immediateActions.map((act, idx) => (
                        <li key={idx} className="flex gap-2.5 text-xs text-gray-700 leading-relaxed font-medium">
                          <span className="text-red-600 font-mono font-bold">{idx + 1}.</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Ruthless de-scoping */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <h5 className="font-bold text-gray-800 text-xs uppercase font-mono tracking-wide">Ruthless De-Scoping Cuts</h5>
                    </div>
                    <ul className="space-y-3">
                      {rescuePlanData.descopeSuggestions.map((ds, idx) => (
                        <li key={idx} className="flex gap-2.5 text-xs text-gray-700 leading-relaxed font-medium">
                          <span className="text-amber-600 font-mono font-bold">●</span>
                          <span>{ds}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Hourly timeline */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                      <Clock className="w-4 h-4" />
                    </div>
                    <h5 className="font-bold text-gray-800 text-xs uppercase font-mono tracking-wide">6-Hour Hourly Focus Tracker</h5>
                  </div>

                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {rescuePlanData.hourlyGuide.map((h, idx) => (
                      <div key={idx} className="flex gap-4 items-start border-l-2 border-gray-150 pl-4 relative">
                        <div className="absolute w-2 h-2 bg-amber-500 rounded-full -left-[5px] top-1.5" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-blue-600">{h.hour}</span>
                            <span className="text-xs font-bold text-gray-800">{h.focus}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-relaxed italic font-medium">{h.tips}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* Auth Connection Dialog */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 border border-gray-150 animate-fade-in text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 text-emerald-650 animate-bounce">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-gray-900">Google Docs Connection</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                To export this project description directly, please connect your Google Docs and Drive account with permission to save files.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleAuthAndExport}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4" />
                Connect & Export
              </button>
              <button
                onClick={() => setShowAuthPrompt(false)}
                className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-750 bg-gray-50 hover:bg-gray-100 rounded-xl transition border border-gray-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {exportUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 border border-gray-150 animate-fade-in text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center border border-emerald-200 text-emerald-600 animate-pulse">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-gray-900">Google Doc Created!</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Your detailed project description has been successfully generated and compiled into a new Google Document.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <a
                href={exportUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setExportUrl(null)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center"
              >
                <Play className="w-4 h-4 rotate-0" />
                Open Google Doc
              </a>
              <button
                onClick={() => setExportUrl(null)}
                className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-750 bg-gray-50 hover:bg-gray-100 rounded-xl transition border border-gray-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Dialog */}
      {exportError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 border border-gray-150 animate-fade-in text-center">
            <div className="mx-auto w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100 text-red-650">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-red-650">Export Failed</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                {exportError}
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setExportError(null)}
                className="w-full py-2.5 text-xs font-semibold text-gray-750 hover:bg-gray-50 rounded-xl transition border border-gray-250 cursor-pointer"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
