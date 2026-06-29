# Deadline Guardian AI

## Project Overview

**Deadline Guardian AI** is an intelligent, full-stack, proactive productivity companion designed to prevent project failure, procrastination, and missed deadlines. Powered by Google Gemini and integrated with Google Workspace (Docs/Drive) and Firebase (Firestore/Authentication), it functions as an active digital chief of staff. 

Unlike traditional static to-do lists, Deadline Guardian AI continuously monitors project progress, calculates real-time threat-level assessments, simulates risk impacts, dynamically schedules daily blocks, and offers an emergency "Rescue Mode" to help users handle critical schedule slips.

---

## Problem Statement Selected

### The Chaos of "Planning Fallacy" and Reactive Procrastination

Procrastination is often caused not by a lack of intent, but by cognitive overload and the **planning fallacy**—the tendency to underestimate the time and resources required to complete a task. 

When facing complex deadlines, users encounter several critical psychological and structural barriers:
1. **Decision Paralysis:** Deconstructing a monolithic project into manageable, ordered subtasks is mentally taxing.
2. **Invisible Slips:** Small delays in non-critical tasks silently accumulate until the overall deadline becomes mathematically impossible to hit.
3. **Panic Response (The Ostrich Effect):** When a deadline is at risk, users often avoid looking at their tools entirely, leading to catastrophic project abandonment.
4. **Lack of Proactive Assistance:** Traditional software is passive. It sends generic alarm notifications ("Due in 1 hour") when it is already too late to salvage the work.

---

## Why Existing Solutions Are Not Enough

| Feature / Aspect | Traditional Tools (Google Tasks, Todoist, Notion) | Deadline Guardian AI |
| :--- | :--- | :--- |
| **User Interaction** | Passive (Requires manual input and status updating). | Proactive (Active Monitoring, Auto-Calculates Risk). |
| **Subtask Handling** | Manual deconstruction. | Dynamic AI-powered breakdown with risk scoring. |
| **Risk Management** | None. Alarms trigger only after deadlines pass. | Real-time predictive risk metrics & trend analysis. |
| **Schedule Optimization** | Rigid time blocks; manual calendar dragging. | AI 5-Day adaptive timeboxing & task slotting. |
| **Crisis Recovery** | Manual deletion or manual rescheduling. | "Rescue Mode" providing hourly guides & descoping. |
| **Workspace Integration** | Manual copying/pasting to documents. | Single-click Google Docs export for project plans. |

Traditional software serves as an archive of things the user has *already failed* to do. It does not actively help the user *succeed* under stress.

---

## Solution Overview

Deadline Guardian AI shifts the paradigm of productivity tools from **passive recording** to **active safeguarding**. It serves as an authoritative guardian that protects your goals.

By combining the natural language understanding of Google's Gemini models with persistent Firestore database states, the system:
* **Analyzes and Deconstructs:** Turns high-level goals into tactical subtasks.
* **Forecasts Threat Metrics:** Continuously scores risk based on remaining hours, task complexity, and logged blockers.
* **Drives Focus with Timeboxing:** Generates 5-day structured schedules mapped to specific, bite-sized daily objectives.
* **Enforces Accountability via "AI Watchdog":** An background-style automated evaluator that flags the absolute highest priority item and warns of bottlenecks.
* **Supports Workspace Portability:** Allows immediate compilation and export of all project details into a formal Google Document for team handoffs.

---

## Key Features

### 1. Goal Deconstruction & Breakdown
* **Description:** Instantly deconstructs a broad project title and description into detailed, ordered subtasks.
* **How it Works:** The Express backend prompts the Gemini model to analyze the goal, outputting structured JSON containing a sequence of subtasks, each labeled with estimated hours and specific risk factors.
* **Technologies:** Express API, `@google/genai` (Gemini model), React, Tailwind.
* **User Benefit:** Removes initial planning friction and decision paralysis.

### 2. Predictive Risk Analysis
* **Description:** Quantifies the overall project threat level on a scale from 0% to 100%.
* **How it Works:** Re-evaluates risk metrics on task completion, notes additions, or deadline modifications, calculating a dynamic score and proposing practical mitigations.
* **Technologies:** Express backend `/api/ai/risk-analysis` endpoint, Firestore listener, Tailwind CSS progress charts.
* **User Benefit:** Real-time visibility into whether a project is sliding before it is too late.

