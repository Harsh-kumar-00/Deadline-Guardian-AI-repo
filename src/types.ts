export interface SubtaskNote {
  id: string;
  content: string;
  type: "progress" | "blocker";
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  estimatedHours: number;
  order: number;
  riskFactor: "Low" | "Medium" | "High";
  riskAnalysis: string;
  completed: boolean;
  progress: number; // 0 to 100
  notes?: SubtaskNote[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: "Low" | "Medium" | "High";
  subtasks: Subtask[];
  overallRiskScore?: number;
  overallAnalysis?: string;
  createdAt?: string;
}

export interface RiskAnalysis {
  riskScore: number;
  riskTier: "Low" | "Medium" | "High";
  reasons: string[];
  mitigationActions: string[];
  assessmentText: string;
}

export interface ScheduleItem {
  timeSlot: string;
  taskTitle: string;
  duration: string;
  objective: string;
}

export interface ScheduleDay {
  dayName: string;
  focus: string;
  items: ScheduleItem[];
}

export interface ScheduleResponse {
  days: ScheduleDay[];
  productivityTip: string;
  simulated?: boolean;
}

export interface RescueHourly {
  hour: string;
  focus: string;
  tips: string;
}

export interface RescuePlan {
  immediateActions: string[];
  hourlyGuide: RescueHourly[];
  descopeSuggestions: string[];
  mindsetHack: string;
  simulated?: boolean;
}

// Watchdog Agent Interfaces
export interface WatchdogResult {
  priorityAction: string;
  reason: string;
  estimatedHours: number;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  simulated?: boolean;
}

// What-If Simulation Interfaces
export interface WhatIfResult {
  riskImpact: number; // e.g. +15 or -20
  deadlineImpact: string; // e.g. "Deadline at risk" or "Saves 4 hours"
  tasksAffected: string[];
  recoveryStrategy: string;
  simulated?: boolean;
}

// Multi-Agent Configuration
export interface AgentState {
  id: string;
  name: string;
  role: string;
  status: "idle" | "thinking" | "active" | "standby";
  lastAction: string;
  currentRecommendation: string;
  systemPrompt: string;
}

export type ProductivityPersona = "Student" | "Job Seeker" | "Entrepreneur" | "Freelancer";
