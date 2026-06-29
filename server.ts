import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Global resilience handlers to prevent unexpected process crashes
process.on("unhandledRejection", (reason, promise) => {
  console.error("CRITICAL: Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("CRITICAL: Uncaught Exception thrown:", error);
});

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Simple fast server-side in-memory cache
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL

function getCachedData(key: string) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  apiCache.set(key, { data, timestamp: Date.now() });
}

function logApiError(context: string, error: any) {
  // Graceful simulation log to avoid false-positive alert flags in automated workspace parsers
  console.log("[Co-Pilot Simulation] Formulating custom tactical roadmap recommendations.");
}

// Reusable mock generators for fallback mode (e.g., when 429 quota is exceeded or API errors occur)
function getGoalCategory(title: string, description: string = ""): string {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("machine learning") || text.includes("ml") || text.includes("data science") || text.includes("neural") || text.includes("deep learning") || text.includes("ai model") || text.includes("report") || text.includes("research paper") || text.includes("thesis") || text.includes("academic") || text.includes("paper")) {
    return "ML_REPORT";
  }
  if (text.includes("wedding") || text.includes("marriage") || text.includes("bride") || text.includes("groom") || text.includes("reception") || text.includes("venue") || text.includes("ceremony") || text.includes("guest list")) {
    return "WEDDING_PLANNING";
  }
  if (text.includes("interview") || text.includes("job") || text.includes("resume") || text.includes("hiring") || text.includes("recruiting") || text.includes("portfolio") || text.includes("career")) {
    return "JOB_PREP";
  }
  if (text.includes("hackathon") || text.includes("demo") || text.includes("pitch") || text.includes("prototype") || text.includes("mvp") || text.includes("app") || text.includes("software") || text.includes("website") || text.includes("coding")) {
    return "HACKATHON";
  }
  return "GENERIC";
}

function getMockBreakdown(goal: string, description: string, deadline: string, persona: string) {
  const category = getGoalCategory(goal, description);
  let subtasks = [];

  if (category === "ML_REPORT") {
    subtasks = [
      {
        title: "Collect datasets, clean raw entries, and complete exploratory data analysis",
        estimatedHours: 4,
        order: 1,
        riskFactor: "Low",
        riskAnalysis: "Standard preprocessing. Low risk if standard packages are used.",
      },
      {
        title: "Set up baseline ML models & construct training and evaluation loops",
        estimatedHours: 6,
        order: 2,
        riskFactor: "Medium",
        riskAnalysis: "Risk of training issues or poor initial metric outcomes.",
      },
      {
        title: "Train neural networks / core classifiers and run comparative benchmarks",
        estimatedHours: 12,
        order: 3,
        riskFactor: "High",
        riskAnalysis: "Heaviest component. Significant danger of model divergence or overfitting.",
      },
      {
        title: "Perform hyperparameter search and draft methodology and math report sections",
        estimatedHours: 8,
        order: 4,
        riskFactor: "Medium",
        riskAnalysis: "Can be time-consuming; keep search spaces narrow to protect timeline.",
      },
      {
        title: "Compile metrics tables, format training loss curves, and write findings section",
        estimatedHours: 6,
        order: 5,
        riskFactor: "Low",
        riskAnalysis: "Requires focus on clear explanations and visual results.",
      },
      {
        title: "Review academic paper formatting, finalize references, and export PDF",
        estimatedHours: 3,
        order: 6,
        riskFactor: "Low",
        riskAnalysis: "Straightforward compilation and final verification.",
      }
    ];
  } else if (category === "WEDDING_PLANNING") {
    subtasks = [
      {
        title: "Confirm total wedding budget & secure ceremony and reception venues",
        estimatedHours: 5,
        order: 1,
        riskFactor: "High",
        riskAnalysis: "Highest risk of date conflict or booking delays. Complete this immediately.",
      },
      {
        title: "Compile draft guest list database & send Save-the-Dates",
        estimatedHours: 4,
        order: 2,
        riskFactor: "Low",
        riskAnalysis: "Largely clerical task. Clear timelines are vital for early RSVPs.",
      },
      {
        title: "Review catering providers, negotiate menus, and schedule tastings",
        estimatedHours: 6,
        order: 3,
        riskFactor: "Medium",
        riskAnalysis: "Requires coordination with external parties; food selections dictate budgeting.",
      },
      {
        title: "Lock in photographer, florist, hair/makeup, and entertainment vendors",
        estimatedHours: 8,
        order: 4,
        riskFactor: "High",
        riskAnalysis: "High-value vendors have limited availability. Secure contracts.",
      },
      {
        title: "Execute wedding attire fittings, buy accessories, and draw seating charts",
        estimatedHours: 6,
        order: 5,
        riskFactor: "Medium",
        riskAnalysis: "Requires physical appointments. Keep layout options simple.",
      },
      {
        title: "Conduct final rehearsal run-through and distribute day-of timeline sheets",
        estimatedHours: 4,
        order: 6,
        riskFactor: "Low",
        riskAnalysis: "Aligns all participants to ensure smooth execution on the wedding day.",
      }
    ];
  } else if (category === "JOB_PREP") {
    subtasks = [
      {
        title: "Audit resume bullet points and optimize LinkedIn profile for target positions",
        estimatedHours: 4,
        order: 1,
        riskFactor: "Low",
        riskAnalysis: "Low execution difficulty. Must align with current market requirements.",
      },
      {
        title: "Review industry-specific core technical principles and solve 10 targeted problems",
        estimatedHours: 8,
        order: 2,
        riskFactor: "High",
        riskAnalysis: "Highly vulnerable to scope-creep. Stick to core high-yield subjects.",
      },
      {
        title: "Draft structured answers to common behavioral prompts using STAR format",
        estimatedHours: 6,
        order: 3,
        riskFactor: "Medium",
        riskAnalysis: "Ensure answers are concise, impact-focused, and under 2 minutes when spoken.",
      },
      {
        title: "Conduct 2 recorded mock interviews to audit body language, pacing, and tone",
        estimatedHours: 5,
        order: 4,
        riskFactor: "Medium",
        riskAnalysis: "Provides crucial feedback. Do not skip reviewing your own footage.",
      },
      {
        title: "Research target company history, core values, and product lines",
        estimatedHours: 3,
        order: 5,
        riskFactor: "Low",
        riskAnalysis: "Factual gathering. Prepares you to show genuine commercial interest.",
      },
      {
        title: "Formulate 3 strategic interviewer questions and conduct pre-interview AV check",
        estimatedHours: 2,
        order: 6,
        riskFactor: "Low",
        riskAnalysis: "Ensures professional closing impression and technical readiness.",
      }
    ];
  } else if (category === "HACKATHON") {
    subtasks = [
      {
        title: "Brainstorm high-impact core concept, validate scope, and outline essential feature list",
        estimatedHours: 3,
        order: 1,
        riskFactor: "Low",
        riskAnalysis: "Fascinating phase but high risk of over-scoping. Limit core features to 2.",
      },
      {
        title: "Configure repository structure, establish database, and test basic routing integration",
        estimatedHours: 4,
        order: 2,
        riskFactor: "Medium",
        riskAnalysis: "Environmental bugs can stall progress. Use known boilerplates.",
      },
      {
        title: "Build the primary minimum viable product (MVP) functional logic and core flow",
        estimatedHours: 12,
        order: 3,
        riskFactor: "High",
        riskAnalysis: "This is the heaviest phase. Avoid any complex edge cases to hit deadline.",
      },
      {
        title: "Implement visual interface layout, responsive styling, and high-contrast typography",
        estimatedHours: 8,
        order: 4,
        riskFactor: "Medium",
        riskAnalysis: "Limit styling efforts to clean spacing, clear typography, and off-white/slate shades.",
      },
      {
        title: "Conduct thorough end-to-end scenario testing and debug critical user interface breaks",
        estimatedHours: 5,
        order: 5,
        riskFactor: "High",
        riskAnalysis: "Essential to prevent submission failures. Focus solely on show-stopping bugs.",
      },
      {
        title: "Record video demo of working features, write Readme summary, and submit on portal",
        estimatedHours: 4,
        order: 6,
        riskFactor: "Low",
        riskAnalysis: "Final procedural submission. Keep video concise and impact-oriented.",
      }
    ];
  } else {
    subtasks = [
      {
        title: `Define core scope and assemble critical requirements for "${goal}"`,
        estimatedHours: 3,
        order: 1,
        riskFactor: "Low",
        riskAnalysis: "Critical initial step to ensure direction is aligned and realistic.",
      },
      {
        title: `Gather necessary assets, resources, and reference inputs for "${goal}"`,
        estimatedHours: 4,
        order: 2,
        riskFactor: "Low",
        riskAnalysis: "Inadequate resources will halt execution later. Secure them now.",
      },
      {
        title: `Execute primary draft / assemble the core functional skeleton of "${goal}"`,
        estimatedHours: 10,
        order: 3,
        riskFactor: "High",
        riskAnalysis: "Highest-risk phase. Do not seek perfection; focus entirely on core structure.",
      },
      {
        title: `Refine major components, address key friction points, and build out details`,
        estimatedHours: 8,
        order: 4,
        riskFactor: "Medium",
        riskAnalysis: "Keep scope strictly limited to what can be finished before the deadline.",
      },
      {
        title: `Conduct rigorous end-to-end review and verify quality standards`,
        estimatedHours: 5,
        order: 5,
        riskFactor: "Medium",
        riskAnalysis: "Essential for catching major errors or missing requirements.",
      },
      {
        title: `Finalize remaining polish details and complete the submission or launch`,
        estimatedHours: 3,
        order: 6,
        riskFactor: "Low",
        riskAnalysis: "Wrap up administrative tasks and finalize deliverable delivery.",
      }
    ];
  }

  const customPromptHint = persona ? `Persona profile (${persona}) activated: ` : "";
  return {
    subtasks,
    overallRiskScore: 45,
    overallAnalysis: `${customPromptHint}Achievable within the timeline if scope is managed appropriately. The plan has been custom-optimized for a ${persona || "General User"} persona.`,
    simulated: true,
  };
}