### 3. Adaptive Schedule Planner (5-Day Timebox)
* **Description:** Synthesizes goals and subtasks into a highly specific 5-day roadmap.
* **How it Works:** Slots individual tasks into morning, afternoon, and evening blocks, complete with hourly durations and clear daily focuses.
* **Technologies:** Express API, `@google/genai`, responsive CSS grids with elegant timeline iconography.
* **User Benefit:** Translates vague lists into actionable daily time-blocks.

### 4. Rescue Mode (Crisis Recovery)
* **Description:** An emergency option triggered when a deadline is in high jeopardy.
* **How it Works:** Formulates immediate psychological mindset hacks, ruthless de-scoping recommendations (features to cut), and a laser-focused hourly timeline.
* **Technologies:** Dedicated `/api/ai/rescue-plan` route, real-time modal interface in React.
* **User Benefit:** Restores focus and organization during high-stress crises.

### 5. AI Watchdog Agent
* **Description:** A continuous monitor that acts as an aggressive accountability coach.
* **How it Works:** Inspects current progress, detects blockers, and flags the *one* critical item that must be resolved next, scoring its urgency.
* **Technologies:** React custom client triggers, Firestore, `/api/ai/watchdog` Express handler.
* **User Benefit:** Cuts through clutter by highlighting the absolute next step.

### 6. Interactive AI Chat Assistant
* **Description:** A context-aware overlay that answers questions specifically about the active project.
* **How it Works:** Feeds the entire project schema, current subtasks, and progress into a chatbot conversation, enabling instant brainstorming and advice.
* **Technologies:** `@google/genai` streaming/chat model context proxy.
* **User Benefit:** Get instant advice tailored specifically to your active workflow context.

### 7. What-If Simulation
* **Description:** Simulates the ripple effect of proposed changes before they are made.
* **How it Works:** Lets users test scenarios (e.g., "What if I get sick for 2 days?", "What if I drop subtask 3?") to preview risk adjustments.
* **Technologies:** `/api/ai/what-if` API route.
* **User Benefit:** Enables safe risk forecasting and stress-testing.

### 8. Google Docs Project Export
* **Description:** Generates a structured project description document in Google Docs.
* **How it Works:** Authenticates with Google Drive and Google Docs REST APIs via Firebase Popup scopes, creates a document, and formats the entire project details.
* **Technologies:** Firebase Google Auth Provider Scopes, Google Docs API REST endpoints.
* **User Benefit:** Export a clean plan to share with teams, clients, or instructors instantly.

---

## Complete User Workflow

The application workflow guarantees that every goal undergoes a rigorous lifecycle to maximize completion probability:

```
    [ User Inputs Goal Title & Deadline ]
                     │
                     ▼
       [ AI Goal Breakdown /api/ai/breakdown ]
                     │
                     ▼
       [ Predictive Risk Assessment /api/ai/risk-analysis ]
                     │
                     ├───────────────────────────────┐
                     ▼                               ▼
       [ Create 5-Day Schedule ]         [ Auth & Export to Google Docs ]
                     │                               │
                     ▼                               ▼
       [ Track Progress & Add Notes ]    [ Share Structured Plan ]
                     │
                     ├───────────────────────────────┐
                     ▼                               ▼
       [ AI Watchdog Status Checks ]     [ Simulate "What-If" Scenarios ]
                     │
                     ▼ (If sliding)
       [ Trigger Crisis "Rescue Mode" ]
                     │
                     ▼
       [ Accomplish Goal Successfully ]
```

1. **Goal Creation:** User defines the project (e.g., "Build Hackathon Prototype") and sets a firm deadline.
2. **AI Breakdown:** Gemini creates a chronological order of tasks with hour estimates.
3. **Risk Analysis:** The system calculates a risk score and alerts the user of potential bottlenecks.
4. **Timeboxing:** The 5-day scheduler generates specific hourly slots.
5. **Progress & Notes:** The user marks subtasks complete, logging "Blockers" or "Progress Notes" on specific subtasks.
6. **Watchdog Monitoring:** The watchdog flags critical priorities as notes accumulate or time passes.
7. **Rescue Plan:** If things go wrong, Rescue Mode offers descope options and a strict hour-by-hour timeline.
8. **Export & Handoff:** The entire structure can be exported to Google Docs with a single click.

---

## System Architecture

