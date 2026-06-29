import React from "react";
import { 
  Database, Cpu, Layers, Code, ShieldCheck, 
  Calendar, Flame, ListOrdered, Sparkles, ChevronRight
} from "lucide-react";

export default function ArchitectureBlueprint() {
  return (
    <div id="architecture-blueprint" className="space-y-8 animate-fade-in text-gray-850">
      {/* Blueprint Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-blue-700 font-mono text-[10px] font-bold uppercase tracking-wider bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
              PRODUCT ARCHITECTURE & SPECS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
              Deadline Guardian Specs
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mt-1 leading-relaxed">
              Complete product architecture, Firestore schemas, API designs, and a 5-day execution roadmap tailored for a solo developer.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-3 rounded-xl shadow-sm">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <div className="text-[10px] text-gray-400 font-mono font-bold tracking-wider">EST. TIMELINE</div>
              <div className="text-sm font-semibold text-green-700">5 Days Execution</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Architecture & Database Schema */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Suggested Architecture */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-6 relative shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">System Architecture</h3>
              <p className="text-xs text-gray-500">Serverless & Full-Stack Cloud Layout</p>
            </div>
          </div>
          
          {/* Flowchart Representation */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 font-mono text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-semibold">Frontend</span>
              <span className="text-gray-600">React + Vite + Tailwind CSS</span>
            </div>
            <div className="text-center text-gray-400">│</div>
            <div className="text-center text-gray-400">▼</div>
            
            <div className="flex items-center justify-between border border-dashed border-gray-300 p-3 rounded-lg bg-white shadow-sm">
              <div className="space-y-1">
                <div className="text-gray-700 font-semibold">Firebase Authentication</div>
                <p className="text-[10px] text-gray-500">Sign-In methods, session logs</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className="space-y-1 text-right">
                <div className="text-gray-700 font-semibold">Cloud Firestore</div>
                <p className="text-[10px] text-gray-500">Persistent database state</p>
              </div>
            </div>

            <div className="text-center text-gray-400">│</div>
            <div className="text-center text-gray-400">▼</div>

            <div className="flex items-center justify-between border border-blue-100 p-3 rounded-lg bg-blue-50/50">
              <div className="space-y-1">
                <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[9px] border border-red-200 font-semibold uppercase tracking-wider">API Gateway</span>
                <div className="text-gray-850 font-semibold mt-1">Express API Proxies</div>
                <p className="text-[10px] text-gray-500 font-medium">Secure Node.js backend endpoints</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <div className="space-y-1 text-right">
                <div className="text-blue-700 font-semibold flex items-center justify-end gap-1">
                  <Cpu className="w-3.5 h-3.5" /> Gemini AI Engine
                </div>
                <p className="text-[10px] text-gray-500">Subtasks, Risk Scores, Rescue Plans</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              This is a <strong className="text-gray-800 font-semibold">Serverless Full-Stack Architecture</strong>. The React app runs on the client, fetching user profile information via Auth.
            </p>
            <p>
              All write operations are saved directly to <strong className="text-gray-800 font-semibold">Cloud Firestore</strong>. When a user creates a Goal, a secure custom Express API queries the <strong className="text-gray-800 font-semibold">Gemini-3.5-Flash</strong> model to break down tasks and estimate deadline vulnerabilities.
            </p>
          </div>
        </div>

        {/* Database Schema */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Firestore Schema</h3>
              <p className="text-xs text-gray-500">NoSQL Document Structures</p>
            </div>
          </div>

          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
            {/* Collection 1 */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-blue-700 mb-2 border-b border-gray-200 pb-1.5">
                <span>/users/&#123;uid&#125;</span>
                <span className="text-gray-400">Document</span>
              </div>
              <ul className="space-y-1 text-xs font-mono text-gray-600">
                <li><span className="text-gray-500 font-medium">id:</span> string (auth-uid)</li>
                <li><span className="text-gray-500 font-medium">email:</span> string</li>
                <li><span className="text-gray-500 font-medium">displayName:</span> string</li>
                <li><span className="text-gray-500 font-medium">createdAt:</span> timestamp</li>
              </ul>
            </div>

            {/* Collection 2 */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-blue-700 mb-2 border-b border-gray-200 pb-1.5">
                <span>/goals/&#123;goalId&#125;</span>
                <span className="text-gray-400">Document</span>
              </div>
              <ul className="space-y-1 text-xs font-mono text-gray-600">
                <li><span className="text-gray-500 font-medium">id:</span> string (auto-id)</li>
                <li><span className="text-gray-500 font-medium">userId:</span> string</li>
                <li><span className="text-gray-500 font-medium">title:</span> string</li>
                <li><span className="text-gray-500 font-medium">deadline:</span> timestamp</li>
                <li><span className="text-gray-500 font-medium">priority:</span> &quot;Low&quot; | &quot;Medium&quot; | &quot;High&quot;</li>
                <li><span className="text-gray-500 font-medium">overallRiskScore:</span> number</li>
              </ul>
            </div>

            {/* Collection 3 */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-blue-700 mb-2 border-b border-gray-200 pb-1.5">
                <span>/subtasks/&#123;subtaskId&#125;</span>
                <span className="text-gray-400">Document</span>
              </div>
              <ul className="space-y-1 text-xs font-mono text-gray-600">
                <li><span className="text-gray-500 font-medium">id:</span> string (auto-id)</li>
                <li><span className="text-gray-500 font-medium">goalId:</span> string</li>
                <li><span className="text-gray-500 font-medium">title:</span> string</li>
                <li><span className="text-gray-500 font-medium">estimatedHours:</span> number</li>
                <li><span className="text-gray-500 font-medium">riskFactor:</span> string</li>
                <li><span className="text-gray-500 font-medium">completed:</span> boolean</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: API Structure & Screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* API Design */}
        <div className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
              <Code className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Server API Endpoints</h3>
              <p className="text-xs text-gray-500">Task-to-AI Interface Contracts</p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* EP 1 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider">POST</span>
                <span className="text-gray-800 font-semibold">/api/ai/breakdown</span>
              </div>
              <p className="text-gray-500 text-[11px] mb-2">Accepts Goal details and returns custom subtasks, estimated duration, and initial risk factors.</p>
              <div className="text-[10px] text-gray-500 bg-white p-1.5 rounded border border-gray-150">
                <span className="text-gray-400 font-bold">Payload:</span> &#123; goal, description, deadline &#125;
              </div>
            </div>

            {/* EP 2 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider">POST</span>
                <span className="text-gray-800 font-semibold">/api/ai/risk-analysis</span>
              </div>
              <p className="text-gray-500 text-[11px] mb-2">Estimates real-time risk scores (0-100) and supplies detailed mitigation guides.</p>
              <div className="text-[10px] text-gray-500 bg-white p-1.5 rounded border border-gray-150">
                <span className="text-gray-400 font-bold">Payload:</span> &#123; taskTitle, deadline, progress, hoursRemaining &#125;
              </div>
            </div>

            {/* EP 3 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider">POST</span>
                <span className="text-gray-850 font-semibold">/api/ai/rescue-plan</span>
              </div>
              <p className="text-gray-500 text-[11px] mb-2">Activates high-urgency rescue guides for overdue or lagging tasks.</p>
              <div className="text-[10px] text-gray-500 bg-white p-1.5 rounded border border-gray-150">
                <span className="text-gray-400 font-bold">Payload:</span> &#123; taskTitle, deadline, hoursLeft, originalEstimate, panicLevel &#125;
              </div>
            </div>
          </div>
        </div>

        {/* Frontend Screens */}
        <div className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">SaaS Interface Layout</h3>
              <p className="text-xs text-gray-500">Component Hierarchy & User Interactions</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Screen 1 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center font-mono text-xs text-blue-600 font-bold mt-0.5">
                1
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Guardian Dashboard (Home)</h4>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                  Gives the user an overview of active goals, deadline dates, risk ratios, and alert panels indicating severe risk areas.
                </p>
              </div>
            </div>

            {/* Screen 2 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center font-mono text-xs text-blue-600 font-bold mt-0.5">
                2
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Goal Breakdown Panel</h4>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                  Allows adding a Goal. Invokes Gemini to break it down into interactive subtasks. Includes simple state updates (progress slider, checkbox toggling).
                </p>
              </div>
            </div>

            {/* Screen 3 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center font-mono text-xs text-blue-600 font-bold mt-0.5">
                3
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Adaptive Planner (Timeline)</h4>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                  Displays a personal 5-day step-by-step calendar guide, adjusting daily blocks according to subtask importance and risks.
                </p>
              </div>
            </div>

            {/* Screen 4 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center font-mono text-xs text-red-600 font-bold mt-0.5">
                4
              </div>
              <div>
                <h4 className="text-sm font-semibold text-red-700 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-500" /> Rescue Mode Console
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                  Triggered when deadlines are falling behind. Generates immediate 2-hour priority sprints, 6-hour hour-by-hour agendas, and de-scoping recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Execution Roadmap: Solo Developer 5 Days */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
            <ListOrdered className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sprint Implementation Roadmap</h3>
            <p className="text-xs text-gray-500">Day-by-Day SaaS Core Sprints</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          
          {/* Day 1 */}
          <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="text-[9px] font-mono font-bold text-blue-700 uppercase tracking-wide">DAY 1</div>
              <h4 className="text-sm font-semibold text-gray-800 mt-1">Foundations</h4>
              <ul className="text-xs text-gray-500 space-y-1.5 mt-3 list-disc pl-4 leading-normal">
                <li>Create React + Tailwind template.</li>
                <li>Setup Firebase Auth & Firestore DB.</li>
                <li>Enable sandbox logins for smooth testing.</li>
              </ul>
            </div>
            <div className="text-[11px] text-gray-600 mt-4 border-t border-gray-150 pt-2 font-semibold">
              Module: Auth Core
            </div>
          </div>

          {/* Day 2 */}
          <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="text-[9px] font-mono font-bold text-blue-700 uppercase tracking-wide">DAY 2</div>
              <h4 className="text-sm font-semibold text-gray-800 mt-1">Goal CRUD</h4>
              <ul className="text-xs text-gray-500 space-y-1.5 mt-3 list-disc pl-4 leading-normal">
                <li>Create dashboard layout and tabs.</li>
                <li>Build form to add goals to Firestore.</li>
                <li>Implement loading and failure feedback.</li>
              </ul>
            </div>
            <div className="text-[11px] text-gray-600 mt-4 border-t border-gray-150 pt-2 font-semibold">
              Module: Core UI & DB
            </div>
          </div>

          {/* Day 3 */}
          <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="text-[9px] font-mono font-bold text-blue-700 uppercase tracking-wide">DAY 3</div>
              <h4 className="text-sm font-semibold text-gray-800 mt-1">AI Breakdown</h4>
              <ul className="text-xs text-gray-500 space-y-1.5 mt-3 list-disc pl-4 leading-normal">
                <li>Deploy API route to interface with Gemini.</li>
                <li>Submit goals to Gemini and return subtasks.</li>
                <li>Save subtasks automatically to Firestore.</li>
              </ul>
            </div>
            <div className="text-[11px] text-blue-700 mt-4 border-t border-gray-150 pt-2 font-semibold">
              Module: Gemini AI
            </div>
          </div>

          {/* Day 4 */}
          <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="text-[9px] font-mono font-bold text-blue-700 uppercase tracking-wide">DAY 4</div>
              <h4 className="text-sm font-semibold text-gray-800 mt-1">Risk Calculations</h4>
              <ul className="text-xs text-gray-500 space-y-1.5 mt-3 list-disc pl-4 leading-normal">
                <li>Build live progress & hours trackers.</li>
                <li>Query risk estimation based on milestones.</li>
                <li>Design risk metrics panel with gauges.</li>
              </ul>
            </div>
            <div className="text-[11px] text-gray-600 mt-4 border-t border-gray-150 pt-2 font-semibold">
              Module: Vigilance Score
            </div>
          </div>

          {/* Day 5 */}
          <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div>
              <div className="text-[9px] font-mono font-bold text-red-600 uppercase tracking-wide">DAY 5</div>
              <h4 className="text-sm font-semibold text-gray-800 mt-1">Rescue Mode</h4>
              <ul className="text-xs text-gray-500 space-y-1.5 mt-3 list-disc pl-4 leading-normal">
                <li>Implement Rescue triggers & dialogs.</li>
                <li>Ask Gemini for ruthlessly de-scoped schedules.</li>
                <li>Run production tests & deploy applet.</li>
              </ul>
            </div>
            <div className="text-[11px] text-red-600 mt-4 border-t border-gray-150 pt-2 font-semibold">
              Module: Sprint Rescue
            </div>
          </div>

        </div>
      </div>

      {/* Guide: How Firebase makes this easy */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-700 font-semibold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">How Firebase Empowers Developers</h3>
            <p className="text-xs text-gray-500">Rapid Prototyping Benefits</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600 mt-6 leading-relaxed">
          <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h5 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Real-time Firestore Sync
            </h5>
            <p className="text-xs leading-normal text-gray-500">
              Firestore updates lists instantly using client-side listener snapshots (<code className="text-blue-600 font-mono text-[10px]">onSnapshot</code>). No complex state sync, socket rooms, or REST polling loops are required.
            </p>
          </div>

          <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h5 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Out-of-the-box Auth
            </h5>
            <p className="text-xs leading-normal text-gray-500">
              Skip implementing sign-up flow databases, hash calculations, salt parameters, or JWT storage. Firebase Auth provides high-security Google, Email, or Anonymous sign-ins in under 20 lines of code.
            </p>
          </div>

          <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h5 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Serverless Scaling & Hosting
            </h5>
            <p className="text-xs leading-normal text-gray-500">
              Zero server VPS setup, Docker, Nginx reverse proxies, or SSL certificates needed. Host client assets for free, and run serverless functions with automatic CPU scaling that keeps the hackathon demo live 24/7.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
