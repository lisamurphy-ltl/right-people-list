// The Right-People List — ICP Discovery Questionnaire
// Source: Limited to Limitless "ICP Discovery Questionnaire — LinkedIn Match Edition"
// 18 questions across 5 sections. Every single/multi question carries an Other box.

export type QuestionType = "single" | "multi" | "short" | "long";

export type Answers = Record<string, string | string[] | undefined>;

export interface Question {
  id: string;
  section: "A" | "B" | "C" | "D" | "E";
  label: string;
  prompt?: string;
  type: QuestionType;
  options?: string[];
  otherEnabled?: boolean;
  otherLabel?: string;
  otherRequired?: boolean;
  maxSelections?: number;
  warnAtSelections?: number;
  charLimit?: number;
  required?: boolean;
  showIf?: (a: Answers) => boolean;
}

export const SECTIONS: { id: Question["section"]; title: string; blurb: string }[] = [
  { id: "A", title: "The Ground Truth", blurb: "Three questions that keep the rest of the answers honest." },
  { id: "B", title: "The Company", blurb: "Firmographics — industry, size, location, timing." },
  { id: "C", title: "The Person", blurb: "Who actually signs off on hiring you." },
  { id: "D", title: "The Pain & The Trigger", blurb: "What makes them start looking, in their own words." },
  { id: "E", title: "The Filter", blurb: "Who to say no to — even if they can pay." },
];