The application is structured as a full-stack, secure, single-port platform:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT / FRONTEND (React)                       │
├────────────────────────────────────────────────────────────────────────┤
│  - Vite dev server / static production assets (Index.html, CSS)         │
│  - State Management: React Hooks & Listeners                           │
│  - Auth: Firebase Client SDK & Google Auth Popup                       │
│  - DB Sync: Firestore Real-Time Subscriptions                          │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS / REST (Port 3000)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       BACKEND / SERVER (Express)                      │
├────────────────────────────────────────────────────────────────────────┤
│  - Port 3000 Ingress (Single Port Configuration)                       │
│  - API Routes proxying LLM endpoints (/api/ai/*)                       │
│  - Environment & Config Guard (dotenv, process.env secrets)            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                ┌──────────────────┴──────────────────┐
                ▼                                     ▼
┌──────────────────────────────┐       ┌──────────────────────────────┐
│       GOOGLE GEMINI API      │       │     FIREBASE CLOUD SUITE     │
├──────────────────────────────┤       ├──────────────────────────────┤
│ - Model: gemini-2.5-flash    │       │ - Authentication (Identity)  │
│ - SDK: @google/genai         │       │ - Cloud Firestore (Database) │
│ - Structured JSON Outputs    │       │ - Security Rules (Firestore) │
└──────────────────────────────┘       └──────────────────────────────┘
```

* **Frontend:** A responsive SPA written in **TypeScript** using **React 18** and **Vite**. Component communication, timers, and states are isolated in custom React components styled with **Tailwind CSS**.
* **Backend:** A lightweight **Express** server acting as a secure proxy. It isolates secrets (like the `GEMINI_API_KEY`) on the server side to protect against client inspection.
* **Gemini API:** Leverages the official modern `@google/genai` SDK to execute structured prompts.
* **Firebase Suite:** Combines Google Authentication with Firebase Firestore for persistent data synchronization across sessions.

---

## AI Architecture

Deadline Guardian AI employs a modular, domain-specific AI model approach. Rather than relying on a single general prompt, each analytical step has its own tailored schema.

### 1. Goal Deconstruction Model (`/api/ai/breakdown`)
* **Input:** `title`, `description`, `deadline`, `priority`.
* **Prompt Purpose:** Translate a broad goal into a logical, sequential set of 4-8 subtasks.
* **Output Schema:** 
  ```json
  {
    "subtasks": [
      {
        "title": "String",
        "estimatedHours": "Number",
        "riskFactor": "Low | Medium | High",
        "riskAnalysis": "String"
      }
    ],
    "overallAnalysis": "String"
  }
  ```
* **Gemini Usage:** Acts as an experienced technical program manager, ensuring tasks are chronological and estimating hours realistically.

### 2. Predictive Risk Assessment Model (`/api/ai/risk-analysis`)
* **Input:** Complete `goal` metadata, current list of subtasks, progress percentages, logged notes/blockers, and remaining days.
* **Prompt Purpose:** Identify task delays, flag critical blockers, and calculate a realistic risk percentage.
* **Output Schema:** 
  ```json
  {
    "riskScore": "Number (0-100)",
    "riskTier": "Low | Medium | High",
    "reasons": "String[]",
    "mitigationActions": "String[]",
    "assessmentText": "String"
  }
  ```

### 3. Adaptive Schedule Planner (`/api/ai/schedule`)
* **Input:** `goal` (with subtasks and notes), current date context.
* **Prompt Purpose:** Distribute remaining subtasks over a 5-day calendar grid with hourly schedules and specific daily focuses.
* **Output Schema:** 
  ```json
  {
    "days": [
      {
        "dayName": "String",
        "focus": "String",
        "items": [
          {
            "timeSlot": "String (e.g., 09:00 - 11:00)",
            "taskTitle": "String",
            "duration": "String",
            "objective": "String"
          }
        ]
      }
    ],
    "productivityTip": "String"
  }
  ```

### 4. Rescue Mode Planner (`/api/ai/rescue-plan`)
* **Input:** Overdue subtasks, active blockers, overall risk status, and deadline.
* **Prompt Purpose:** Perform a project emergency triage. Formulate strict, hour-by-hour schedules, de-scoping suggestions, and cognitive performance guidelines.
* **Output Schema:** 
  ```json
  {
    "immediateActions": "String[]",
    "hourlyGuide": [
      {
        "hour": "String",
        "focus": "String",
        "tips": "String"
      }
    ],
    "descopeSuggestions": "String[]",
    "mindsetHack": "String"
  }
  ```

### 5. AI Watchdog Agent (`/api/ai/watchdog`)
* **Input:** Active goal progress, specific subtask progress values, list of active blocker notes, and priority tier.
* **Prompt Purpose:** Serve as an objective evaluator to point out the single most critical task holding up the pipeline.
* **Output Schema:**
  ```json
  {
    "priorityAction": "String",
    "reason": "String",
    "estimatedHours": "Number",
    "urgency": "LOW | MEDIUM | HIGH | CRITICAL"
  }
  ```

### 6. Interactive Assistant Proxy (`/api/ai/chat`)
* **Input:** User query, goal context, subtask listing, and conversation history.
* **Prompt Purpose:** Provide context-aware advice about the active project.
* **Output:** Streaming markdown text.

### 7. What-If Simulator (`/api/ai/what-if`)
* **Input:** Active goal, subtasks list, and user's proposed scenario (e.g., "What if I take Friday off?").
* **Prompt Purpose:** Simulate potential project schedule impact and compile recovery actions.
* **Output Schema:**
  ```json
  {
    "riskImpact": "Number",
    "deadlineImpact": "String",
    "tasksAffected": "String[]",
    "recoveryStrategy": "String"
  }
  ```

---

## API Documentation

The Express server exposes the following endpoints (all requests and responses utilize standard JSON payloads):

### `GET /api/status`
* **Purpose:** Checks health status of backend server and verifies environment configuration.
* **Response:** `{ "status": "ok", "env": { "hasGeminiKey": true } }`

### `POST /api/ai/breakdown`
* **Purpose:** Generates structured subtasks for a newly created goal.
* **Request Body:**
  ```json
  {
    "title": "Build Mobile Application",
    "description": "Create a React Native prototype for a delivery service.",
    "deadline": "2026-07-05",
    "priority": "High"
  }
  ```
* **Response:** Returns JSON matching the **Goal Deconstruction Model** schema.

### `POST /api/ai/risk-analysis`
* **Purpose:** Assesses current risk metrics and generates mitigation strategies.
* **Request Body:**
  ```json
  {
    "goal": { ... },
    "subtasks": [ ... ]
  }
  ```
* **Response:** Returns JSON matching the **Predictive Risk Assessment Model** schema.

### `POST /api/ai/schedule`
* **Purpose:** Develops a 5-day tactical schedule for the goal's subtasks.
* **Request Body:**
  ```json
  {
    "goal": { ... },
    "subtasks": [ ... ]
  }
  ```
* **Response:** Returns JSON matching the **Adaptive Schedule Planner** schema.

### `POST /api/ai/rescue-plan`
* **Purpose:** Generates a high-intensity crisis plan for sliding deadlines.
* **Request Body:**
  ```json
  {
    "goal": { ... },
    "subtasks": [ ... ]
  }
  ```
* **Response:** Returns JSON matching the **Rescue Mode Planner** schema.

### `POST /api/ai/watchdog`
* **Purpose:** Continuously determines the next immediate priority and evaluates blocker threats.
* **Request Body:**
  ```json
  {
    "goal": { ... },
    "subtasks": [ ... ]
  }
  ```
* **Response:** Returns JSON matching the **AI Watchdog Agent** schema.

### `POST /api/ai/what-if`
* **Purpose:** Simulates changes to timelines, dependencies, or scope.
* **Request Body:**
  ```json
  {
    "goal": { ... },
    "subtasks": [ ... ],
    "scenario": "I got delayed by 12 hours due to power outage"
  }
  ```
* **Response:** Returns JSON matching the **What-If Simulator** schema.

### `POST /api/ai/chat`
* **Purpose:** Context-aware chat proxy that answers queries about the active project.
* **Request Body:**
  ```json
  {
    "goal": { ... },
    "subtasks": [ ... ],
    "messages": [ { "role": "user", "content": "How can I speed up task 2?" } ]
  }
  ```
* **Response:** Streams text responses.

---

## Database Schema

Deadline Guardian AI uses Google Cloud Firestore for persistent storage.

```
/users/{userId}
   ├── (Fields: email, lastActive, createdAt)
   │
   └── /goals/{goalId}
          ├── title: String
          ├── description: String
          ├── deadline: String
          ├── priority: "Low" | "Medium" | "High"
          ├── overallRiskScore: Number
          ├── overallAnalysis: String
          ├── createdAt: Timestamp
          │
          └── subtasks: Array of Objects
                 ├── id: String
                 ├── title: String
                 ├── estimatedHours: Number
                 ├── order: Number
                 ├── riskFactor: "Low" | "Medium" | "High"
                 ├── riskAnalysis: String
                 ├── completed: Boolean
                 ├── progress: Number
                 └── notes: Array of Objects
                        ├── id: String
                        ├── content: String
                        ├── type: "progress" | "blocker"
                        └── createdAt: String
```

---

## Technologies Used

### Frontend
* **React 18 & Vite:** Fast client-side performance, hot reloading (for local dev), and SPA efficiency.
* **TypeScript:** Strong static typing that reduces runtime errors.
* **Tailwind CSS:** Modern utility-first CSS styling for custom metrics gauges and timelines.
* **Lucide React:** Iconography suite for standard alerts, clocks, and action indicators.

### Backend
* **Express & Node.js:** Scalable routing framework. Runs securely on Google Cloud Run.
* **dotenv:** Safe handling of local environment credentials.

### Database & Auth
* **Google Firebase Authentication:** Client authentication protecting user-specific data.
* **Google Cloud Firestore:** Scalable Document-Store Database with real-time listeners.

### Artificial Intelligence
* **Google Gemini (`gemini-2.5-flash`):** High-speed natural language processor utilizing advanced instruction sets.
* **`@google/genai` SDK:** The modern, robust SDK supporting type-safe integrations.

---

## Google Technologies Utilized

1. **Google AI Studio / Gemini API:** Used as the core analytical engine. The `gemini-2.5-flash` model deconstructs goals, predicts risk, builds daily schedule blocks, and suggests emergency descope plans. It is fast, highly reliable, and supports JSON constraints perfectly.
2. **Google Cloud Run:** Hosts the containerized Express/React full-stack application, ensuring auto-scaling, high availability, and single-port container routing.
3. **Firebase Authentication:** Handles secure Google OAuth popup sign-ins and registers unique user identities. This lets users persist their data securely on any machine.
4. **Google Cloud Firestore:** Real-time persistence layer. Goal states, checklists, notes, and metrics are saved to documents instantly.
5. **Google Docs & Google Drive REST APIs:** Enabled via secure user-consented OAuth scopes. It allows users to export their structured project plans directly into Google Docs.

---

## Technical Challenges

During development, several engineering obstacles were resolved:

1. **Popup Scopes in sandboxed Preview iFrames:**
   * *Problem:* In an iFrame-based development preview, standard Google redirect sign-ins fail due to security constraints.
   * *Solution:* Implemented fallback Google Popup Authentication flow, explicitly caching tokens in the application's runtime memory block so subsequent Google Docs REST calls carry the proper authorization headers without refreshing.

2. **Payload/Mismatches on LLM Responses:**
   * *Problem:* Language models occasionally output wrapped Markdown markdown blocks (e.g., ```json) that break standard `JSON.parse()`.
   * *Solution:* Engineered backend parsing utilities that strip out potential markdown wraps (` ```json ... ``` `) and utilize structured Gemini response schemes to enforce pure JSON output.

3. **Autocalculation Loop Collisions:**
   * *Problem:* Making API calls automatically when a state changes can create infinite render loops if the API output updates the same triggers.
   * *Solution:* Implemented explicit manual refresh thresholds, state caching, and structured `useEffect` triggers using primitive keys to prevent duplicate rendering.

4. **Robust Crash Resilience:**
   * *Problem:* Node.js backends can occasionally crash during unexpected API failures or connection dropouts.
   * *Solution:* Configured global unhandled promise rejection handlers (`unhandledRejection`) and uncaught exception catching to guarantee server availability under pressure.

---

## Future Improvements

* **Google Calendar Push Sync:** Sync the generated 5-day adaptive schedule into Google Calendar as visual timeboxes.
* **Shared Goal Collaborators:** Let team members collaborate on the same Firestore goal documents in real-time.
* **Chrome Extension Alert Integrations:** Push AI Watchdog warning alerts directly into the user's browser toolbar when risk scores exceed critical thresholds.

---

## Conclusion

**Deadline Guardian AI** transforms traditional task management into a proactive safeguarding system. By combining Google Gemini's advanced natural language model with Cloud Firestore's real-time state engine and Google Docs exports, it helps users defeat procrastination, manage planning fallacies, and rescue slipping deadlines before it is too late. It is a highly polished, robust, and submission-ready hackathon tool designed to keep projects on track.