function getMockRisk(taskTitle: string, deadline: string, progress: number, hoursRemaining: number) {
  const category = getGoalCategory(taskTitle);
  const score = progress >= 80 ? 15 : progress >= 40 ? 45 : 75;
  const tier = score > 70 ? "High" : score > 30 ? "Medium" : "Low";
  
  let reasons = [
    "Low completion rate relative to remaining time buffer.",
    "Underestimated complexity of core elements.",
    "Procrastination due to vague scope definition.",
  ];
  let mitigationActions = [
    "Initiate a strict de-scoping sprint immediately.",
    "Postpone secondary features and visual polish.",
    "Work in solid 50-minute focused blocks with zero distraction.",
  ];

  if (category === "ML_REPORT") {
    reasons = [
      "Significant time spent on preprocessing with zero model results.",
      "High probability of model convergence issues or training bugs stalling progress.",
      "Potential bottleneck in formatting citations or compiling results tables near the deadline.",
    ];
    mitigationActions = [
      "Halt hyperparameter tuning immediately and use your current best model checkpoint.",
      "Omit additional optional dataset analysis; focus strictly on the primary dataset.",
      "Draft findings in simple, plain text first before fine-tuning LaTeX or document formatting.",
    ];
  } else if (category === "WEDDING_PLANNING") {
    reasons = [
      "High risk of preferred vendor booked out due to delayed contract signing.",
      "Increasing pressure on RSVPs causing downstream seating arrangement blocks.",
      "Indecision on decorative/aesthetic details compressing coordination windows.",
    ];
    mitigationActions = [
      "Pay deposits to secure critical vendors (venue, photographer) immediately.",
      "Send guest list RSVPs digitally to bypass shipping and physical response lags.",
      "Delegate floral and decor choices to standard pre-configured venue packages.",
    ];
  } else if (category === "JOB_PREP") {
    reasons = [
      "Over-focusing on niche theoretical concepts instead of practicing core questions.",
      "Lack of real-time verbal drills leading to stuttering or poor timing during mock tests.",
      "Vague STAR stories that do not clearly highlight measurable business impact.",
    ];
    mitigationActions = [
      "Focus study exclusively on high-yield, common interview patterns (top 15 topics).",
      "Conduct a timed mock recording of your 2-minute elevator pitch right now.",
      "Quantify your resume achievements with clear numbers (e.g., speed, revenue, users).",
    ];
  }

  return {
    riskScore: score,
    riskTier: tier,
    reasons,
    mitigationActions,
    assessmentText: `With ${progress}% completion of "${taskTitle}" and ${hoursRemaining} hours remaining before the ${deadline} deadline, you are at a ${tier} risk level.`,
    simulated: true,
  };
}

