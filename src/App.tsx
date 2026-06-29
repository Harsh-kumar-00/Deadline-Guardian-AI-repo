import React, { useState, useEffect, useMemo, FormEvent } from "react";
import { 
  Shield, Plus, Trash2, Clock, Flame, CheckSquare, Square, 
  AlertTriangle, RotateCcw, LayoutDashboard, Calendar, Zap, 
  BookOpen, AlertCircle, ThumbsUp, Compass, Cpu, HelpCircle, RefreshCw,
  Sparkles, Terminal, Activity, ArrowUpRight, LogIn, AlertOctagon, Settings,
  Search, ArrowUpDown, SlidersHorizontal, Filter, Sun, Moon, Download,
  Award, Eye, EyeOff
} from "lucide-react";
import { 
  Goal, Subtask, RiskAnalysis, ScheduleResponse, RescuePlan, 
  WatchdogResult, WhatIfResult, AgentState, ProductivityPersona 
} from "./types";
import ArchitectureBlueprint from "./components/ArchitectureBlueprint";
import UserAuth from "./components/UserAuth";
import WatchdogPanel from "./components/WatchdogPanel";
import GoalDetails from "./components/GoalDetails";
import AIAssistant from "./components/AIAssistant";
import AchievementsPanel from "./components/AchievementsPanel";
import { db, setDoc, doc, deleteDoc, collection, query, onSnapshot } from "./lib/firebase";
import { User } from "firebase/auth";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Seed active goals to provide an immediate interactive sandbox out-of-the-box!
const INITIAL_GOALS: Goal[] = [
  {
    id: "g1",
    title: "Launch Deadline Guardian Hackathon Demo",
    description: "Deploy the final working prototype of our productivity companion and prepare the judges' video demonstration.",
    deadline: "2026-06-25",
    priority: "High",
    overallRiskScore: 55,
    overallAnalysis: "We are well-underway, but high-risk animation states (Connect Rescue Mode Countdown Alerts) are currently lagging, putting our final deployment under moderate threat.",
    subtasks: [
      {
        id: "s1",
        title: "Configure Server-Side Gemini API Routes",
        estimatedHours: 4,
        order: 1,
        riskFactor: "Low",
        riskAnalysis: "Simple routing logic with stable standard Express middleware.",
        completed: true,
        progress: 100
      },
      {
        id: "s2",
        title: "Design Tailwind UX with Interactive Gauges",
        estimatedHours: 6,
        order: 2,
        riskFactor: "Medium",
        riskAnalysis: "Visual design takes iterative refinements and precise padding balances.",
        completed: true,
        progress: 100
      },
      {
        id: "s3",
        title: "Connect Rescue Mode Countdown Alerts",
        estimatedHours: 5,
        order: 3,
        riskFactor: "High",
        riskAnalysis: "Requires synchronization of interval timers which might cause state lags.",
        completed: false,
        progress: 30
      },
      {
        id: "s4",
        title: "Write Full Firebase Setup Architecture Blueprint",
        estimatedHours: 4,
        order: 4,
        riskFactor: "Low",
        riskAnalysis: "Concept documentation is a low execution risk, purely layout work.",
        completed: false,
        progress: 10
      }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "goals" | "assistant" | "settings">("dashboard");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [initialSubTab, setInitialSubTab] = useState<"breakdown" | "risk" | "schedule" | "rescue">("breakdown");
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [apiStatus, setApiStatus] = useState<{ geminiConfigured: boolean; appUrl: string }>({ geminiConfigured: false, appUrl: "" });
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // New Upgrade States
  const [persona, setPersona] = useState<ProductivityPersona>("Entrepreneur");
  const [watchdogResult, setWatchdogResult] = useState<WatchdogResult | null>(null);
  const [loadingWatchdog, setLoadingWatchdog] = useState(false);
  const [agentsState, setAgentsState] = useState<AgentState[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  
  // Firebase Auth & Firestore Sync States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [retryCount, setRetryCount] = useState(0);

  // Loading states for AI APIs
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [loadingRisk, setLoadingRisk] = useState<string | null>(null); // maps to subtask id
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingRescue, setLoadingRescue] = useState(false);

  // Active AI Analysis States
  const [activeRiskAnalysis, setActiveRiskAnalysis] = useState<{ [subtaskId: string]: RiskAnalysis }>({});
  const [aiSchedule, setAiSchedule] = useState<ScheduleResponse | null>(null);
  const [activeRescuePlan, setActiveRescuePlan] = useState<RescuePlan | null>(null);

  // Rescue Mode setup variables
  const [rescueSubtask, setRescueSubtask] = useState<Subtask | null>(null);
  const [panicLevel, setPanicLevel] = useState<"Normal" | "High" | "Critical">("High");
  const [hoursLeft, setHoursLeft] = useState<number>(12);
  const [originalEstimate, setOriginalEstimate] = useState<number>(8);
  const [isRescueActive, setIsRescueActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

    // Add Goal form state
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");
  const [newGoalPriority, setNewGoalPriority] = useState<"Low" | "Medium" | "High">("Medium");

  // Sorting and Filtering states for the Dashboard goals list
  const [dashboardSortBy, setDashboardSortBy] = useState<"deadline" | "priority" | "risk">("deadline");
  const [dashboardSortOrder, setDashboardSortOrder] = useState<"asc" | "desc">("asc");
  const [dashboardFilterPriority, setDashboardFilterPriority] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [dashboardFilterRisk, setDashboardFilterRisk] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState("");

  const [showWatchdog, setShowWatchdog] = useState(true);
  const [showAchievements, setShowAchievements] = useState(true);
  const [compactGoalCards, setCompactGoalCards] = useState(false);
  const [cleanupGoalId, setCleanupGoalId] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // In-memory ref to hold progress slider database write debounce timers
  const dbWriteDebounces = React.useRef<{ [goalId: string]: NodeJS.Timeout }>({});

  // Load API Configuration Status on Mount
  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        setApiStatus(data);
        setIsCheckingStatus(false);
      })
      .catch((err) => {
        console.error("Failed to check backend configuration status:", err);
        setIsCheckingStatus(false);
      });
  }, []);

  // Countdown timer for Rescue Mode
  useEffect(() => {
    let interval: any = null;
    if (isRescueActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      setIsRescueActive(false);
    }
    return () => clearInterval(interval);
  }, [isRescueActive, secondsRemaining]);

  // Format seconds to HH:MM:SS
  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(goals, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `deadline-guardian-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Failed to export backup", err);
    }
  };

  const getDeadlineBadge = (deadlineStr: string) => {
    try {
      const deadlineDate = new Date(deadlineStr + "T23:59:59");
      const now = new Date();
      const diffMs = deadlineDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffMs <= 0) {
        return (
          <span className="text-[10px] font-mono font-bold bg-red-100 border border-red-300 text-red-700 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-400 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            Overdue
          </span>
        );
      }

      if (diffHours < 48) {
        return (
          <span className="text-[10px] font-mono font-bold bg-red-50 border border-red-200 text-red-600 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
            ⚠️ {diffDays === 1 ? "1 day left" : `${diffDays} days left`}
          </span>
        );
      }

      return (
        <span className="text-[10px] font-mono font-bold bg-blue-50 border border-blue-100 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-400 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          {diffDays} {diffDays === 1 ? "day" : "days"} remaining
        </span>
      );
    } catch (err) {
      return null;
    }
  };

  // Firebase Sync and Real-Time Listener Hook
  useEffect(() => {
    if (!currentUser) {
      setSyncStatus("idle");
      return;
    }

    setSyncStatus("syncing");
    const q = query(collection(db, "users", currentUser.uid, "goals"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsList: Goal[] = [];
      snapshot.forEach((docSnap) => {
        goalsList.push({ id: docSnap.id, ...docSnap.data() } as Goal);
      });

      // Sort goals by ID to preserve order
      goalsList.sort((a, b) => b.id.localeCompare(a.id));

      if (goalsList.length > 0) {
        setGoals(goalsList);
        setSelectedGoal(prev => {
          if (!prev) return null;
          return goalsList.find(g => g.id === prev.id) || null;
        });
      }
      setSyncStatus("synced");
    }, (error) => {
      console.error("Firestore Loading Error:", error);
      setSyncStatus("error");
    });

    return () => unsubscribe();
  }, [currentUser, retryCount]);

  // Generate structural hash of goals so background AI updates don't spam on progress slider movement
  const goalsStructureHash = goals.map(g => `${g.id}:${g.subtasks.map(s => `${s.id}-${s.completed}`).join(',')}`).join('|');

  // Adaptive Replanning: Recalculate Watchdog and Multi-Agent States automatically when structural goals or persona shifts
  useEffect(() => {
    if (goals.length === 0) {
      setWatchdogResult(null);
      setAgentsState([]);
      return;
    }

    const timer = setTimeout(() => {
      recalculateWatchdog();
      recalculateAgents();
    }, 1500); // 1.5s debounce to protect against slider spam

    return () => clearTimeout(timer);
  }, [goalsStructureHash, persona]);

  const recalculateWatchdog = async () => {
    setLoadingWatchdog(true);
    try {
      const response = await fetch("/api/ai/watchdog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals, persona })
      });
      if (response.ok) {
        const data = await response.json();
        setWatchdogResult(data);
      }
    } catch (err) {
      console.error("Watchdog Autocalculate Error:", err);
    } finally {
      setLoadingWatchdog(false);
    }
  };

  const recalculateAgents = async () => {
    setLoadingAgents(true);
    try {
      const response = await fetch("/api/ai/multi-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals, persona })
      });
      if (response.ok) {
        const data = await response.json();
        setAgentsState(data);
      }
    } catch (err) {
      console.error("Agents Sync Autocalculate Error:", err);
    } finally {
      setLoadingAgents(false);
    }
  };

  // One-Click Sandbox Demo Scenario "Hackathon Participant"
  const loadDemoScenario = async () => {
    const DEMO_GOALS: Goal[] = [
      {
        id: "g-demo-1",
        title: "Hackathon Project: Deadline Guardian AI",
        description: "Build and polish a custom server-side multi-agent productivity tool with visual bento indicators, and prepare the final presentation video.",
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "High",
        overallRiskScore: 65,
        overallAnalysis: "High risk due to core scheduler logic being unintegrated, placing final submissions under serious jeopardy.",
        subtasks: [
          {
            id: "s-demo-1-1",
            title: "Initialize Backend Multi-Agent Controllers",
            estimatedHours: 4,
            order: 1,
            riskFactor: "Low",
            riskAnalysis: "Standard Express routing logic with stable responses.",
            completed: true,
            progress: 100
          },
          {
            id: "s-demo-1-2",
            title: "Design Visual Agent Mesh Command Center",
            estimatedHours: 6,
            order: 2,
            riskFactor: "Medium",
            riskAnalysis: "Designing beautiful glowing visual status meters requires precise tailwind classes.",
            completed: false,
            progress: 40
          },
          {
            id: "s-demo-1-3",
            title: "Verify Real-time Firebase Authentication & Auth Sync",
            estimatedHours: 5,
            order: 3,
            riskFactor: "High",
            riskAnalysis: "Iframe constraints can block standard popup sign-ins if not mitigated properly.",
            completed: false,
            progress: 10
          }
        ]
      },
      {
        id: "g-demo-2",
        title: "Class Assignment: Machine Learning Report",
        description: "Write a comprehensive academic paper detailing hyperparameter tuning results and optimization models.",
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "High",
        overallRiskScore: 80,
        overallAnalysis: "Critical priority since submission date is in 48 hours and methodology logs are only partially drafted.",
        subtasks: [
          {
            id: "s-demo-2-1",
            title: "Draft abstract and introduction layout",
            estimatedHours: 3,
            order: 1,
            riskFactor: "Low",
            riskAnalysis: "Straightforward intro template outline work.",
            completed: true,
            progress: 100
          },
          {
            id: "s-demo-2-2",
            title: "Complete hyperparameter training validation logs",
            estimatedHours: 8,
            order: 2,
            riskFactor: "High",
            riskAnalysis: "Highly vulnerable to computer training freezes and data formatting errors.",
            completed: false,
            progress: 25
          }
        ]
      },
      {
        id: "g-demo-3",
        title: "Career Path: System Design Interview Prep",
        description: "Review core distributed concepts including load balancers, caching, and database replication patterns.",
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: "Medium",
        overallRiskScore: 40,
        overallAnalysis: "Moderate risk. High theoretical coverage required, but candidate is already well-trained in primary database concepts.",
        subtasks: [
          {
            id: "s-demo-3-1",
            title: "Read database sharding and replication specs",
            estimatedHours: 4,
            order: 1,
            riskFactor: "Low",
            riskAnalysis: "Simple conceptual learning curve.",
            completed: true,
            progress: 100
          },
          {
            id: "s-demo-3-2",
            title: "Execute 2 mock interviews under live timer",
            estimatedHours: 5,
            order: 2,
            riskFactor: "Medium",
            riskAnalysis: "Timeboxing answers properly under mock stress requires high mental focus.",
            completed: false,
            progress: 0
          }
        ]
      }
    ];

    if (currentUser) {
      setSyncStatus("syncing");
      try {
        for (const g of DEMO_GOALS) {
          await setDoc(doc(db, "users", currentUser.uid, "goals", g.id), g);
        }
        setSyncStatus("synced");
      } catch (err) {
        console.error("Demo Database Write Fail:", err);
        setSyncStatus("error");
        setGoals(DEMO_GOALS);
      }
    } else {
      setGoals(DEMO_GOALS);
    }

    setActiveTab("dashboard");
  };

  // 1. Break down goal via AI
  const handleAIBreakdown = async (e: FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    setLoadingBreakdown(true);
    try {
      const response = await fetch("/api/ai/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: newGoalTitle,
          description: newGoalDesc,
          deadline: newGoalDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          persona // Send productivity persona context
        }),
      });

      if (!response.ok) {
        throw new Error("Breakdown request failed");
      }

      const data = await response.json();
      
      // Map return subtasks to our local subtask model
      const formattedSubtasks: Subtask[] = data.subtasks.map((st: any, idx: number) => ({
        id: `st-${Date.now()}-${idx}`,
        title: st.title,
        estimatedHours: st.estimatedHours || 3,
        order: st.order || (idx + 1),
        riskFactor: st.riskFactor || "Medium",
        riskAnalysis: st.riskAnalysis || "Estimated risk level.",
        completed: false,
        progress: 0,
      }));

      const newlyCreatedGoal: Goal = {
        id: `g-${Date.now()}`,
        title: newGoalTitle,
        description: newGoalDesc,
        deadline: newGoalDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        priority: newGoalPriority,
        subtasks: formattedSubtasks,
        overallRiskScore: data.overallRiskScore || 50,
        overallAnalysis: data.overallAnalysis || "Default overall analysis.",
      };

      if (currentUser) {
        setSyncStatus("syncing");
        try {
          await setDoc(doc(db, "users", currentUser.uid, "goals", newlyCreatedGoal.id), newlyCreatedGoal);
          setSyncStatus("synced");
        } catch (dbErr) {
          console.error("Firestore goal write error:", dbErr);
          setSyncStatus("error");
          setGoals((prev) => [newlyCreatedGoal, ...prev]);
        }
      } else {
        setGoals((prev) => [newlyCreatedGoal, ...prev]);
      }
      
      // Clear Form
      setNewGoalTitle("");
      setNewGoalDesc("");
      setNewGoalDeadline("");
      setNewGoalPriority("Medium");
      
      // Switch to goals tab to inspect the breakdown
      setActiveTab("goals");
    } catch (err) {
      console.error("AIBreakdown Error:", err);
      alert("Failed to break down your goal using Gemini AI. Please check your credentials.");
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // 2. Perform AI Risk Assessment for a subtask
  const runAIRiskAssessment = async (goal: Goal, subtask: Subtask) => {
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
          hoursRemaining: hoursRemainingCalc,
        }),
      });

      if (!response.ok) throw new Error("Risk assessment failed");

      const data = await response.json();
      setActiveRiskAnalysis((prev) => ({
        ...prev,
        [subtask.id]: data,
      }));
    } catch (err) {
      console.error("RiskAssessment Error:", err);
      alert("Failed to analyze risk with Gemini. Please verify the API settings.");
    } finally {
      setLoadingRisk(null);
    }
  };

  // 3. Create Personalized 5-Day Schedule
  const generateAISchedule = async () => {
    setLoadingSchedule(true);
    try {
      // Collect all active incomplete subtasks
      const allSubtasks = goals.flatMap((g) => 
        g.subtasks.map((st) => ({
          title: st.title,
          goalTitle: g.title,
          deadline: g.deadline,
          progress: st.progress,
          completed: st.completed,
          riskFactor: st.riskFactor,
          estimatedHours: st.estimatedHours,
        }))
      );

      const response = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: allSubtasks }),
      });

      if (!response.ok) throw new Error("Schedule generation failed");

      const data = await response.json();
      setAiSchedule(data);
    } catch (err) {
      console.error("AISchedule Error:", err);
      alert("Failed to generate personalized schedule.");
    } finally {
      setLoadingSchedule(false);
    }
  };

  // 4. Trigger Rescue Mode
  const triggerRescueMode = async () => {
    if (!rescueSubtask) return;
    setLoadingRescue(true);
    try {
      const response = await fetch("/api/ai/rescue-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: rescueSubtask.title,
          hoursLeft,
          originalEstimate,
          panicLevel,
          deadline: "Immediate Sprint",
        }),
      });

      if (!response.ok) throw new Error("Rescue plan generation failed");

      const data = await response.json();
      setActiveRescuePlan(data);
      setSecondsRemaining(hoursLeft * 3600);
      setIsRescueActive(true);
    } catch (err) {
      console.error("RescuePlan Error:", err);
      alert("Failed to active Rescue Plan. Please try again.");
    } finally {
      setLoadingRescue(false);
    }
  };

  // Helper: cleanup completed subtasks
  const cleanupCompletedSubtasks = async (goalId: string) => {
    let updatedGoal: Goal | null = null;
    const nextGoals = goals.map((g) => {
      if (g.id !== goalId) return g;
      const updatedSubtasks = g.subtasks.filter((st) => !st.completed);
      updatedGoal = { ...g, subtasks: updatedSubtasks };
      return updatedGoal;
    });

    setGoals(nextGoals);
    if (selectedGoal && selectedGoal.id === goalId) {
      setSelectedGoal(updatedGoal);
    }

    if (currentUser && updatedGoal) {
      setSyncStatus("syncing");
      try {
        await setDoc(doc(db, "users", currentUser.uid, "goals", goalId), updatedGoal);
        setSyncStatus("synced");
      } catch (err) {
        console.error("Firestore cleanup completed write error:", err);
        setSyncStatus("error");
      }
    }
  };

  // Helper: toggle subtask completed
  const toggleSubtaskCompleted = async (goalId: string, subtaskId: string) => {
    let updatedGoal: Goal | null = null;
    const nextGoals = goals.map((g) => {
      if (g.id !== goalId) return g;
      const updatedSubtasks = g.subtasks.map((st) => {
        if (st.id !== subtaskId) return st;
        const isComp = !st.completed;
        return {
          ...st,
          completed: isComp,
          progress: isComp ? 100 : 0,
        };
      });
      updatedGoal = { ...g, subtasks: updatedSubtasks };
      return updatedGoal;
    });

    // Optimistically update the UI state immediately so checkmarks toggle instantly on first click!
    setGoals(nextGoals);
    if (selectedGoal && selectedGoal.id === goalId) {
      setSelectedGoal(updatedGoal);
    }

    if (currentUser && updatedGoal) {
      setSyncStatus("syncing");
      try {
        await setDoc(doc(db, "users", currentUser.uid, "goals", goalId), updatedGoal);
        setSyncStatus("synced");
      } catch (err) {
        console.error("Firestore subtask toggle write error:", err);
        setSyncStatus("error");
      }
    }
  };

  // Helper: update progress slider
  const updateSubtaskProgress = (goalId: string, subtaskId: string, prog: number) => {
    let updatedGoal: Goal | null = null;
    const nextGoals = goals.map((g) => {
      if (g.id !== goalId) return g;
      const updatedSubtasks = g.subtasks.map((st) => {
        if (st.id !== subtaskId) return st;
        return {
          ...st,
          progress: prog,
          completed: prog === 100,
        };
      });
      updatedGoal = { ...g, subtasks: updatedSubtasks };
      return updatedGoal;
    });

    // Optimistically update local state instantly for buttery-smooth 60 FPS slider action
    setGoals(nextGoals);
    if (selectedGoal && selectedGoal.id === goalId) {
      setSelectedGoal(updatedGoal);
    }

    if (currentUser && updatedGoal) {
      // Clear any pending DB write for this goal to prevent server lock spam
      if (dbWriteDebounces.current[goalId]) {
        clearTimeout(dbWriteDebounces.current[goalId]);
      }
      const finalGoal = updatedGoal;
      dbWriteDebounces.current[goalId] = setTimeout(async () => {
        try {
          setSyncStatus("syncing");
          await setDoc(doc(db, "users", currentUser.uid, "goals", goalId), finalGoal);
          setSyncStatus("synced");
        } catch (err) {
          console.error("Firestore progress slider write error:", err);
          setSyncStatus("error");
        }
      }, 400); // 400ms debounce
    }
  };

  // Helper: add note or blocker to a subtask
  const addSubtaskNote = async (goalId: string, subtaskId: string, noteContent: string, noteType: "progress" | "blocker") => {
    let updatedGoal: Goal | null = null;
    const nextGoals = goals.map((g) => {
      if (g.id !== goalId) return g;
      const updatedSubtasks = g.subtasks.map((st) => {
        if (st.id !== subtaskId) return st;
        const currentNotes = st.notes || [];
        const newNote = {
          id: Math.random().toString(36).substring(2, 11),
          content: noteContent,
          type: noteType,
          createdAt: new Date().toISOString()
        };
        return {
          ...st,
          notes: [newNote, ...currentNotes]
        };
      });
      updatedGoal = { ...g, subtasks: updatedSubtasks };
      return updatedGoal;
    });

    setGoals(nextGoals);
    if (selectedGoal && selectedGoal.id === goalId) {
      setSelectedGoal(updatedGoal);
    }

    if (currentUser && updatedGoal) {
      setSyncStatus("syncing");
      try {
        await setDoc(doc(db, "users", currentUser.uid, "goals", goalId), updatedGoal);
        setSyncStatus("synced");
      } catch (err) {
        console.error("Firestore subtask note write error:", err);
        setSyncStatus("error");
      }
    }
  };

  // Helper: delete note from a subtask
  const deleteSubtaskNote = async (goalId: string, subtaskId: string, noteId: string) => {
    let updatedGoal: Goal | null = null;
    const nextGoals = goals.map((g) => {
      if (g.id !== goalId) return g;
      const updatedSubtasks = g.subtasks.map((st) => {
        if (st.id !== subtaskId) return st;
        const currentNotes = st.notes || [];
        return {
          ...st,
          notes: currentNotes.filter((note) => note.id !== noteId)
        };
      });
      updatedGoal = { ...g, subtasks: updatedSubtasks };
      return updatedGoal;
    });

    setGoals(nextGoals);
    if (selectedGoal && selectedGoal.id === goalId) {
      setSelectedGoal(updatedGoal);
    }

    if (currentUser && updatedGoal) {
      setSyncStatus("syncing");
      try {
        await setDoc(doc(db, "users", currentUser.uid, "goals", goalId), updatedGoal);
        setSyncStatus("synced");
      } catch (err) {
        console.error("Firestore subtask note delete error:", err);
        setSyncStatus("error");
      }
    }
  };

  // Helper: delete goal
  const deleteGoal = async (goalId: string) => {
    // Optimistically remove goal instantly
    setGoals((prev) => prev.filter((g) => g.id !== goalId));

    if (currentUser) {
      setSyncStatus("syncing");
      try {
        await deleteDoc(doc(db, "users", currentUser.uid, "goals", goalId));
        setSyncStatus("synced");
      } catch (err) {
        console.error("Firestore goal delete error:", err);
        setSyncStatus("error");
      }
    }
  };

  // Memoize high level dashboard counters to optimize React rendering and prevent constant re-computation
  const { totalGoals, totalSubtasks, completedSubtasksCount, highRiskSubtasksCount, averageProgress, allSubtasks } = useMemo(() => {
    const total = goals.length;
    const allSub = goals.flatMap((g) => g.subtasks);
    const totalSub = allSub.length;
    const completedCount = allSub.filter((s) => s.completed).length;
    const highRiskCount = allSub.filter((s) => s.riskFactor === "High" && !s.completed).length;
    const averageProg = totalSub > 0 
      ? Math.round(allSub.reduce((acc, curr) => acc + curr.progress, 0) / totalSub) 
      : 0;

    return {
      totalGoals: total,
      totalSubtasks: totalSub,
      completedSubtasksCount: completedCount,
      highRiskSubtasksCount: highRiskCount,
      averageProgress: averageProg,
      allSubtasks: allSub
    };
  }, [goals]);

  // Compute pie chart data for completed vs. pending tasks
  const { pieData, completedPercentage, pendingPercentage } = useMemo(() => {
    const pendingCount = totalSubtasks - completedSubtasksCount;
    const completedPercentage = totalSubtasks > 0 ? Math.round((completedSubtasksCount / totalSubtasks) * 100) : 0;
    const pendingPercentage = totalSubtasks > 0 ? 100 - completedPercentage : 0;

    let data = [];
    if (totalSubtasks === 0) {
      data = [{ name: "No Tasks", value: 1, color: isDarkMode ? "#1f2937" : "#f3f4f6" }];
    } else {
      data = [
        { name: "Completed", value: completedSubtasksCount, color: "#3b82f6" },
        { name: "Pending", value: pendingCount, color: isDarkMode ? "#475569" : "#cbd5e1" }
      ];
    }

    return {
      pieData: data,
      completedPercentage,
      pendingPercentage
    };
  }, [totalSubtasks, completedSubtasksCount, isDarkMode]);

  // Memoize sorted and filtered goals for the dashboard display
  const filteredAndSortedGoals = useMemo(() => {
    // 1. Filter
    let result = [...goals];

    if (dashboardSearchQuery.trim()) {
      const q = dashboardSearchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
      );
    }

    if (dashboardFilterPriority !== "All") {
      result = result.filter((g) => g.priority === dashboardFilterPriority);
    }

    if (dashboardFilterRisk !== "All") {
      result = result.filter((g) => {
        const score = g.overallRiskScore !== undefined ? g.overallRiskScore : 50;
        if (dashboardFilterRisk === "High") return score > 70;
        if (dashboardFilterRisk === "Medium") return score >= 35 && score <= 70;
        if (dashboardFilterRisk === "Low") return score < 35;
        return true;
      });
    }

    // 2. Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (dashboardSortBy === "deadline") {
        const timeA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const timeB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        comparison = timeA - timeB;
      } else if (dashboardSortBy === "priority") {
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        const weightA = priorityWeight[a.priority] || 0;
        const weightB = priorityWeight[b.priority] || 0;
        comparison = weightB - weightA; // High priority first
      } else if (dashboardSortBy === "risk") {
        const riskA = a.overallRiskScore !== undefined ? a.overallRiskScore : 50;
        const riskB = b.overallRiskScore !== undefined ? b.overallRiskScore : 50;
        comparison = riskB - riskA; // High risk score first
      }
      return dashboardSortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    goals,
    dashboardSortBy,
    dashboardSortOrder,
    dashboardFilterPriority,
    dashboardFilterRisk,
    dashboardSearchQuery
  ]);

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col text-gray-800 transition-all duration-500 ${isRescueActive ? "border-t-[6px] border-amber-500" : ""}`}>
      
      {/* Top Banner indicating key config status & controllers */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 text-xs text-gray-500 shadow-sm z-30">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${apiStatus.geminiConfigured ? "bg-green-500 animate-pulse" : "bg-blue-500"}`} />
              <span className="font-mono text-gray-700 font-medium">
                {apiStatus.geminiConfigured 
                  ? "Gemini-3.5-Flash Active (Server Connected)" 
                  : "Gemini Sandbox Active (Demo Ready)"}
              </span>
            </div>
            
            <div className="h-4 w-[1px] bg-gray-200 hidden md:block" />

            {/* Persona select dropdown controller */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Productivity Persona:</span>
              <select 
                value={persona} 
                onChange={(e) => setPersona(e.target.value as any)}
                className="bg-white border border-gray-250 text-[11px] font-semibold text-blue-600 px-2.5 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:bg-gray-50 transition"
              >
                <option value="Entrepreneur">Entrepreneur (High Risk Tolerance)</option>
                <option value="Freelancer">Freelancer (Client Priority)</option>
                <option value="Student">Student (Academic Timeboxes)</option>
                <option value="Job Seeker">Job Seeker (Interview Focus)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            {/* One-Click judging Scenario Button */}
            <button
              onClick={loadDemoScenario}
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-mono text-[10px] font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Prepopulate Scenario data for instant judges presentation"
            >
              <Activity className="w-3.5 h-3.5" /> Load Judging Demo
            </button>

            {/* User Auth cloud sync widget */}
            <UserAuth 
              onUserChanged={setCurrentUser} 
              syncStatus={syncStatus} 
              onRetry={() => setRetryCount(prev => prev + 1)} 
            />
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="bg-white sticky top-0 z-40 border-b border-gray-200 px-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between py-4 gap-4">
          
          {/* Logo */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${isRescueActive ? "bg-amber-50 border-amber-300 text-amber-600" : "bg-blue-50 border-blue-200 text-blue-600"}`}>
                {isRescueActive ? <Flame className="w-5 h-5 animate-bounce" /> : <Shield className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg text-gray-900 leading-none tracking-tight">
                    Deadline Guardian
                  </h1>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    AI Companion
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">Avoid missed deadlines • Complete multi-agent planner</p>
              </div>
            </div>

            {/* Quick Dark Mode Toggle for Mobile & Tablet */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="xl:hidden p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition cursor-pointer text-gray-500 hover:text-gray-900 flex items-center justify-center shadow-xs"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-600" />}
            </button>
          </div>

          {/* Nav Tabs (Desktop) + Toggle Switch */}
          <div className="hidden xl:flex items-center gap-3">
            <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                id="nav-tab-dashboard"
                onClick={() => { setActiveTab("dashboard"); setSelectedGoal(null); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === "dashboard" ? "bg-white text-blue-600 border border-gray-200 shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </button>
              <button
                id="nav-tab-goals"
                onClick={() => { setActiveTab("goals"); setInitialSubTab("breakdown"); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === "goals" ? "bg-white text-blue-600 border border-gray-200 shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
              >
                <Compass className="w-3.5 h-3.5" />
                Goals
              </button>
              <button
                id="nav-tab-assistant"
                onClick={() => { setActiveTab("assistant"); setSelectedGoal(null); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === "assistant" ? "bg-white text-blue-600 border border-gray-200 shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Assistant
              </button>
              <button
                id="nav-tab-settings"
                onClick={() => { setActiveTab("settings"); setSelectedGoal(null); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === "settings" ? "bg-white text-blue-600 border border-gray-200 shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </button>
            </nav>

            {/* Quick Dark Mode Toggle Switch for Desktop */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition cursor-pointer text-gray-500 hover:text-gray-900 flex items-center justify-center shadow-xs"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-blue-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        
        {/* Mobile / Tablet Navbar */}
        <div className="xl:hidden flex flex-wrap justify-center gap-2 bg-gray-100 p-2 rounded-xl border border-gray-200 mb-6">
          <button 
            onClick={() => { setActiveTab("dashboard"); setSelectedGoal(null); }} 
            className={`px-4 py-2 rounded-lg text-[11px] font-bold cursor-pointer ${activeTab === "dashboard" ? "bg-white text-blue-600 border border-gray-200 shadow-sm" : "text-gray-500"}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => { setActiveTab("goals"); setInitialSubTab("breakdown"); }} 
            className={`px-4 py-2 rounded-lg text-[11px] font-bold cursor-pointer ${activeTab === "goals" ? "bg-white text-blue-600 border border-gray-200 shadow-sm" : "text-gray-500"}`}
          >
            Goals
          </button>
          <button 
            onClick={() => { setActiveTab("assistant"); setSelectedGoal(null); }} 
            className={`px-4 py-2 rounded-lg text-[11px] font-bold cursor-pointer ${activeTab === "assistant" ? "bg-white text-blue-600 border border-gray-200 shadow-sm" : "text-gray-500"}`}
          >
            AI Assistant
          </button>
          <button 
            onClick={() => { setActiveTab("settings"); setSelectedGoal(null); }} 
            className={`px-4 py-2 rounded-lg text-[11px] font-bold cursor-pointer ${activeTab === "settings" ? "bg-white text-blue-600 border border-gray-200 shadow-sm" : "text-gray-500"}`}
          >
            Settings
          </button>
        </div>

        {/* Dynamic Screen Mounting */}
        
        {/* VIEW 1: DASHBOARD / GUARDIAN PANEL */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Rescue Active Alert Card if Active */}
            {isRescueActive && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-pulse text-amber-900">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-800 text-base">RESCUE MODE ACTIVE</h3>
                    <p className="text-xs text-amber-700 max-w-md mt-0.5">
                      Executing a fast-track sprint plan for &quot;{rescueSubtask?.title}&quot;. Phone silenced, notifications paused. Beat the deadline!
                    </p>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-[10px] text-amber-500 font-mono font-bold tracking-wider">REMAINING COUNTDOWN</div>
                  <div className="text-2xl font-mono font-bold text-amber-600 tracking-wider">
                    {formatCountdown(secondsRemaining)}
                  </div>
                </div>
              </div>
            )}

            {/* Declutter & Customization Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-250 rounded-2xl p-4.5 shadow-xs transition dark:bg-slate-900 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" /> Declutter & Customization Panel
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Customize your workspace by hiding sections or simplifying goal cards for high focus.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWatchdog(!showWatchdog)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    showWatchdog 
                      ? "bg-blue-50/70 text-blue-700 border-blue-200 hover:bg-blue-100/60 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300" 
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700"
                  }`}
                >
                  {showWatchdog ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showWatchdog ? "Hide Watchdog" : "Show Watchdog"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAchievements(!showAchievements)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    showAchievements 
                      ? "bg-amber-50/70 text-amber-700 border-amber-200 hover:bg-amber-100/60 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300" 
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700"
                  }`}
                >
                  {showAchievements ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showAchievements ? "Hide Badges" : "Show Badges"}
                </button>
                <button
                  type="button"
                  onClick={() => setCompactGoalCards(!compactGoalCards)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    compactGoalCards 
                      ? "bg-emerald-50/70 text-emerald-700 border-emerald-200 hover:bg-emerald-100/60 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300" 
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {compactGoalCards ? "Detailed Cards" : "Compact Mode"}
                </button>
              </div>
            </div>

            {/* Prominent Watchdog Recommendation Alert */}
            {showWatchdog && (
              <WatchdogPanel 
                goals={goals}
                persona={persona}
                watchdogState={watchdogResult}
                loading={loadingWatchdog}
                onRefresh={recalculateWatchdog}
              />
            )}

            {/* Metric Bento Grid with Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Metric stats columns (col-span-3) */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Stat 1 */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 relative overflow-hidden shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-gray-400 font-mono text-[10px] uppercase font-bold tracking-wider">Active Goals</span>
                    <div className="text-3xl font-bold text-gray-900 mt-1">{totalGoals}</div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-3 font-medium">Core milestones under watch</p>
                  <div className="absolute top-4 right-4 text-blue-600/10"><Compass className="w-8 h-8" /></div>
                </div>

                {/* Stat 2 */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 relative overflow-hidden shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-gray-400 font-mono text-[10px] uppercase font-bold tracking-wider">Overall Completion</span>
                    <div className="text-3xl font-bold text-gray-900 mt-1">{averageProgress}%</div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all duration-350" style={{ width: `${averageProgress}%` }} />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 text-blue-600/10"><Zap className="w-8 h-8" /></div>
                </div>

                {/* Stat 3 */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 relative overflow-hidden shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-gray-400 font-mono text-[10px] uppercase font-bold tracking-wider">Vulnerable High Risks</span>
                    <div className={`text-3xl font-bold mt-1 ${highRiskSubtasksCount > 0 ? "text-red-600" : "text-gray-900"}`}>
                      {highRiskSubtasksCount}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-3 font-medium">Vulnerabilities needing attention</p>
                  <div className="absolute top-4 right-4 text-red-600/10"><AlertTriangle className="w-8 h-8" /></div>
                </div>
              </div>

              {/* Progress Summary Pie Chart (col-span-1) */}
              <div className="lg:col-span-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden min-h-[220px] lg:min-h-0">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-mono text-[10px] uppercase font-bold tracking-wider">Task Progress Summary</span>
                  <Activity className="w-4 h-4 text-blue-500/30" />
                </div>
                
                <div className="flex-1 w-full h-28 relative flex items-center justify-center mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={45}
                        paddingAngle={totalSubtasks > 0 ? 3 : 0}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (totalSubtasks === 0) return [0, "No Tasks"];
                          return [value, name];
                        }}
                        contentStyle={{ 
                          background: isDarkMode ? "#1e293b" : "#fff", 
                          border: `1px solid ${isDarkMode ? "#334155" : "#e5e7eb"}`, 
                          color: isDarkMode ? "#f8fafc" : "#111827",
                          borderRadius: "10px", 
                          fontSize: "10px", 
                          padding: "4px 8px", 
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)" 
                        }}
                        itemStyle={{ color: isDarkMode ? "#f1f5f9" : "#1f2937" }}
                        labelStyle={{ color: isDarkMode ? "#94a3b8" : "#4b5563" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center percentage indicator */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-base font-bold font-mono text-gray-950">{completedPercentage}%</span>
                    <span className="text-[8px] text-gray-400 font-mono uppercase tracking-wider">Done</span>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  {totalSubtasks === 0 ? (
                    <div className="text-[10px] text-gray-400 italic text-center">No tasks found. Add a goal to track.</div>
                  ) : (
                    <div className="flex justify-between items-center text-[10px] text-gray-500 px-1 font-mono font-bold">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>Done: {completedSubtasksCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span>Pending: {totalSubtasks - completedSubtasksCount}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Achievements & Badges Panel */}
            {showAchievements && (
              <AchievementsPanel goals={goals} isDarkMode={isDarkMode} />
            )}

            {/* Active Goals Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Active Goals Under Watch</h3>
                  <p className="text-xs text-gray-500">Milestones and subtask vulnerabilities under current surveillance</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJSON}
                    className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Export backup of active goals to JSON file"
                  >
                    <Download className="w-4 h-4 text-blue-600" /> Backup JSON
                  </button>
                  <button
                    onClick={() => setActiveTab("goals")}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Goal
                  </button>
                </div>
              </div>

              {goals.length === 0 ? (
                <div className="border border-dashed border-gray-300 bg-white rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xs">
                  <Compass className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-base font-semibold text-gray-800">No active goals found</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Create a new goal to let Deadline Guardian AI break it into smart subtasks and calculate real-time risks.
                  </p>
                  <button
                    onClick={() => setActiveTab("goals")}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl mt-4 transition cursor-pointer"
                  >
                    Set New Goal
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sorting & Filtering Menu Bar */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shadow-xs">
                    {/* Search Field */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search goals or descriptions..."
                        value={dashboardSearchQuery}
                        onChange={(e) => setDashboardSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      />
                    </div>

                    {/* Filter and Sort Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Priority Filter */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase text-gray-450">Priority:</span>
                        <select
                          value={dashboardFilterPriority}
                          onChange={(e) => setDashboardFilterPriority(e.target.value as any)}
                          className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                          <option value="All">All Priorities</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>

                      {/* Risk Filter */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase text-gray-450">Risk:</span>
                        <select
                          value={dashboardFilterRisk}
                          onChange={(e) => setDashboardFilterRisk(e.target.value as any)}
                          className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                          <option value="All">All Risks</option>
                          <option value="High">High Risk (&gt;70%)</option>
                          <option value="Medium">Medium Risk (35-70%)</option>
                          <option value="Low">Low Risk (&lt;35%)</option>
                        </select>
                      </div>

                      <div className="h-4 w-px bg-gray-205 mx-0.5 hidden lg:block" />

                      {/* Sort Selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase text-gray-455 flex items-center gap-1">
                          <SlidersHorizontal className="w-3 h-3 text-gray-400" /> Sort:
                        </span>
                        <select
                          value={dashboardSortBy}
                          onChange={(e) => setDashboardSortBy(e.target.value as any)}
                          className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                          <option value="deadline">Deadline Date</option>
                          <option value="priority">Priority Level</option>
                          <option value="risk">Risk Score</option>
                        </select>
                      </div>

                      {/* Sort order toggle button */}
                      <button
                        type="button"
                        onClick={() => setDashboardSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                        title={dashboardSortOrder === "asc" ? "Sort Ascending" : "Sort Descending"}
                        className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-1.5 text-gray-600 transition cursor-pointer flex items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                      >
                        <ArrowUpDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dashboardSortOrder === "desc" ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Filtered & Sorted Goals List */}
                  {filteredAndSortedGoals.length === 0 ? (
                    <div className="border border-dashed border-gray-300 bg-white rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xs">
                      <Filter className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <h4 className="text-base font-semibold text-gray-800">No matching goals found</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        No goals match your search queries or filtering criteria. Try resetting options.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setDashboardFilterPriority("All");
                          setDashboardFilterRisk("All");
                          setDashboardSearchQuery("");
                          setDashboardSortBy("deadline");
                          setDashboardSortOrder("asc");
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-4 py-2 rounded-xl mt-4 transition cursor-pointer"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {filteredAndSortedGoals.map((g) => {
                        const compl = g.subtasks.filter((s) => s.completed).length;
                        const tot = g.subtasks.length;
                        const pct = tot > 0 ? Math.round((compl / tot) * 100) : 0;
                        return (
                          <div key={g.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 shadow-sm transition dark:bg-slate-900 dark:border-slate-800">
                            
                            {/* Header Goal Block */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 pb-5 dark:border-slate-800">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded border ${
                                    g.priority === "High" ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400" :
                                    g.priority === "Medium" ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-400" :
                                    "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/40 dark:border-green-900 dark:text-green-400"
                                  }`}>
                                    {g.priority} Priority
                                  </span>
                                  <span className="text-xs font-mono text-gray-500 flex items-center gap-1 dark:text-gray-400">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" /> Deadline: {g.deadline}
                                  </span>
                                  {getDeadlineBadge(g.deadline)}
                                </div>
                                <h4 className="text-lg font-bold text-gray-950 mt-2 dark:text-gray-50">{g.title}</h4>
                                <p className="text-xs text-gray-500 mt-1 max-w-3xl leading-relaxed dark:text-gray-400">{g.description}</p>
                              </div>
                               
                              <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 p-3 rounded-xl min-w-[180px] dark:bg-slate-800/40 dark:border-slate-800">
                                {/* Simple circular metric */}
                                <div className="relative w-12 h-12 flex items-center justify-center bg-white border border-gray-200 rounded-full font-mono text-xs font-bold text-blue-600 shadow-xs dark:bg-slate-900 dark:border-slate-800 dark:text-blue-400">
                                  {g.overallRiskScore || 50}%
                                </div>
                                <div>
                                  <div className="text-[10px] font-mono text-gray-400 uppercase font-bold dark:text-gray-500">AI Risk Score</div>
                                  <div className={`text-xs font-bold mt-0.5 ${
                                    (g.overallRiskScore || 50) > 70 ? "text-red-600 dark:text-red-400" :
                                    (g.overallRiskScore || 50) > 35 ? "text-amber-600 dark:text-amber-400" :
                                    "text-green-600 dark:text-green-400"
                                  }`}>
                                    {(g.overallRiskScore || 50) > 70 ? "Severe Danger" :
                                     (g.overallRiskScore || 50) > 35 ? "Moderate Warning" :
                                      "Secure State"}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* COMPACT MODE vs DETAILED MODE */}
                            {compactGoalCards ? (
                              /* Clean, minimal progress summary for Compact Mode */
                              <div className="mt-4 bg-gray-50/40 border border-gray-150 rounded-xl p-4.5 space-y-3 dark:bg-slate-800/20 dark:border-slate-800">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                                    Progress Metrics
                                  </span>
                                  <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                                    {compl} of {tot} subtasks completed ({pct}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden dark:bg-slate-800">
                                  <div 
                                    className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              /* Detailed full view contents */
                              <>
                                {/* Feasibility text assessment */}
                                {g.overallAnalysis && (
                                  <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5 text-xs text-gray-600 flex items-start gap-2.5 mt-4 dark:bg-slate-800/30 dark:border-slate-800 dark:text-gray-300">
                                    <Cpu className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <p className="leading-normal"><strong className="text-blue-700 font-bold dark:text-blue-400">AI Feasibility:</strong> {g.overallAnalysis}</p>
                                  </div>
                                )}

                                {/* List of Subtasks */}
                                <div className="mt-5 space-y-3">
                                  <div className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider dark:text-gray-550">Subtask Surveillance ({pct}% Finished)</div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {g.subtasks.map((st) => (
                                      <div key={st.id} className="bg-gray-50/40 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-xs dark:bg-slate-800/20 dark:border-slate-800">
                                        <div>
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                              <button 
                                                onClick={() => toggleSubtaskCompleted(g.id, st.id)}
                                                className="text-gray-400 hover:text-blue-600 transition cursor-pointer dark:text-slate-500 dark:hover:text-blue-400"
                                              >
                                                {st.completed ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                                              </button>
                                              <span className={`text-xs font-bold leading-tight ${st.completed ? "line-through text-gray-400 font-normal dark:text-slate-500" : "text-gray-800 dark:text-gray-200"}`}>
                                                {st.title}
                                              </span>
                                            </div>
                                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                              st.riskFactor === "High" ? "bg-red-50 text-red-700 border border-red-100 dark:bg-red-950/40 dark:border-red-900/40 dark:text-red-400" :
                                              st.riskFactor === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-400" :
                                              "bg-green-50 text-green-700 border border-green-100 dark:bg-green-950/40 dark:border-green-900/40 dark:text-green-400"
                                            }`}>
                                              {st.riskFactor} Risk
                                            </span>
                                          </div>

                                          <p className="text-[11px] text-gray-500 mt-2 leading-relaxed italic pl-6 font-medium dark:text-gray-400">
                                            {st.riskAnalysis}
                                          </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-4 dark:border-slate-800">
                                          <div className="flex items-center gap-1 font-mono text-[10px] text-gray-400">
                                            <Clock className="w-3 h-3 text-gray-400" /> Est: {st.estimatedHours}h
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => {
                                                setSelectedGoal(g);
                                                setInitialSubTab("rescue");
                                                setActiveTab("goals");
                                              }}
                                              className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded hover:bg-amber-100 transition flex items-center gap-1 cursor-pointer shadow-xs dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400"
                                            >
                                              <Flame className="w-3 h-3 text-amber-600" /> Rescue Mode
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Actions Block */}
                            <div className="mt-5 border-t border-gray-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:border-slate-800">
                              <div className="flex flex-wrap items-center gap-4">
                                <button
                                  onClick={() => deleteGoal(g.id)}
                                  className="text-xs text-red-600 hover:text-red-700 hover:underline transition flex items-center gap-1 cursor-pointer dark:text-red-400 dark:hover:text-red-350"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete Goal
                                </button>
                                {g.subtasks.some((st) => st.completed) && (
                                  <button
                                    onClick={() => setCleanupGoalId(g.id)}
                                    className="text-xs text-amber-600 hover:text-amber-700 hover:underline transition flex items-center gap-1 cursor-pointer dark:text-amber-400 dark:hover:text-amber-300"
                                  >
                                    <CheckSquare className="w-3.5 h-3.5 text-amber-550" /> Cleanup Completed
                                  </button>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedGoal(g);
                                  setInitialSubTab("breakdown");
                                  setActiveTab("goals");
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold transition flex items-center gap-1 cursor-pointer dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                Open AI Toolkit →
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}        {/* VIEW 2: GOALS & DETAIL PANEL */}
        {activeTab === "goals" && (
          <div className="space-y-8 animate-fade-in">
            {selectedGoal ? (
              <GoalDetails 
                goal={selectedGoal}
                persona={persona}
                onClose={() => setSelectedGoal(null)}
                onToggleSubtask={toggleSubtaskCompleted}
                onUpdateProgress={updateSubtaskProgress}
                onAddSubtaskNote={addSubtaskNote}
                onDeleteSubtaskNote={deleteSubtaskNote}
                initialSubTab={initialSubTab}
              />
            ) : (
              <div className="space-y-8">
                {/* Goal form card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Set New Milestone Goal</h3>
                      <p className="text-xs text-gray-500">Tell us what you are trying to complete, and our AI will calculate the steps.</p>
                    </div>
                  </div>

                  <form onSubmit={handleAIBreakdown} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Goal Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 font-mono uppercase">Goal Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Build Mobile Application Prototype" 
                          value={newGoalTitle}
                          onChange={(e) => setNewGoalTitle(e.target.value)}
                          required
                          className="w-full bg-white border border-gray-250 rounded-xl px-4 py-3 text-sm text-gray-850 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                        />
                      </div>

                      {/* Deadline Date */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 font-mono uppercase">Deadline Date</label>
                        <input 
                          type="date" 
                          value={newGoalDeadline}
                          onChange={(e) => setNewGoalDeadline(e.target.value)}
                          className="w-full bg-white border border-gray-250 rounded-xl px-4 py-3 text-sm text-gray-850 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-400 font-mono uppercase">Description (Context helps AI estimate risk)</label>
                      <textarea 
                        rows={3}
                        placeholder="Provide additional details or context (e.g. Solo hacker, using React & Firebase, 3 days left before submission)..." 
                        value={newGoalDesc}
                        onChange={(e) => setNewGoalDesc(e.target.value)}
                        className="w-full bg-white border border-gray-250 rounded-xl px-4 py-3 text-sm text-gray-850 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-400"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400 font-bold font-mono uppercase">Priority:</span>
                        <div className="flex items-center gap-1.5">
                          {["Low", "Medium", "High"].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setNewGoalPriority(p as any)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                                newGoalPriority === p 
                                  ? "bg-blue-50 text-blue-700 border-blue-300" 
                                  : "bg-white text-gray-500 border-gray-200 hover:text-gray-750 hover:bg-gray-50"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loadingBreakdown || !newGoalTitle.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center cursor-pointer"
                      >
                        {loadingBreakdown ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Calculating Subtasks via Gemini...
                          </>
                        ) : (
                          <>
                            <Cpu className="w-4 h-4" /> Trigger Gemini AI Breakdown
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Manage Goals Card Grid */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900">Surveillance Goals Directory</h3>
                  
                  {goals.length === 0 ? (
                    <div className="text-center text-gray-400 bg-white border border-gray-200 p-12 rounded-2xl shadow-xs">
                      Set a milestone target above to initialize tactical analysis.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {goals.map((g) => {
                        const compl = g.subtasks.filter((s) => s.completed).length;
                        const tot = g.subtasks.length;
                        const pct = tot > 0 ? Math.round((compl / tot) * 100) : 0;
                        return (
                          <div 
                            key={g.id} 
                            onClick={() => setSelectedGoal(g)}
                            className="bg-white border border-gray-200 rounded-3xl p-6 hover:border-blue-400 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group relative"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                                  g.priority === "High" ? "bg-red-50 border-red-200 text-red-750" :
                                  g.priority === "Medium" ? "bg-amber-50 border-amber-200 text-amber-750" :
                                  "bg-green-50 border-green-200 text-green-750"
                                }`}>
                                  {g.priority} Priority
                                </span>
                                <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {g.deadline}
                                </span>
                              </div>

                              <h4 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition mt-3 font-sans">
                                {g.title}
                              </h4>
                              <p className="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
                                {g.description}
                              </p>
                            </div>

                            <div className="space-y-3 pt-2">
                              {/* Simple mini progress bar */}
                              <div>
                                <div className="flex justify-between text-[9px] font-mono font-bold text-gray-400 mb-1">
                                  <span>SURVEILLANCE FOCUS</span>
                                  <span>{pct}% COMPLETE</span>
                                </div>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-blue-600 h-full transition-all duration-350" style={{ width: `${pct}%` }} />
                                </div>
                              </div>

                              <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-blue-600 font-bold group-hover:underline">
                                <span>Open Full AI Toolkit</span>
                                <span className="text-gray-400 text-[9px] font-mono group-hover:no-underline">ID: {g.id}</span>
                              </div>
                            </div>

                            {/* Delete overlay handler button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteGoal(g.id);
                              }}
                              className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-600 rounded-full hover:bg-gray-50 transition cursor-pointer"
                              title="Delete Goal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: AI COMPANION ASSISTANT */}
        {activeTab === "assistant" && (
          <AIAssistant 
            goals={goals} 
            persona={persona} 
            activeRiskAnalysis={activeRiskAnalysis}
            activeRescuePlan={activeRescuePlan}
            watchdogResult={watchdogResult}
          />
        )}

        {/* VIEW 4: SETTINGS PANEL */}
        {activeTab === "settings" && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  SYSTEM PREFERENCES
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">Configurational Settings</h3>
                <p className="text-xs text-gray-500 max-w-xl leading-relaxed">
                  Tailor cognitive response personas, connect authentication protocols, and audit live Gemini API connections in a highly visual diagnostic workspace.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Appearance & Persona Preferences */}
              <div className="space-y-6">
                {/* Visual Appearance Theme selection card */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
                      {isDarkMode ? <Moon className="w-5 h-5 text-blue-600" /> : <Sun className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">Appearance Theme</h4>
                      <p className="text-[11px] text-gray-400">Reduce eye strain during late-night tactical monitoring sessions.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsDarkMode(false)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col items-center gap-2.5 ${
                        !isDarkMode 
                          ? "bg-blue-50/70 border-blue-400 text-blue-900 shadow-sm font-bold" 
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                      }`}
                    >
                      <Sun className={`w-6 h-6 ${!isDarkMode ? "text-amber-500" : "text-gray-400"}`} />
                      <span className="text-xs">Light Mode</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsDarkMode(true)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col items-center gap-2.5 ${
                        isDarkMode 
                          ? "bg-blue-50/70 border-blue-400 text-blue-900 shadow-sm font-bold" 
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
                      }`}
                    >
                      <Moon className={`w-6 h-6 ${isDarkMode ? "text-indigo-400" : "text-gray-400"}`} />
                      <span className="text-xs">Dark Mode</span>
                    </button>
                  </div>
                </div>

                {/* Persona Preferences */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">Productivity Persona Profile</h4>
                    <p className="text-[11px] text-gray-400">Instructs the AI on tone and priority de-scoping aggressiveness.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { id: "Entrepreneur", desc: "Extreme speed, high risk tolerances, aggressive MVP cuts." },
                    { id: "Freelancer", desc: "Rigid timeline limits, client presentation buffers, fixed tasks." },
                    { id: "Student", desc: "Procrastination inhibitors, clear break guides, focus triggers." },
                    { id: "Job Seeker", desc: "Interview scheduling, rigorous preparation tasks, interview prep." }
                  ] as const).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPersona(p.id)}
                      className={`text-left p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between h-28 ${
                        persona === p.id 
                          ? "bg-blue-50/70 border-blue-400 text-blue-900 shadow-sm" 
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xs font-bold block">{p.id}</span>
                      <span className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed mt-1">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

              {/* Right Column: Firebase Authentication & API Status */}
              <div className="space-y-6">
                
                {/* Firebase Authentication card */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
                      <LogIn className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">Cloud Sync & Persistence</h4>
                      <p className="text-[11px] text-gray-400">Sync goals and subtasks state to secure cloud database endpoints.</p>
                    </div>
                  </div>
                  
                  {/* Mount standard UserAuth */}
                  <UserAuth 
                    onUserChanged={setCurrentUser} 
                    syncStatus={syncStatus} 
                    onRetry={() => setRetryCount(prev => prev + 1)} 
                  />
                </div>

                {/* Gemini API Diagnostic status */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">Gemini Model Diagnostics</h4>
                      <p className="text-[11px] text-gray-400">Verifies environment configuration and connection status.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-gray-900">Google Gemini API Connection</span>
                      <p className="text-[10px] text-gray-400 font-mono">MODEL: gemini-3.5-flash</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${apiStatus.geminiConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
                      <span className="text-xs font-mono font-bold text-gray-800">
                        {apiStatus.geminiConfigured ? "CONNECTED" : "DEMO / OFFLINE"}
                      </span>
                    </div>
                  </div>

                  {!apiStatus.geminiConfigured && (
                    <p className="text-[10px] text-amber-600 leading-normal bg-amber-50 border border-amber-200 p-3 rounded-xl font-medium">
                      ⚠️ Running in Offline Demo Mode. Pre-populated mock structures are automatically active. To activate live generation, please define your GEMINI_API_KEY environment variable.
                    </p>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="border-t border-gray-200 bg-white py-6 px-4 mt-12 text-xs text-gray-500 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] tracking-wider">
          <span>© 2026 DEADLINE GUARDIAN AI • PROACTIVE MILESTONE SURVEILLANCE</span>
          <span className="text-blue-600 font-bold uppercase tracking-widest">GOOGLE GEMINI POWERED</span>
        </div>
      </footer>

      {/* Confirmation Dialog for Cleaning Up Completed Subtasks */}
      {cleanupGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          {(() => {
            const goalToCleanup = goals.find((g) => g.id === cleanupGoalId);
            if (!goalToCleanup) return null;
            const completedCount = goalToCleanup.subtasks.filter((st) => st.completed).length;
            return (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 transform transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900 text-amber-600 dark:text-amber-400 shrink-0">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      Cleanup Completed Subtasks?
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Are you sure you want to delete all <strong className="text-gray-900 dark:text-gray-100 font-bold">{completedCount}</strong> completed subtask(s) for <span className="italic">"{goalToCleanup.title}"</span>? This action is permanent and cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCleanupGoalId(null)}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await cleanupCompletedSubtasks(cleanupGoalId);
                      setCleanupGoalId(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 border border-red-500/10 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Yes, Cleanup
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
