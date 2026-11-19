import type { SkillPath } from "@/lib/knowledge/types";

export const skillPaths: SkillPath[] = [
  {
    id: "planning-get-started",
    title: "Get started with Sage Planning",
    summary: "Orient in the app, open a plan, and find the right Help hub.",
    audience: "New Planning users and FP&A analysts",
    goal: "Open a plan confidently and know where Help lives",
    estimatedMinutes: 20,
    difficulty: "introductory",
    completionCriteria:
      "You can open a recent plan and name the Home / Plans / Settings areas.",
    steps: [
      {
        conceptId: "sage-planning",
        rationale: "Know what Planning is before you click into a plan.",
        practiceQuery: "What is Sage Planning?",
      },
      {
        conceptId: "navigate-planning",
        rationale: "Learn the SPA chrome so screen Help matches where you are.",
        practiceQuery: "How do I navigate Sage Planning?",
      },
      {
        conceptId: "plans-and-versions",
        rationale: "Open or create the plan you will work in.",
        practiceQuery: "How do I create or open a plan in Sage Planning?",
      },
    ],
  },
  {
    id: "create-forecast",
    title: "Create a forecast",
    summary: "From a plan version to a forecast with actuals.",
    audience: "FP&A who own the forecast cycle",
    goal: "Create a forecast on a plan version",
    estimatedMinutes: 30,
    difficulty: "intermediate",
    completionCriteria: "You can describe the forecast flow from Help and try it on a plan.",
    steps: [
      {
        conceptId: "plans-and-versions",
        rationale: "Forecasts sit on plan versions.",
        practiceQuery: "How do I create a plan version?",
      },
      {
        conceptId: "forecasts",
        rationale: "Create the forecast and bring in actuals.",
        practiceQuery: "How do I create a forecast in Sage Planning?",
      },
      {
        conceptId: "formulas-and-data",
        rationale: "Refine numbers with formulas and data.",
        practiceQuery: "How do I add formulas in a Sage Planning plan?",
      },
    ],
  },
  {
    id: "workforce-plan",
    title: "Plan workforce costs",
    summary: "Use workforce planning for headcount and people costs.",
    audience: "FP&A and people-cost owners",
    goal: "Open workforce planning on a plan and find salary/headcount Help",
    estimatedMinutes: 25,
    difficulty: "intermediate",
    completionCriteria: "You can open /workforce on a plan and locate workforce Help.",
    steps: [
      {
        conceptId: "plans-and-versions",
        rationale: "Workforce lives inside a plan.",
        practiceQuery: "How do I open a plan in Sage Planning?",
      },
      {
        conceptId: "workforce-planning",
        rationale: "Plan headcount, salaries, and benefits.",
        practiceQuery: "What is workforce planning in Sage Planning?",
      },
      {
        conceptId: "manage-and-share",
        rationale: "Share and review workforce inputs with stakeholders.",
        practiceQuery: "How do I share a plan version in Sage Planning?",
      },
    ],
  },
];