export const QUESTIONS: Question[] = [
  // ── SECTION A — THE GROUND TRUTH ─────────────────────────────────────────
  {
    id: "q1", section: "A", type: "long", required: true, charLimit: 1000,
    label: "List your three best clients — the ones you'd clone if you could. What do they have in common?",
    prompt: "Name them. Then tell me what's actually the same about them — revenue, industry, the person you deal with, the problem they came in with, how they make decisions.",
  },
  {
    id: "q2", section: "A", type: "long", required: true, charLimit: 1000,
    label: "List your three worst-fit clients. What did they have in common?",
    prompt: "Not the ones who were rude. The ones where you did good work and it still didn't land, or the money never matched the effort.",
  },
  {
    id: "q3", section: "A", type: "long", required: true, charLimit: 1000,
    label: "What is the specific, measurable outcome you deliver?",
    prompt: "Not \"clarity.\" Not \"growth.\" A number a client could point at. Margins widened by X. Hours back per week. Close rate moved from A to B.",
  },

  // ── SECTION B — THE COMPANY ──────────────────────────────────────────────
  {
    id: "q4", section: "B", type: "multi", maxSelections: 6, warnAtSelections: 6, otherEnabled: true,
    otherLabel: "Type the industry the way LinkedIn would label it, if you know it",
    label: "What industries do your best clients operate in?",
    options: [
      "Accounting", "Architecture & Planning", "Business Consulting & Services", "Construction",
      "Design Services", "Engineering Services", "Environmental Services", "Facilities Services",
      "Financial Services", "Food & Beverage Services", "Health & Human Services", "Hospitality",
      "Human Resources Services", "Insurance", "IT Services & IT Consulting", "Law Practice / Legal Services",
      "Manufacturing", "Marketing Services", "Medical Practices", "Real Estate", "Staffing & Recruiting",
      "Transportation, Logistics, Supply Chain & Storage", "Utilities", "Veterinary Services", "Wellness & Fitness Services",
    ],
  },
  {
    id: "q5", section: "B", type: "multi", otherEnabled: true,
    label: "What is their annual revenue range?",
    options: [
      "Under $250K", "$250K – $500K", "$500K – $1M", "$1M – $2.5M", "$2.5M – $5M",
      "$5M – $10M", "$10M – $25M", "$25M – $50M", "$50M – $100M", "$100M+", "I don't know / can't tell from outside",
    ],
  },
  {
    id: "q6", section: "B", type: "multi", otherEnabled: true,
    label: "How many employees do they have?",
    options: ["1 (solo)", "2–10", "11–50", "51–200", "201–500", "501–1,000", "1,001–5,000", "5,001–10,000", "10,001+"],
  },
  {
    id: "q7", section: "B", type: "multi", otherEnabled: true,
    label: "Where are they located?",
    options: [
      "My metro area only", "My state only", "Regional — multiple states", "United States, nationwide",
      "Canada", "United Kingdom / Ireland", "Australia / New Zealand", "Anywhere English-speaking", "Global — location doesn't matter",
    ],
  },
  {
    id: "q7_metro", section: "B", type: "short",
    label: "Which metro area?",
    showIf: (a) => Array.isArray(a.q7) && a.q7.includes("My metro area only"),
  },
  {
    id: "q7_state", section: "B", type: "short",
    label: "Which state?",
    showIf: (a) => Array.isArray(a.q7) && a.q7.includes("My state only"),
  },
  {
    id: "q7_regional", section: "B", type: "short",
    label: "Which states/region?",
    showIf: (a) => Array.isArray(a.q7) && a.q7.includes("Regional — multiple states"),
  },
  {
    id: "q7_meet", section: "B", type: "single",
    label: "Does the buyer need to be able to meet you in person?",
    options: ["Yes, required", "Preferred, not required", "No, fully remote is fine"],
    otherEnabled: true,
  },
  {
    id: "q8", section: "B", type: "multi", otherEnabled: true,
    label: "What type of company are they?",
    options: [
      "Privately held", "Public company", "Partnership", "Sole proprietorship", "Family-owned / multi-generational",
      "Franchise (franchisee)", "Franchise (franchisor)", "Nonprofit", "Government agency", "Doesn't matter",
    ],
  },
  {
    id: "q9", section: "B", type: "multi", otherEnabled: true,
    label: "What growth or change signal tells you the timing is right?",
    options: [
      "Headcount grew 10%+ in the last 12 months", "Headcount grew 20%+ in the last 12 months", "Headcount is shrinking",
      "They recently hired senior leadership", "They have open roles posted right now", "They just raised money / took on investment",
      "They recently acquired or merged", "They opened a new location", "They just landed a major contract", "Timing signal doesn't matter to me",
    ],
  },
  {
    id: "q9_roles", section: "B", type: "short",
    label: "Which roles are they hiring for?",
    showIf: (a) => Array.isArray(a.q9) && a.q9.includes("They have open roles posted right now"),
  },

  // ── SECTION C — THE PERSON ───────────────────────────────────────────────
  {
    id: "q10", section: "C", type: "multi", warnAtSelections: 0, otherEnabled: true,
    otherLabel: "Add any title variants you hear in their world. The odd local ones matter — those are the ones nobody else is searching.",
    label: "What is their job title?",
    options: [
      "Owner", "Founder / Co-Founder", "CEO", "President", "COO / Chief Operating Officer", "CFO",
      "Managing Partner", "Managing Director", "Partner", "General Manager", "VP of Operations",
      "Director of Operations", "Operations Manager", "Practice Manager / Practice Administrator", "Executive Director",
    ],
  },
  {
    id: "q11", section: "C", type: "multi", otherEnabled: true,
    label: "What seniority level are they?",
    options: ["Owner / Partner", "CXO", "Vice President", "Director", "Manager", "Senior", "Entry"],
  },
  {
    id: "q12", section: "C", type: "multi", otherEnabled: true,
    label: "What function or department do they sit in?",
    options: [
      "Operations", "Business Development", "Finance", "Sales", "Human Resources", "Administrative",
      "Engineering", "Marketing", "Program & Project Management", "Purchasing", "Support",
    ],
  },
  {
    id: "q13", section: "C", type: "multi", otherEnabled: true,
    label: "How long have they been in the seat?",
    options: ["Less than 1 year", "1–2 years", "3–5 years", "6–10 years", "More than 10 years", "Doesn't matter"],
  },
  {
    id: "q13_origin", section: "C", type: "single", otherEnabled: true,
    label: "Did they build this company or inherit the seat?",
    options: ["Founded it themselves", "Bought it", "Promoted into it from inside", "Hired in from outside", "Family succession", "Doesn't matter"],
  },
  {
    id: "q14", section: "C", type: "multi", otherEnabled: true,
    label: "Who else is in the room when this decision gets made?",
    options: [
      "Nobody — they decide alone", "Spouse / life partner", "Business partner or co-founder", "CFO or bookkeeper",
      "Integrator / second-in-command", "Board or investors", "Leadership team as a group", "An outside advisor (accountant, attorney, consultant)",
    ],
  },
  {
    id: "q14_veto", section: "C", type: "short",
    label: "Which one of those can kill the deal even if your buyer wants it?",
    showIf: (a) => Array.isArray(a.q14) && a.q14.length > 0 && !(a.q14.length === 1 && a.q14[0] === "Nobody — they decide alone"),
  },

  // ── SECTION D — THE PAIN & THE TRIGGER ───────────────────────────────────
  {
    id: "q15", section: "D", type: "long", required: true, charLimit: 1000,
    label: "What is their 3 a.m. problem — in their words, not yours?",
    prompt: "The sentence they'd say out loud at 3 a.m. and never at a networking event. Use their vocabulary. If they run trucks, it's \"driver churn,\" not \"retention.\" If they run a firm, it's \"bad reviews,\" not \"client satisfaction.\"",
  },
  {
    id: "q16", section: "D", type: "multi", otherEnabled: true,
    label: "What have they already tried that didn't work?",
    options: [
      "Hired a business coach", "Hired a consultant, got a plan, never executed it", "Bought a course or program they never finished",
      "Installed an operating system (EOS, Scaling Up, etc.)", "Hired someone internally to fix it", "Read the books, tried to DIY it",
      "Threw more marketing at it", "Nothing — this is their first attempt",
    ],
  },
  {
    id: "q17", section: "D", type: "multi", otherEnabled: true,
    label: "What's the trigger event that makes them start looking?",
    options: [
      "A key person quit", "They lost a major client or contract", "Revenue is up however profit isn't",
      "They missed a deadline or blew a delivery publicly", "A health scare or burnout episode", "A partner or spouse gave them an ultimatum",
      "Year-end / new fiscal year planning", "They're preparing to sell or exit", "They're preparing to acquire", "A peer or competitor visibly pulled ahead",
    ],
  },

  // ── SECTION E — THE FILTER ───────────────────────────────────────────────
  {
    id: "q18", section: "E", type: "multi", required: true, otherEnabled: true, otherRequired: true,
    otherLabel: "Name one more. Everybody has one they haven't admitted yet.",
    label: "Who is an automatic no — even if they can pay?",
    options: [
      "Under a specific revenue floor", "Solo operators with no team", "Pre-revenue or startup stage",
      "Anyone who needs the work but can't invest in it", "Buyers who want the cheapest option",
      "Buyers who want it done for them with zero involvement", "Specific industries", "Specific geographies",
      "Anyone who's already failed with three-plus providers",
    ],
  },
  {
    id: "q18_floor", section: "E", type: "short",
    label: "What's the revenue floor?",
    showIf: (a) => Array.isArray(a.q18) && a.q18.includes("Under a specific revenue floor"),
  },
  {
    id: "q18_industries", section: "E", type: "short",
    label: "Which industries are an automatic no?",
    showIf: (a) => Array.isArray(a.q18) && a.q18.includes("Specific industries"),
  },
  {
    id: "q18_geographies", section: "E", type: "short",
    label: "Which geographies are an automatic no?",
    showIf: (a) => Array.isArray(a.q18) && a.q18.includes("Specific geographies"),
  },
];