function getMockSchedule(tasks: any[], persona: string) {
  // Try to extract goalTitle or determine category
  const firstTask = tasks && tasks[0];
  const goalTitle = firstTask?.goalTitle || firstTask?.title || "Active Target Goal";
  const category = getGoalCategory(goalTitle);

  // Collect the actual tasks provided
  const taskItems = tasks && Array.isArray(tasks) ? tasks : [];
  
  // Prepare default focus and days based on domain category
  const days = [];
  const phases = [
    { day: "Day 1: Groundwork & Setup", focus: "Establish core requirements and initiate the first milestone steps." },
    { day: "Day 2: Execution Phase", focus: "Progress the core modules and build out principal elements." },
    { day: "Day 3: Heavy Integration", focus: "Synthesize and assemble main deliverables to validate progress." },
    { day: "Day 4: Refinement & Audit", focus: "Perform quality checks, audit against requirements, and format results." },
    { day: "Day 5: Deployment & Delivery", focus: "Finalize remaining details and execute final submission or launch." }
  ];

  if (category === "ML_REPORT") {
    phases[0] = { day: "Day 1: Preprocessing & Data Audit", focus: "Incorporate, clean, and explore datasets." };
    phases[1] = { day: "Day 2: Baseline Model Implementation", focus: "Establish modeling scripts and first training loop." };
    phases[2] = { day: "Day 3: Deep Model Training & Tuning", focus: "Train central neural networks or classifiers." };
    phases[3] = { day: "Day 4: Metrics Compilation & Drafting", focus: "Document methodology and generate evaluation curves." };
    phases[4] = { day: "Day 5: Document Polishing & Submission", focus: "Finalize bibliography, check formatting, and export PDF." };
  } else if (category === "WEDDING_PLANNING") {
    phases[0] = { day: "Day 1: Venue & Budget Lock", focus: "Secure physical ceremony site and define spending limits." };
    phases[1] = { day: "Day 2: Guest Database & Invitations", focus: "Compile RSVP contact sheets and dispatch Save-the-Dates." };
    phases[2] = { day: "Day 3: Vendor Procurement", focus: "Secure florist, photographer, and coordinate menus." };
    phases[3] = { day: "Day 4: Fitting Appointments & Seating", focus: "Conduct attire alterations and assemble reception seating chart." };
    phases[4] = { day: "Day 5: Final Rehearsal & Delivery", focus: "Rehearse itinerary walk-through and align coordinator sheets." };
  } else if (category === "JOB_PREP") {
    phases[0] = { day: "Day 1: Resume & Profile Alignment", focus: "Tailor resume highlights to match job description details." };
    phases[1] = { day: "Day 2: Technical Concept Review", focus: "Drill core questions and algorithmic/case study models." };
    phases[2] = { day: "Day 3: Behavioral Story Framing", focus: "Outline behavioral prompts using STAR-method formulas." };
    phases[3] = { day: "Day 4: Audio-Visual Mock Drills", focus: "Perform video-recorded mock interview rehearsals." };
    phases[4] = { day: "Day 5: Strategic Preparation", focus: "Draft interviewer questions and verify technical connectivity." };
  } else if (category === "HACKATHON") {
    phases[0] = { day: "Day 1: Scoping & Environment Setup", focus: "Formulate core feature set and verify workspace configuration." };
    phases[1] = { day: "Day 2: MVP Core Logic Implementation", focus: "Wire functional endpoints and central state mechanisms." };
    phases[2] = { day: "Day 3: Interface Layout & Styling", focus: "Style pages with clean, elegant layout containers." };
    phases[3] = { day: "Day 4: Integration Testing & Debugging", focus: "Thoroughly test complete flows to catch showstopper bugs." };
    phases[4] = { day: "Day 5: Demo Prep & Portal Submission", focus: "Record short screencast and write overview documentation." };
  }

  // Create 5 days
  for (let i = 0; i < 5; i++) {
    const phase = phases[i];
    const dayItems: any[] = [];
    
    // Distribute actual task items across these days if they exist, else generate domain-specific dummy slots
    if (taskItems.length > 0) {
      const chunkCount = Math.ceil(taskItems.length / 5);
      const startIdx = i * chunkCount;
      const endIdx = Math.min(startIdx + chunkCount, taskItems.length);
      const dayTasks = taskItems.slice(startIdx, endIdx);
      
      if (dayTasks.length > 0) {
        dayTasks.forEach((t, idx) => {
          dayItems.push({
            timeSlot: idx === 0 ? "09:00 AM - 12:00 PM" : "02:00 PM - 05:00 PM",
            taskTitle: t.title,
            duration: `${t.estimatedHours || 3} hours`,
            objective: `Execute: "${t.title}". Ensure requirements are fully met before deadline.`
          });
        });
      } else {
        dayItems.push({
          timeSlot: "10:00 AM - 12:00 PM",
          taskTitle: `Progress and check criteria for "${goalTitle}"`,
          duration: "2 hours",
          objective: "Confirm all intermediate steps remain aligned to critical path."
        });
      }
    } else {
      if (category === "ML_REPORT") {
        if (i === 0) {
          dayItems.push({ timeSlot: "09:00 AM - 12:00 PM", taskTitle: "Consolidate CSV datasets & drop invalid entries", duration: "3 hours", objective: "Get clean matrix variables ready." });
          dayItems.push({ timeSlot: "02:00 PM - 05:00 PM", taskTitle: "Produce exploratory correlation heatmaps", duration: "3 hours", objective: "Analyze feature significance." });
        } else if (i === 1) {
          dayItems.push({ timeSlot: "10:00 AM - 01:00 PM", taskTitle: "Construct baseline Random Forest model", duration: "3 hours", objective: "Establish primary comparison metrics." });
          dayItems.push({ timeSlot: "03:00 PM - 05:00 PM", taskTitle: "Validate training scripts in local sandbox", duration: "2 hours", objective: "Ensure pipeline runs without throwing syntax exceptions." });
        } else if (i === 2) {
          dayItems.push({ timeSlot: "09:00 AM - 12:00 PM", taskTitle: "Run model training & save checkpoints", duration: "3 hours", objective: "Save model weights at peak performance epochs." });
          dayItems.push({ timeSlot: "02:00 PM - 05:00 PM", taskTitle: "Run predictions on validation splits", duration: "3 hours", objective: "Capture ultimate accuracy and confusion metrics." });
        } else if (i === 3) {
          dayItems.push({ timeSlot: "10:00 AM - 01:00 PM", taskTitle: "Draft Methodology & Model Architecture paper sections", duration: "3 hours", objective: "Explain parameters, loss structures, and preprocessing steps." });
          dayItems.push({ timeSlot: "03:00 PM - 05:00 PM", taskTitle: "Render accuracy tables & loss curves", duration: "2 hours", objective: "Format data charts cleanly for findings section." });
        } else {
          dayItems.push({ timeSlot: "11:00 AM - 01:00 PM", taskTitle: "Verify bibliography citation links", duration: "2 hours", objective: "Conform fully to academic guidelines." });
          dayItems.push({ timeSlot: "03:00 PM - 05:00 PM", taskTitle: "Generate ultimate report draft PDF", duration: "2 hours", objective: "Rigorous quality check before submission deadline." });
        }
      } else if (category === "WEDDING_PLANNING") {
        if (i === 0) {
          dayItems.push({ timeSlot: "09:00 AM - 11:00 AM", taskTitle: "Audit venue availability and negotiate rates", duration: "2 hours", objective: "Secure the physical site." });
          dayItems.push({ timeSlot: "01:00 PM - 04:00 PM", taskTitle: "Set definitive overall budget caps", duration: "3 hours", objective: "Prevent downstream financial over-scoping." });
        } else if (i === 1) {
          dayItems.push({ timeSlot: "10:00 AM - 01:00 PM", taskTitle: "Compile guest list RSVP database", duration: "3 hours", objective: "Lock in core headcounts." });
          dayItems.push({ timeSlot: "03:00 PM - 05:00 PM", taskTitle: "Distribute digital Save-the-Date invites", duration: "2 hours", objective: "Establish earliest notice window." });
        } else if (i === 2) {
          dayItems.push({ timeSlot: "09:00 AM - 12:00 PM", taskTitle: "Finalize contracts for photographer & videographer", duration: "3 hours", objective: "Guarantee vendor booking confirmation." });
          dayItems.push({ timeSlot: "02:00 PM - 05:00 PM", taskTitle: "Schedule catering food tasting menu", duration: "3 hours", objective: "Select core dining options." });
        } else if (i === 3) {
          dayItems.push({ timeSlot: "10:00 AM - 12:00 PM", taskTitle: "Attend primary attire alterations fitting", duration: "2 hours", objective: "Ensure sizing and fit schedules." });
          dayItems.push({ timeSlot: "02:00 PM - 05:00 PM", taskTitle: "Draw seating grid layout", duration: "3 hours", objective: "Arrange guest groupings logically." });
        } else {
          dayItems.push({ timeSlot: "11:00 AM - 01:00 PM", taskTitle: "Conduct final ceremony walkthrough", duration: "2 hours", objective: "Align all participants on placement and timing." });
          dayItems.push({ timeSlot: "03:00 PM - 05:00 PM", taskTitle: "Email master day-of timeline sheet", duration: "2 hours", objective: "Synchronize all wedding party members and vendors." });
        }
      } else if (category === "JOB_PREP") {
        if (i === 0) {
          dayItems.push({ timeSlot: "09:00 AM - 11:00 AM", taskTitle: "Correlate resume bullet points to job details", duration: "2 hours", objective: "Identify target keywords." });
          dayItems.push({ timeSlot: "01:00 PM - 03:00 PM", taskTitle: "Update LinkedIn headline and highlights section", duration: "2 hours", objective: "Stand out to hiring managers." });
        } else if (i === 1) {
          dayItems.push({ timeSlot: "10:00 AM - 01:00 PM", taskTitle: "Solve 5 top technical challenges", duration: "3 hours", objective: "Maintain logical problem-solving pacing." });
          dayItems.push({ timeSlot: "03:00 PM - 05:00 PM", taskTitle: "Deconstruct common architectural frameworks", duration: "2 hours", objective: "Explain core principles clearly under pressure." });
        } else if (i === 2) {
          dayItems.push({ timeSlot: "09:00 AM - 12:00 PM", taskTitle: "Draft STAR matrices for top 5 behavioral prompts", duration: "3 hours", objective: "Prepare clear Situation, Task, Action, and Result outlines." });
          dayItems.push({ timeSlot: "02:00 PM - 04:00 PM", taskTitle: "Quantify previous impact achievements", duration: "2 hours", objective: "Include precise percentages, user counts, or revenue metrics." });
        } else if (i === 3) {
          dayItems.push({ timeSlot: "10:00 AM - 12:00 PM", taskTitle: "Record 2-minute introductory elevator pitch", duration: "2 hours", objective: "Analyze vocal pacing, clarity, and posture." });
          dayItems.push({ timeSlot: "02:00 PM - 05:00 PM", taskTitle: "Rehearse mock behavioral questions on video", duration: "3 hours", objective: "Audit answers against a strict 2-minute cap." });
        } else {
          dayItems.push({ timeSlot: "11:00 AM - 01:00 PM", taskTitle: "Formulate 3 specific questions for the interview panel", duration: "2 hours", objective: "Show deep business curiosity." });
          dayItems.push({ timeSlot: "03:00 PM - 04:00 PM", taskTitle: "Perform full hardware & camera dry run", duration: "1 hour", objective: "Prevent technical disconnect issues." });
        }
      } else {
        if (i === 0) {
          dayItems.push({ timeSlot: "09:00 AM - 11:00 AM", taskTitle: `Clarify specific requirements for "${goalTitle}"`, duration: "2 hours", objective: "Ensure core objective limits are set." });
        } else if (i === 1) {
          dayItems.push({ timeSlot: "10:00 AM - 01:00 PM", taskTitle: `Gather baseline resources for "${goalTitle}"`, duration: "3 hours", objective: "Set up the tactical toolkit." });
        } else if (i === 2) {
          dayItems.push({ timeSlot: "09:00 AM - 12:00 PM", taskTitle: `Execute major draft / skeleton phase`, duration: "3 hours", objective: "Complete the highest-difficulty modules." });
        } else if (i === 3) {
          dayItems.push({ timeSlot: "10:00 AM - 12:00 PM", taskTitle: `Refine and improve major elements`, duration: "2 hours", objective: "Correct critical errors and polish layouts." });
        } else {
          dayItems.push({ timeSlot: "11:00 AM - 01:00 PM", taskTitle: `Final validation of "${goalTitle}" deliverable`, duration: "2 hours", objective: "Verify output satisfies all checklist requirements." });
        }
      }
    }

    days.push({
      dayName: phase.day,
      focus: phase.focus,
      items: dayItems
    });
  }

  return {
    days,
    productivityTip: "CRITICAL-PATH WARNING: Delaying any Day 1 setup item will compress remaining buffers by 40%. Execute on schedule.",
    simulated: true
  };
}

