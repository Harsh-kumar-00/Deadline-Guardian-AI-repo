import React, { useMemo } from "react";
import { 
  Award, Trophy, Target, Shield, Clock, Lock, Check, Sparkles 
} from "lucide-react";
import { Goal } from "../types";
import { motion } from "motion/react";

interface AchievementsPanelProps {
  goals: Goal[];
  isDarkMode: boolean;
}

export default function AchievementsPanel({ goals, isDarkMode }: AchievementsPanelProps) {
  const completedGoals = useMemo(() => {
    return goals.filter(g => g.subtasks.length > 0 && g.subtasks.every(s => s.completed));
  }, [goals]);

  const totalSubtasksCount = useMemo(() => {
    return goals.flatMap(g => g.subtasks).length;
  }, [goals]);

  const completedSubtasksCount = useMemo(() => {
    return goals.flatMap(g => g.subtasks).filter(s => s.completed).length;
  }, [goals]);

  const badges = useMemo(() => {
    const todayString = new Date().toISOString().split("T")[0];

    const list = [
      {
        id: "initiator",
        name: "First Blood",
        description: "Complete your first subtask under surveillance",
        icon: Target,
        unlocked: completedSubtasksCount >= 1,
        progressText: completedSubtasksCount >= 1 ? "1/1 Complete" : "0/1 Subtask",
        colorClass: "from-blue-500/10 to-indigo-500/10 border-blue-200/50 text-blue-600 dark:text-blue-400",
        activeColorClass: "bg-blue-500 text-white shadow-blue-500/20"
      },
      {
        id: "early_finisher",
        name: "Early Finisher",
        description: "Complete an entire goal on or before its deadline",
        icon: Clock,
        unlocked: completedGoals.some(g => g.deadline >= todayString),
        progressText: completedGoals.some(g => g.deadline >= todayString) ? "Completed" : "0/1 Completed Goal",
        colorClass: "from-emerald-500/10 to-teal-500/10 border-emerald-200/50 text-emerald-600 dark:text-emerald-400",
        activeColorClass: "bg-emerald-500 text-white shadow-emerald-500/20"
      },
      {
        id: "complexity_crusher",
        name: "Complexity Crusher",
        description: "Complete a High priority goal with 3+ subtasks",
        icon: Trophy,
        unlocked: completedGoals.some(g => g.priority === "High" && g.subtasks.length >= 3),
        progressText: completedGoals.some(g => g.priority === "High" && g.subtasks.length >= 3) ? "Crushed" : "0/1 High Priority",
        colorClass: "from-amber-500/10 to-orange-500/10 border-amber-200/50 text-amber-600 dark:text-amber-400",
        activeColorClass: "bg-amber-500 text-white shadow-amber-500/20"
      },
      {
        id: "vulnerability_shield",
        name: "Vulnerability Shield",
        description: "Complete a goal containing at least one High Risk subtask",
        icon: Shield,
        unlocked: completedGoals.some(g => g.subtasks.some(st => st.riskFactor === "High")),
        progressText: completedGoals.some(g => g.subtasks.some(st => st.riskFactor === "High")) ? "Shielded" : "0/1 High Risk Goal",
        colorClass: "from-rose-500/10 to-red-500/10 border-rose-200/50 text-rose-600 dark:text-rose-400",
        activeColorClass: "bg-rose-500 text-white shadow-rose-500/20"
      },
      {
        id: "consistency_champion",
        name: "Consistency Champ",
        description: "Complete 2 or more active goals fully",
        icon: Award,
        unlocked: completedGoals.length >= 2,
        progressText: `${completedGoals.length}/2 Completed`,
        colorClass: "from-violet-500/10 to-purple-500/10 border-violet-200/50 text-violet-600 dark:text-violet-400",
        activeColorClass: "bg-violet-500 text-white shadow-violet-500/20"
      }
    ];

    return list;
  }, [completedGoals, completedSubtasksCount]);

  const unlockedCount = useMemo(() => {
    return badges.filter(b => b.unlocked).length;
  }, [badges]);

  const unlockPercentage = Math.round((unlockedCount / badges.length) * 100);

  return (
    <div id="achievements-section" className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs relative overflow-hidden transition duration-200 dark:bg-slate-900 dark:border-slate-800">
      {/* Decorative gradient corner */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-gray-100 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Guardian Achievements & Badges</h3>
            <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Rewards
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Earn dynamic badges by finishing tasks, beating deadlines, and conquering risks.</p>
        </div>
        
        {/* Progress Tracker */}
        <div className="flex items-center gap-3.5 shrink-0 bg-gray-50 p-2.5 rounded-xl border border-gray-200/60 dark:bg-slate-800/50 dark:border-slate-700/50">
          <div className="text-right">
            <div className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider">Achievements Completed</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {unlockedCount} / {badges.length} <span className="text-xs font-mono font-normal text-gray-500">({unlockPercentage}%)</span>
            </div>
          </div>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden dark:bg-slate-700">
            <div 
              className="bg-blue-600 h-full transition-all duration-500 rounded-full" 
              style={{ width: `${unlockPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {badges.map((badge, index) => {
          const BadgeIcon = badge.icon;
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -2, scale: 1.02 }}
              className={`relative border rounded-2xl p-4 flex flex-col justify-between h-40 transition-all duration-300 ${
                badge.unlocked 
                  ? `bg-gradient-to-br ${badge.colorClass} border-transparent shadow-xs` 
                  : "bg-gray-50/50 border-gray-150 text-gray-400 dark:bg-slate-800/30 dark:border-slate-800"
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Badge Icon Wrapper */}
                <div className={`p-2.5 rounded-xl flex items-center justify-center transition ${
                  badge.unlocked 
                    ? badge.activeColorClass
                    : "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500"
                }`}>
                  <BadgeIcon className="w-5 h-5" />
                </div>

                {/* Status Indicator */}
                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                  badge.unlocked 
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" 
                    : "bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500"
                }`}>
                  {badge.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>

              <div className="mt-4">
                <h4 className={`text-xs font-bold ${
                  badge.unlocked ? "text-gray-950 dark:text-gray-50" : "text-gray-400 dark:text-slate-500"
                }`}>
                  {badge.name}
                </h4>
                <p className="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {badge.description}
                </p>
              </div>

              {/* Progress Detail */}
              <div className="mt-2.5 pt-2 border-t border-gray-100/30 flex items-center justify-between text-[9px] font-mono font-bold">
                <span className="text-gray-400 uppercase">STATUS</span>
                <span className={badge.unlocked ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-slate-500"}>
                  {badge.progressText}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