export function questionsForSection(section: Question["section"], answers: Answers): Question[] {
  return QUESTIONS.filter((q) => q.section === section && (!q.showIf || q.showIf(answers)));
}

// Builds the plain-English one-sentence ICP recap.
// Shape: [Title] at [company type] [industry] businesses doing [revenue] with
// [headcount] employees in [geography], who [trigger event] and are losing
// sleep over [3 a.m. problem].
export function buildOneSentenceIcp(a: Answers): string {
  const titles = (a.q10 as string[] | undefined)?.filter(Boolean) ?? [];
  const companyType = (a.q8 as string[] | undefined)?.filter((v) => v && v !== "Doesn't matter") ?? [];
  const industries = (a.q4 as string[] | undefined)?.filter(Boolean) ?? [];
  const revenue = (a.q5 as string[] | undefined)?.filter((v) => v && !v.startsWith("I don't know")) ?? [];
  const headcount = (a.q6 as string[] | undefined)?.filter(Boolean) ?? [];
  const geography = (a.q7 as string[] | undefined)?.filter((v) => v && v !== "Global — location doesn't matter") ?? [];
  const triggers = (a.q17 as string[] | undefined)?.filter(Boolean) ?? [];
  const problem = (a.q15 as string | undefined)?.trim();

  const titlePart = titles.length > 0 ? titles.join("/") : "Decision-makers";
  const typePart = companyType.length > 0 ? `${companyType.join("/").toLowerCase()} ` : "";
  const industryPart = industries.length > 0 ? industries.join(", ") : "businesses";
  const revenuePart = revenue.length > 0 ? ` doing ${revenue.join(" or ")}` : "";
  const headcountPart = headcount.length > 0 ? ` with ${headcount.join(" or ")} employees` : "";
  const geoPart = geography.length > 0 ? ` in ${geography.join(", ")}` : "";
  const triggerPart = triggers.length > 0 ? `, who just experienced ${triggers.join(" or ").toLowerCase()}` : "";
  const problemPart = problem ? ` and are losing sleep over "${problem.length > 140 ? problem.slice(0, 140) + "…" : problem}"` : "";

  return `${titlePart} at ${typePart}${industryPart}${revenuePart}${headcountPart}${geoPart}${triggerPart}${problemPart}.`;
}