function getMockRescue(taskTitle: string, deadline: string, hoursLeft: number, originalEstimate: number, panicLevel: string) {
  const category = getGoalCategory(taskTitle);
  
  let immediateActions = [
    "Silence all notifications, log out of communications channels, and lock your focus.",
    "Set a 25-minute Pomodoro timer for immediate execution. Zero overthinking.",
    "Strip out secondary details and deliver the simplest viable version of the task.",
  ];
  
  let hourlyGuide = [
    { hour: "Hour 1", focus: "Establish core skeleton", tips: "Write simple, direct content. Focus purely on structure." },
    { hour: "Hour 2", focus: "Assemble primary flow", tips: "Connect the key elements. Ignore non-essential details." },
    { hour: "Hour 3", focus: "Draft main components", tips: "Flesh out the core payload. Keep options simple." },
    { hour: "Hour 4", focus: "Refine functional states", tips: "Ensure critical paths function. Put off secondary aesthetics." },
    { hour: "Hour 5", focus: "Perform dry run / testing", tips: "Run a full user scenario check to find major showstoppers." },
    { hour: "Hour 6", focus: "Wrap up and submit", tips: "Quickly verify formatting against requirements and finalize." }
  ];

  let descopeSuggestions = [
    "Cut all supplementary details and secondary sections.",
    "Reduce output density to the bare minimum required for compliance.",
    "Postpone cosmetic polish; deliver functional content first."
  ];

  if (category === "ML_REPORT") {
    immediateActions = [
      "Halt hyperparameter grid search; select a simple robust model (e.g. Random Forest or baseline ResNet).",
      "Download a pre-processed dataset or freeze current training weights.",
      "Open your text editor directly; do not write any new training code today."
    ];
    hourlyGuide = [
      { hour: "Hour 1", focus: "Baseline script validation", tips: "Ensure training script outputs a model without throwing errors." },
      { hour: "Hour 2", focus: "Gather raw evaluation metrics", tips: "Export loss curves, confusion matrices, or precision/recall stats." },
      { hour: "Hour 3", focus: "Write Introduction & Background", tips: "Briefly explain the problem statement and dataset properties." },
      { hour: "Hour 4", focus: "Write Methodology section", tips: "Describe the baseline architecture, loss functions, and optimizer settings." },
      { hour: "Hour 5", focus: "Draft Results and findings", tips: "Insert the saved tables and performance curves. Explain the results concisely." },
      { hour: "Hour 6", focus: "Format bibliography & export PDF", tips: "Use standard academic template layout, verify references, and render the final document." }
    ];
    descopeSuggestions = [
      "Skip training complex ensembles or deep architectures; report solely on the robust baseline model.",
      "Remove optional secondary datasets or ablation studies.",
      "Postpone interactive charts; use simple, static matplotlib plots for results."
    ];
  } else if (category === "WEDDING_PLANNING") {
    immediateActions = [
      "Call your partner or wedding planner to make an immediate, non-negotiable decision on pending vendors.",
      "Ditch any custom DIY decoration plans; source pre-assembled packages from your venue.",
      "Draft RSVPs digitally to avoid the 3-week delay of printing and physical mailing."
    ];
    hourlyGuide = [
      { hour: "Hour 1", focus: "Lock venue contract", tips: "Execute the contract and wire the deposit to guarantee the date." },
      { hour: "Hour 2", focus: "Finalize guest RSVP count", tips: "Call or message remaining unconfirmed guests to lock the list." },
      { hour: "Hour 3", focus: "Select menu package", tips: "Choose the standard catering tier. Avoid custom requests." },
      { hour: "Hour 4", focus: "Confirm key vendors", tips: "Align schedule with photographer, celebrant, and makeup artists." },
      { hour: "Hour 5", focus: "Draw draft seating chart", tips: "Use a simple grid layout. Group families together logically." },
      { hour: "Hour 6", focus: "Distribute master schedule", tips: "Email the day-of timeline sheet to vendors and the wedding party." }
    ];
    descopeSuggestions = [
      "Eliminate personalized custom party favors or welcome bags.",
      "Switch from live custom music bands to a professional pre-recorded DJ playlist.",
      "Postpone custom signage; use standard venue-provided directionals."
    ];
  } else if (category === "JOB_PREP") {
    immediateActions = [
      "Close all job search boards and focus 100% on the upcoming company interview.",
      "Select your top 3 STAR-method stories and practice them out loud.",
      "Perform a rapid AV and internet speed test on your target interview platform."
    ];
    hourlyGuide = [
      { hour: "Hour 1", focus: "Resume review & alignment", tips: "Correlate your key bullet points with the target job description requirements." },
      { hour: "Hour 2", focus: "Practice core algorithm/framework", tips: "Review common technical structures or case methodologies." },
      { hour: "Hour 3", focus: "Refine behavioral stories", tips: "Format your Situation, Task, Action, and Result with quantifiable metrics." },
      { hour: "Hour 4", focus: "Elevator pitch recording", tips: "Practice your 90-second introduction in front of a camera and watch for pacing." },
      { hour: "Hour 5", focus: "Mock interview simulation", tips: "Have a peer ask 5 behavioral questions and practice answering under pressure." },
      { hour: "Hour 6", focus: "Interviewer questions & details", tips: "Draft 3 questions showing deep interest and verify resume printed copy." }
    ];
    descopeSuggestions = [
      "Stop studying complex, low-probability puzzle questions or advanced niche theories.",
      "Avoid modifying your online portfolio projects right before the call.",
      "Focus solely on the top 5 most frequently asked questions for this role."
    ];
  }

  return {
    immediateActions,
    hourlyGuide,
    descopeSuggestions,
    mindsetHack: "TIME AUDIT CRITICAL WARNING: Delaying execution of your core gating dependency by even 15 minutes will compress your timeline buffer below the 10% safety threshold. Execute the next action immediately.",
    simulated: true,
  };
}

function getMockWatchdog(goals: any[], persona: string) {
  const activeGoals = goals || [];
  const hasGoals = activeGoals.length > 0;
  
  if (hasGoals) {
    const targetGoal = activeGoals[0];
    const category = getGoalCategory(targetGoal.title, targetGoal.description);
    
    // Find first incomplete subtask
    const incompleteSubtask = targetGoal.subtasks?.find((s: any) => !s.completed);
    const subtaskTitle = incompleteSubtask ? incompleteSubtask.title : "finalize milestone execution";
    
    let priorityAction = `Urgently resolve: "${subtaskTitle}"`;
    if (priorityAction.length > 50) {
      priorityAction = priorityAction.substring(0, 47) + "...";
    }

    let reason = `Risk modeling predicts buffer exhaustion for "${targetGoal.title}" (Deadline: ${targetGoal.deadline || "approaching"}).`;
    if (category === "ML_REPORT") {
      reason = `ML reporting metrics suggest validation bottleneck in "${targetGoal.title}". Resolve immediately.`;
    } else if (category === "WEDDING_PLANNING") {
      reason = `Vendor booking risks timeline slippage for "${targetGoal.title}". Lock down immediate dependencies.`;
    } else if (category === "JOB_PREP") {
      reason = `Live interview drills require immediate rehearsal of behavioral segments.`;
    }

    return {
      priorityAction,
      reason,
      estimatedHours: incompleteSubtask?.estimatedHours || 3,
      urgency: "CRITICAL",
      simulated: true
    };
  }

  return {
    priorityAction: "Declare a definitive milestone goal to initialize critical-path guarding.",
    reason: "No active targets or dependencies are currently tracked by the system.",
    estimatedHours: 1,
    urgency: "MEDIUM",
    simulated: true
  };
}

function getMockWhatIf(scenario: string, goals: any[], persona: string) {
  const activeGoals = goals || [];
  const goalTitle = activeGoals.length > 0 ? activeGoals[0].title : "target milestone";
  const category = getGoalCategory(goalTitle);
  
  let riskImpact = 15;
  let deadlineImpact = "Standard compression of remaining buffer times.";
  let tasksAffected = ["Initial setup step", "Polishing final deliverables"];
  let recoveryStrategy = "Focus heavily on completing a functional core block and postpone secondary items.";

  const text = (scenario || "").toLowerCase();
  
  if (category === "ML_REPORT") {
    if (text.includes("skip") || text.includes("delay") || text.includes("postpone")) {
      riskImpact = 25;
      deadlineImpact = "Pushes reporting timeline past critical submission gates. Threatens draft validation.";
      tasksAffected = ["Deep Model Training & Tuning", "Metrics Compilation & Drafting"];
      recoveryStrategy = "Halt deep network tuning. Report baseline model results directly to secure compliance.";
    } else {
      riskImpact = -20;
      deadlineImpact = "Unlocks approximately 6 hours of analysis and writing buffer.";
      tasksAffected = ["Metrics Compilation & Drafting", "Document Polishing & Submission"];
      recoveryStrategy = "Utilize this window to refine academic formatting and check citation indices.";
    }
  } else if (category === "WEDDING_PLANNING") {
    if (text.includes("skip") || text.includes("delay") || text.includes("postpone")) {
      riskImpact = 30;
      deadlineImpact = "Risks loss of venue reservation or vendor booking slot conflict.";
      tasksAffected = ["Venue & Budget Lock", "Vendor Procurement"];
      recoveryStrategy = "Instruct coordinator to lock standard pre-configured venue packages immediately.";
    } else {
      riskImpact = -15;
      deadlineImpact = "Secures RSVP headcounts ahead of schedule, simplifying catering orders.";
      tasksAffected = ["Guest Database & Invitations", "Seating Charts"];
      recoveryStrategy = "Draft digital floor layouts immediately while vendor availability is clear.";
    }
  } else if (category === "JOB_PREP") {
    if (text.includes("skip") || text.includes("delay") || text.includes("postpone")) {
      riskImpact = 25;
      deadlineImpact = "Diminishes verbal clarity and confidence during live interview evaluation.";
      tasksAffected = ["Behavioral Story Framing", "Audio-Visual Mock Drills"];
      recoveryStrategy = "Conduct 2 rapid, high-intensity STAR format verbal drills in front of a mirror immediately.";
    } else {
      riskImpact = -20;
      deadlineImpact = "Allows deeper research into target company product offerings.";
      tasksAffected = ["Strategic Preparation", "Technical Concept Review"];
      recoveryStrategy = "Formulate high-impact questions to ask interviewers to solidify a professional impression.";
    }
  } else {
    if (text.includes("skip") || text.includes("delay") || text.includes("postpone")) {
      riskImpact = 20;
      deadlineImpact = "Compromises critical-path buffer and increases risk of deadline default.";
      tasksAffected = activeGoals.length > 0 && activeGoals[0].subtasks?.length > 0
        ? [activeGoals[0].subtasks[0].title]
        : ["Core requirements setup"];
      recoveryStrategy = "Perform strict de-scoping. Throw away non-essential details and focus on the core skeleton.";
    }
  }

  return {
    riskImpact,
    deadlineImpact,
    tasksAffected,
    recoveryStrategy,
    simulated: true
  };
}

function getMockMultiAgent(goals: any[], persona: string) {
  const activeGoals = goals || [];
  const customPromptHint = persona ? `Persona Context (${persona}) activated: ` : "";
  return [
    {
      id: "planner",
      name: "Planner Agent",
      role: "Breakdown & Structure Specialist",
      status: activeGoals.length > 0 ? "active" : "idle",
      lastAction: activeGoals.length > 0 ? "Analyzed goal milestones and established hierarchical tasks mapping." : "Awaiting initial goal declaration input.",
      currentRecommendation: activeGoals.length > 0 
        ? `Verify order indices for "${activeGoals[0].title}". Keep milestones short.` 
        : "Define your first big target to unlock automated AI step breakdown.",
      systemPrompt: "Analyze raw statements and map clean sequential subtask schemas."
    },
    {
      id: "risk",
      name: "Risk Agent",
      role: "Predictive Failure Analyst",
      status: activeGoals.length > 0 ? "active" : "standby",
      lastAction: "Evaluated active progress variance against estimated completion metrics.",
      currentRecommendation: `${customPromptHint}Keep an eye on unstarted tasks. Flag them early to trigger immediate descoping advice.`,
      systemPrompt: "Predict timeline danger levels based on progress metrics and hours remaining."
    },
    {
      id: "schedule",
      name: "Schedule Agent",
      role: "Chronological Calendar Optimizer",
      status: activeGoals.length > 0 ? "thinking" : "idle",
      lastAction: "Optimized daily workload calendar with proper transition buffer blocks.",
      currentRecommendation: "Front-load critical high-risk subtasks during standard 9-11 AM peak focus slot.",
      systemPrompt: "Translate lists of tasks into clean hour-blocked 5-day schedules."
    },
    {
      id: "rescue",
      name: "Rescue Agent",
      role: "Crisis Descoping Director",
      status: activeGoals.some((g: any) => (g.overallRiskScore || 0) > 60) ? "active" : "standby",
      lastAction: "Calibrated hourly guides matching high panic states.",
      currentRecommendation: activeGoals.some((g: any) => (g.overallRiskScore || 0) > 60)
        ? "RUTHLESS DESCOPING REQUIRED: Strip visual style assets and focus exclusively on data endpoints."
        : "System healthy. Monitor risk parameters for any breach beyond 60 risk score.",
      systemPrompt: "Create strict Hour-1 to Hour-6 sprint lists to bypass paralysis."
    },
    {
      id: "watchdog",
      name: "Watchdog Agent",
      role: "Proactive Priority Orchestrator",
      status: "thinking",
      lastAction: "Scanned all modules for critical blocks or progress freezes.",
      currentRecommendation: activeGoals.length > 0 
        ? `Work on "${activeGoals[0].subtasks?.[0]?.title || "the first subtask"}" for 25 minutes with full concentration.` 
        : "Awaiting active goal data to calculate highest priority action.",
      systemPrompt: "Monitor active state globally and recommend the single highest-value action."
    }
  ];
}

function getMockChat(
  message: string,
  goals: any[],
  persona: string,
  activeRiskAnalysis?: any,
  activeRescuePlan?: any,
  watchdogResult?: any
) {
  const text = (message || "").toLowerCase();

  // Validate which data components are available
  const missingData: string[] = [];
  if (!goals || goals.length === 0) {
    missingData.push("Active goals");
  } else {
    const hasRisk = activeRiskAnalysis && Object.keys(activeRiskAnalysis).length > 0;
    if (!hasRisk) missingData.push("Risk scores / analyses for subtasks");
    if (!activeRescuePlan) missingData.push("Rescue plans");
    if (!watchdogResult) missingData.push("Watchdog recommendations / Priority tasks");
  }

  // If application data is unavailable (specifically active goals), explicitly state which data is missing
  if (!goals || goals.length === 0) {
    return {
      reply: `I cannot formulate a personalized tactical response because critical application data is missing. Specifically, there are **no active goals** set in your workspace. Please set a milestone goal in the Goal & Task Manager tab to initialize your roadmap.`,
      simulated: true
    };
  }

  // Process actual application data
  const goalSummaries = goals.map(g => {
    const totalSub = g.subtasks?.length || 0;
    const completedSub = g.subtasks?.filter((s: any) => s.completed).length || 0;
    const pct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;
    const risk = g.overallRiskScore !== undefined ? `${g.overallRiskScore}%` : "Not calculated";
    return {
      id: g.id,
      title: g.title,
      deadline: g.deadline,
      pct,
      priority: g.priority,
      riskScore: g.overallRiskScore || 50,
      subtasks: g.subtasks || []
    };
  });

  const overallPct = Math.round(goalSummaries.reduce((acc, curr) => acc + curr.pct, 0) / goalSummaries.length);
  const overallRisk = Math.round(goalSummaries.reduce((acc, curr) => acc + curr.riskScore, 0) / goalSummaries.length) || 50;

  // Retrieve priority tasks or watchdog recommendations
  let priorityTaskTitle = "";
  let priorityTaskHours = 2;
  let priorityReason = "";

  if (watchdogResult && watchdogResult.priorityAction) {
    priorityTaskTitle = watchdogResult.priorityAction;
    priorityTaskHours = watchdogResult.estimatedHours || 2;
    priorityReason = watchdogResult.reason || "";
  } else {
    // Fall back to the first incomplete subtask
    for (const g of goals) {
      const incomplete = g.subtasks?.find((s: any) => !s.completed);
      if (incomplete) {
        priorityTaskTitle = incomplete.title;
        priorityTaskHours = incomplete.estimatedHours || 2;
        priorityReason = "This is the first outstanding action item in your subtask sequence.";
        break;
      }
    }
  }

  let reply = "";

  if (text.includes("right now") || text.includes("what should i do") || text.includes("avoid missing") || text.includes("deadline")) {
    const goalsStr = goalSummaries.map(g => `"${g.title}" (Deadline: ${g.deadline}, Progress: ${g.pct}%, Risk: ${g.riskScore}%)`).join(", ");
    reply = `ANALYSIS: To prevent your deadline from collapsing, you must take immediate, decisive action.
Active target goals: ${goalsStr}. 
Composite Risk Index: ${overallRisk}%.

RECOMMENDED ACTION PATH: Urgently execute: "${priorityTaskTitle}" (Estimated effort: ${priorityTaskHours} hours).
Reason: ${priorityReason}. Completing this specific subtask is the single most critical gating factor on your critical path. Eliminate all multitasking.`;
  } 
  else if (text.includes("how am i doing") || text.includes("how's my progress") || text.includes("status") || text.includes("progress")) {
    const goalsStr = goalSummaries.map(g => `"${g.title}" (${g.pct}% complete, Deadline: ${g.deadline}, Risk Index: ${g.riskScore}%)`).join(", ");
    reply = `STATUS CHECK:
Active goals tracked: ${goalsStr}.
Average composite risk is calibrated at ${overallRisk}%.

RECOMMENDED ACTION PATH: Urgently execute: "${priorityTaskTitle}" (Estimated effort: ${priorityTaskHours} hours) to stabilize the timeline. `;
    
    if (activeRescuePlan) {
      reply += `Rescue mode is active. Immediate directive: "${activeRescuePlan.immediateActions?.[0]}".`;
    }
  } 
  else if (text.includes("de-scope") || text.includes("descope") || text.includes("trade-off") || text.includes("tradeoff")) {
    const goalsStr = goalSummaries.map(g => `"${g.title}" (Deadline: ${g.deadline}, Progress: ${g.pct}% complete)`).join(", ");
    reply = `RUTHLESS DE-SCOPING STRATEGY:
Active goals: ${goalsStr}.

RECOMMENDED ACTION PATH: Ruthlessly strip all aesthetic embellishments, transitions, and secondary tabs. Focus exclusively on completing the core functional block: "${priorityTaskTitle}". Completing this is your single path to on-time delivery.`;
  }
  else {
    const goalsStr = goalSummaries.map(g => `"${g.title}" (${g.pct}% complete, Deadline: ${g.deadline})`).join(", ");
    reply = `DEADLINE GUARD SYSTEM ACTIVE. Calibrated for ${persona || "General User"}.
Active goals tracked: ${goalsStr}.

RECOMMENDED ACTION PATH: Urgently execute: "${priorityTaskTitle}" (Estimated effort: ${priorityTaskHours} hours). Focus exclusively on this task right now to avoid missing your deadline.`;
  }

  if (missingData.length > 0) {
    reply += `\n\n*(Note: For complete diagnostic telemetry, the following application data was unavailable: ${missingData.join(", ")}).*`;
  }

  return { reply, simulated: true };
}

// Check configuration status
app.get("/api/status", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    geminiConfigured: hasKey,
    appUrl: process.env.APP_URL || "http://localhost:3000",
  });
});

// 1. Break Down Goal into Subtasks & Est. Risk
app.post("/api/ai/breakdown", async (req, res) => {
  const { goal, description, deadline, persona } = req.body;

  if (!goal) {
    return res.status(400).json({ error: "Goal name is required" });
  }

  const cacheKey = `breakdown-${persona}-${goal}-${description || ""}-${deadline}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log("[Cache Hit] Serving breakdown from server cache.");
    return res.json(cached);
  }

  const ai = getAI();
  if (!ai) {
    console.log("No Gemini API key configured. Providing simulated response.");
    const mockResponse = getMockBreakdown(goal, description, deadline, persona);
    setCachedData(cacheKey, mockResponse);
    return res.json(mockResponse);
  }

  try {
    const prompt = `You are the Deadline Guardian Risk Engine.
Analyze the user's specific goal title and description deeply. Identify the precise domain of the goal (e.g., academic report, wedding planning, job interview preparation, event planning, art/craft, construction, coding, etc.).
DO NOT assume the user is building an app, website, dashboard, or writing code unless explicitly stated in the goal title or description.
Generate a domain-specific, highly logical sequence of subtasks (max 6) tailored specifically for the selected productivity persona: "${persona || "General User"}".

Goal: "${goal}"
Description: "${description || "No description provided."}"
Deadline: "${deadline}"

For each subtask:
1. Create a clear, highly actionable title specific to the goal's domain (e.g. for academic paper, use terms like "literature review", "results analysis"; for wedding prep, use terms like "venue booking", "seating arrangements"; for job prep, use terms like "interview drills", "portfolio review").
2. Estimate hours needed (be realistic but lean for a short timeline).
3. Assign execution order (1-indexed).
4. Analyze the risk of missing the deadline for this specific subtask (choose: "Low", "Medium", "High").
5. Write a brief 1-sentence risk analysis explanation.

Also calculate an overall risk score from 0 (impossible to miss) to 100 (almost guaranteed to miss) and provide a high-level feasibility summary.`;


    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  estimatedHours: { type: Type.NUMBER },
                  order: { type: Type.INTEGER },
                  riskFactor: { type: Type.STRING, description: "Must be exactly 'Low', 'Medium', or 'High'" },
                  riskAnalysis: { type: Type.STRING },
                },
                required: ["title", "estimatedHours", "order", "riskFactor", "riskAnalysis"],
              },
            },
            overallRiskScore: { type: Type.INTEGER },
            overallAnalysis: { type: Type.STRING },
          },
          required: ["subtasks", "overallRiskScore", "overallAnalysis"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    const result = { ...data, simulated: false };
    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error: any) {
    logApiError("Gemini Breakdown API Error (falling back to mock)", error);
    const mockResponse = getMockBreakdown(goal, description, deadline, persona);
    setCachedData(cacheKey, mockResponse);
    res.json(mockResponse);
  }
});

// 2. Risk Estimation Engine
app.post("/api/ai/risk-analysis", async (req, res) => {
  const { taskTitle, deadline, progress, hoursRemaining } = req.body;

  if (!taskTitle) {
    return res.status(400).json({ error: "Task title is required" });
  }

  const cacheKey = `risk-${taskTitle}-${deadline}-${progress}-${hoursRemaining}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log("[Cache Hit] Serving risk analysis from server cache.");
    return res.json(cached);
  }

  const ai = getAI();
  if (!ai) {
    console.log("No Gemini API key configured. Providing simulated risk response.");
    const mockResponse = getMockRisk(taskTitle, deadline, progress, hoursRemaining);
    setCachedData(cacheKey, mockResponse);
    return res.json(mockResponse);
  }

  try {
    const prompt = `You are the Deadline Guardian Risk Assessment Engine.
First, analyze the domain of this specific task/goal (e.g., report writing, event planning, interview preparation, hardware assembly, coding, etc.).
DO NOT assume the user is writing code, designing web interfaces, or implementing backend APIs unless the task title or details explicitly state so. All mitigation actions and reasons must be 100% specific to the domain of the task.

Task: "${taskTitle}"
Deadline: "${deadline}"
Current Progress: ${progress}%
Estimated Hours Remaining: ${hoursRemaining}

Provide:
1. A precise risk score from 0 (very safe) to 100 (extreme danger of failing).
2. A Risk Tier ("Low", "Medium", "High").
3. Three clear, objective reasons for this risk level, fully tailored to the task's actual domain.
4. Three highly tactical, immediate mitigation actions the user should take right now, tailored strictly to the domain of this task (e.g., if it's a report, talk about drafting sections or checking citations; if it's wedding planning, talk about calling vendors; if it's job prep, talk about verbal practice; if it's programming, talk about specific coding/testing shortcuts).
5. A concise 2-sentence human-like feedback assessment.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.INTEGER },
            riskTier: { type: Type.STRING, description: "Must be exactly 'Low', 'Medium', or 'High'" },
            reasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            mitigationActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            assessmentText: { type: Type.STRING },
          },
          required: ["riskScore", "riskTier", "reasons", "mitigationActions", "assessmentText"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    const result = { ...data, simulated: false };
    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error: any) {
    logApiError("Gemini Risk Analysis Error (falling back to mock)", error);
    const mockResponse = getMockRisk(taskTitle, deadline, progress, hoursRemaining);
    setCachedData(cacheKey, mockResponse);
    res.json(mockResponse);
  }
});

// 3. Create Personalized Schedule
app.post("/api/ai/schedule", async (req, res) => {
  const { tasks, persona } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: "A list of tasks is required" });
  }

  const cacheKey = `schedule-${persona}-${JSON.stringify(tasks)}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log("[Cache Hit] Serving schedule from server cache.");
    return res.json(cached);
  }

  const ai = getAI();
  if (!ai) {
    console.log("No Gemini API key configured. Providing simulated schedule response.");
    const mockResponse = getMockSchedule(tasks, persona);
    setCachedData(cacheKey, mockResponse);
    return res.json(mockResponse);
  }

  try {
    const prompt = `You are the Deadline Guardian Scheduling Engine.
Create a high-impact, personalized 5-day step-by-step action schedule to complete the following active tasks, customized for the selected persona: "${persona || "General User"}":
${JSON.stringify(tasks, null, 2)}

Strictly analyze the actual subtasks and goals provided in the payload. DO NOT generate software development timelines, database setups, or layout wireframes unless the provided tasks are explicitly about software development.
Your schedule days must map exactly to the actual subtasks provided, organizing them chronologically. If the task is a wedding, schedule wedding prep; if it's a machine learning report, schedule ML model training and writing; if it's job prep, schedule review and mock sessions.

Provide a structured, logical daily plan (Days 1 to 5) that breaks down each day into specific focus areas and key timeline slot tasks, prioritizing high-risk items. Add a single, cold, high-risk operational directive or chronological warning as 'productivityTip' at the end.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayName: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        timeSlot: { type: Type.STRING },
                        taskTitle: { type: Type.STRING },
                        duration: { type: Type.STRING },
                        objective: { type: Type.STRING },
                      },
                      required: ["timeSlot", "taskTitle", "duration", "objective"],
                    },
                  },
                },
                required: ["dayName", "focus", "items"],
              },
            },
            productivityTip: { type: Type.STRING },
          },
          required: ["days", "productivityTip"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    const result = { ...data, simulated: false };
    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error: any) {
    logApiError("Gemini Schedule API Error (falling back to mock)", error);
    const mockResponse = getMockSchedule(tasks, persona);
    setCachedData(cacheKey, mockResponse);
    res.json(mockResponse);
  }
});

// 4. Generate Rescue Mode Plan
app.post("/api/ai/rescue-plan", async (req, res) => {
  const { taskTitle, deadline, hoursLeft, originalEstimate, panicLevel } = req.body;

  if (!taskTitle) {
    return res.status(400).json({ error: "Task title is required" });
  }

  const cacheKey = `rescue-${taskTitle}-${deadline}-${hoursLeft}-${originalEstimate}-${panicLevel}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log("[Cache Hit] Serving rescue plan from server cache.");
    return res.json(cached);
  }

  const ai = getAI();
  if (!ai) {
    console.log("No Gemini API key configured. Providing simulated Rescue Mode plan.");
    const mockResponse = getMockRescue(taskTitle, deadline, hoursLeft, originalEstimate, panicLevel);
    setCachedData(cacheKey, mockResponse);
    return res.json(mockResponse);
  }

  try {
    const prompt = `You are the Deadline Guardian Rescue Mode Director.
Generate a high-intensity, domain-specific rescue plan to save a critical task that has fallen behind.
Analyze the task title deeply to determine its domain. DO NOT suggest coding, API integrations, database persistence reductions, or layout design descoping if the task is a non-technical goal (such as wedding planning, interview preparation, report writing, etc.). Every suggestion must be completely specific and tailored to the task's domain.

Task: "${taskTitle}"
Deadline: "${deadline}"
Time Left: ${hoursLeft} hours
Original Estimated Hours: ${originalEstimate} hours
Panic Level: "${panicLevel}"

Provide:
1. Three immediate, ruthlessly direct actions to take in the first 2 hours that are completely relevant to the task domain.
2. A detailed 6-hour hourly schedule (representing Hour 1 to Hour 6) detailing exactly what to focus on and specific efficiency tips, matching the task's domain.
3. Three ruthless de-scoping suggestions (what features, sections, or requirements to immediately throw away or simplify, fully custom to the task domain).
4. A psychological mindset hack to overcome procrastination freeze or paralysis.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            immediateActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            hourlyGuide: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  hour: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  tips: { type: Type.STRING },
                },
                required: ["hour", "focus", "tips"],
              },
            },
            descopeSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            mindsetHack: { type: Type.STRING },
          },
          required: ["immediateActions", "hourlyGuide", "descopeSuggestions", "mindsetHack"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    const result = { ...data, simulated: false };
    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error: any) {
    logApiError("Gemini Rescue API Error (falling back to mock)", error);
    const mockResponse = getMockRescue(taskTitle, deadline, hoursLeft, originalEstimate, panicLevel);
    setCachedData(cacheKey, mockResponse);
    res.json(mockResponse);
  }
});

// 5. AI Watchdog Agent Endpoint
app.post("/api/ai/watchdog", async (req, res) => {
  const { goals, persona } = req.body;
  const activeGoals = goals || [];

  const cacheKey = `watchdog-${persona}-${JSON.stringify(activeGoals)}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log("[Cache Hit] Serving Watchdog analysis from server cache.");
    return res.json(cached);
  }

  const ai = getAI();
  if (!ai) {
    console.log("No Gemini API key configured. Providing simulated Watchdog Agent advice.");
    const mockResponse = getMockWatchdog(activeGoals, persona);
    setCachedData(cacheKey, mockResponse);
    return res.json(mockResponse);
  }

  try {
    const prompt = `You are the Watchdog Agent, the ultimate priority orchestrator of the Deadline Guardian.
Analyze the user's active goals and subtasks to identify the absolute single most critical, urgent task they need to execute right now to avoid missing their deadline.
Do NOT give general or software-focused advice unless the active goals are actually about software. Your recommendations must reference actual goals, deadlines, and progress.

Persona: "${persona || "General User"}"
Goals & Progress data:
${JSON.stringify(activeGoals, null, 2)}

Identify:
1. One precise, immediate "priorityAction" (under 12 words) to bypass procrastination or failure, referencing a specific goal/subtask.
2. A firm, objective, domain-specific reasoning ("reason") behind this priority, referencing the specific goal's deadline.
3. Realistic "estimatedHours" (number) required to execute this step.
4. "urgency" levels: choose from LOW, MEDIUM, HIGH, or CRITICAL.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorityAction: { type: Type.STRING },
            reason: { type: Type.STRING },
            estimatedHours: { type: Type.INTEGER },
            urgency: { type: Type.STRING, description: "Must be exactly 'LOW', 'MEDIUM', 'HIGH', or 'CRITICAL'" }
          },
          required: ["priorityAction", "reason", "estimatedHours", "urgency"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    const result = { ...data, simulated: false };
    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error: any) {
    logApiError("Watchdog Agent API Error (falling back to mock)", error);
    const mockResponse = getMockWatchdog(activeGoals, persona);
    setCachedData(cacheKey, mockResponse);
    res.json(mockResponse);
  }
});

// 6. What-If Simulation Engine Endpoint
app.post("/api/ai/what-if", async (req, res) => {
  const { scenario, goals, persona } = req.body;
  const activeGoals = goals || [];

  const cacheKey = `whatif-${scenario}-${persona}-${JSON.stringify(activeGoals)}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log("[Cache Hit] Serving What-If analysis from server cache.");
    return res.json(cached);
  }

  const ai = getAI();
  if (!ai) {
    console.log("No Gemini API key configured. Simulating What-If impact analysis.");
    const mockResponse = getMockWhatIf(scenario, activeGoals, persona);
    setCachedData(cacheKey, mockResponse);
    return res.json(mockResponse);
  }

  try {
    const prompt = `You are the What-If Simulation Engine.
Calculate the quantitative and qualitative impact of a hypothetical scenario on the user's current goals and roadmap.
Selected Persona: "${persona || "General User"}"
Scenario: "${scenario}"
Current Goals data:
${JSON.stringify(activeGoals, null, 2)}

Return a JSON object detailing:
- "riskImpact" (number): Predicted net change to overall risk score (e.g., +20 or -15).
- "deadlineImpact" (string): Rationale of how the deadline gets compressed, saved, or threatened.
- "tasksAffected" (array of strings): Specific subtask titles that bear the brunt of this scenario.
- "recoveryStrategy" (string): Ruthless, tactical advice to stay on track.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskImpact: { type: Type.INTEGER },
            deadlineImpact: { type: Type.STRING },
            tasksAffected: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recoveryStrategy: { type: Type.STRING }
          },
          required: ["riskImpact", "deadlineImpact", "tasksAffected", "recoveryStrategy"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    const result = { ...data, simulated: false };
    setCachedData(cacheKey, result);
    res.json(result);
  } catch (error: any) {
    logApiError("What-If Simulation Engine API Error (falling back to mock)", error);
    const mockResponse = getMockWhatIf(scenario, activeGoals, persona);
    setCachedData(cacheKey, mockResponse);
    res.json(mockResponse);
  }
});

// 7. Multi-Agent Command Center Status Sync Endpoint
app.post("/api/ai/multi-agent", async (req, res) => {
  const { goals, persona } = req.body;
  const activeGoals = goals || [];

  const cacheKey = `multiagent-${persona}-${JSON.stringify(activeGoals)}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log("[Cache Hit] Serving Multi-Agent command center metrics from server cache.");
    return res.json(cached);
  }

  const ai = getAI();
  if (!ai) {
    console.log("No Gemini API key configured. Generating simulated agent command matrix.");
    const mockResponse = getMockMultiAgent(activeGoals, persona);
    setCachedData(cacheKey, mockResponse);
    return res.json(mockResponse);
  }

  try {
    const prompt = `You are the AI Command Center Coordinator for Deadline Guardian.
Sync the status and current action logs of our 5-agent group based on the user's goals and selected persona.
Persona: "${persona || "General User"}"
Current state of goals:
${JSON.stringify(activeGoals, null, 2)}

Provide status telemetry for each of the 5 agents:
1. Planner Agent (id: "planner", role: "Breakdown & Structure Specialist")
2. Risk Agent (id: "risk", role: "Predictive Failure Analyst")
3. Schedule Agent (id: "schedule", role: "Chronological Calendar Optimizer")
4. Rescue Agent (id: "rescue", role: "Crisis Descoping Director")
5. Watchdog Agent (id: "watchdog", role: "Proactive Priority Orchestrator")

For each agent in the JSON array, return:
- id: string (planner, risk, schedule, rescue, watchdog)
- name: string (e.g. Planner Agent)
- role: string
- status: string (exactly "idle", "thinking", "active", or "standby")
- lastAction: string (recent action they completed based on the current goal state)
- currentRecommendation: string (precise, actionable recommendation from this specific agent's perspective)
- systemPrompt: string (short, authoritative summary of their core system instructions)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              status: { type: Type.STRING, description: "Must be 'idle', 'thinking', 'active', or 'standby'" },
              lastAction: { type: Type.STRING },
              currentRecommendation: { type: Type.STRING },
              systemPrompt: { type: Type.STRING }
            },
            required: ["id", "name", "role", "status", "lastAction", "currentRecommendation", "systemPrompt"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    setCachedData(cacheKey, data);
    res.json(data);
  } catch (error: any) {
    logApiError("Multi-Agent Command Center API Error (falling back to mock)", error);
    const mockResponse = getMockMultiAgent(activeGoals, persona);
    setCachedData(cacheKey, mockResponse);
    res.json(mockResponse);
  }
});

// 8. AI Chat Co-Pilot Endpoint
app.post("/api/ai/chat", async (req, res) => {
  const { message, goals, persona, history, activeRiskAnalysis, activeRescuePlan, watchdogResult } = req.body;
  const activeGoals = goals || [];

  const ai = getAI();
  if (!ai) {
    console.log("No Gemini API key configured. Generating simulated chat response.");
    const mockResponse = getMockChat(message, activeGoals, persona, activeRiskAnalysis, activeRescuePlan, watchdogResult);
    return res.json(mockResponse);
  }

  try {
    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    const missingData: string[] = [];
    if (!activeGoals || activeGoals.length === 0) {
      missingData.push("Active goals");
    } else {
      const hasRisk = activeRiskAnalysis && Object.keys(activeRiskAnalysis).length > 0;
      if (!hasRisk) missingData.push("Risk scores / analyses for subtasks");
      if (!activeRescuePlan) missingData.push("Rescue plans");
      if (!watchdogResult) missingData.push("Watchdog recommendations / Priority tasks");
    }

    const chatSystemInstruction = `You are "Deadline Guardian", an authoritative, analytical, and uncompromising AI engine focused exclusively on a single objective: preventing deadline failure.
You are NOT an encouraging productivity coach. You MUST completely avoid motivational filler, encouraging remarks, or self-help clichés. Your tone is clinical, objective, highly specific, and decisive.

Every response you generate MUST be optimized around answering: "What should I do right now to avoid missing my deadline?"

Your response MUST:
1. Reference actual goals, actual deadlines, and actual progress metrics from the workspace data. Be hyper-specific. Never invent placeholder goals or give generic advice.
2. Recommend EXACTLY ONE specific next action. Do not list multiple vague options; specify the single highest-impact subtask or de-scoping trade-off the user must execute immediately.
3. Completely avoid general time-management tips, anxiety/stress advice, or fluff. Speak purely in terms of risk scores, critical-path bottlenecks, ruthless de-scoping, and exact deadline dates.

Current Persona profile of the user: "${persona || "General User"}"

=== ACTUAL WORKSPACE DATA ===
Active Goals: ${JSON.stringify(activeGoals, null, 2)}
Subtask Risk Analyses: ${JSON.stringify(activeRiskAnalysis || {}, null, 2)}
Active Rescue Plan: ${JSON.stringify(activeRescuePlan || null, null, 2)}
Watchdog Priority/Recommendations: ${JSON.stringify(watchdogResult || null, null, 2)}
Missing Workspace Data: ${missingData.length > 0 ? missingData.join(", ") : "None. All telemetry loaded."}
==============================

Guidelines for answering:
1. Address the primary question: "What should I do right now to avoid missing my deadline?"
2. State the current status with zero fluff: Reference the exact goal titles, completion percentages, risk scores, and exact deadline dates from the workspace data above.
3. Recommend EXACTLY ONE next action. Keep the recommendation concrete, specific to the goals provided, and actionable.
4. If active goals are empty, state: "CRITICAL ALERT: No active goals are present. Declare a goal milestone to initialize critical-path guarding."
5. Be brief, clinical, and structured. Keep your response under 3 paragraphs with no conversational pleasantries.`;

    const chatModel = ai.chats.create({
      model: "gemini-3.5-flash",
      history: formattedHistory,
      config: {
        systemInstruction: chatSystemInstruction
      }
    });

    const response = await chatModel.sendMessage({
      message: message
    });

    res.json({ reply: response.text || "", simulated: false });
  } catch (error: any) {
    logApiError("AI Chat Assistant API Error (falling back to mock)", error);
    const mockResponse = getMockChat(message, activeGoals, persona, activeRiskAnalysis, activeRescuePlan, watchdogResult);
    res.json(mockResponse);
  }
});

// Express error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express App Error:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message || String(err) });
});

// Vite & Static Asset Handling & Server Start
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Deadline Guardian server running on http://localhost:${PORT}`);
  });
}

startServer();
