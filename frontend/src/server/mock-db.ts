/*
  Mock backend — server-side in-memory store shared by the /api/v1 route handlers.

  This is a stand-in for the FastAPI + Postgres backend from the spec. It lives
  on the Next.js server (not the browser), so the frontend talks to it over real
  HTTP via lib/api.ts — exactly how it will talk to the real backend. The only
  thing that changes on cutover is the base URL.

  State is a module-level singleton: it survives between requests but resets when
  the dev server restarts. That is deliberate — a demo mock, not a database.
*/
import type {
  EducationEntry,
  Match,
  Profile,
  Topic,
} from "@/lib/types";

function emptyProfile(): Profile {
  return {
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    links: { linkedin: "", github: "", website: "" },
    summary: "",
    education: [],
    skills: [],
  };
}

// --- Seed data ------------------------------------------------------------
// Realistic sample state so the UI shows something on first load instead of
// empty fields. In the real backend this comes from the user's own database;
// here it just primes the in-memory store.

function seedProfile(): Profile {
  return {
    fullName: "Ada Moreira",
    headline: "AI Engineer",
    email: "ada.moreira@example.com",
    phone: "+55 11 98888-0000",
    location: "São Paulo, Brazil",
    links: {
      linkedin: "linkedin.com/in/adamoreira",
      github: "github.com/adamoreira",
      website: "adamoreira.dev",
    },
    summary:
      "AI engineer with 5 years building retrieval and NLP systems in production. I turn messy data into reliable pipelines and ship LLM features end to end.",
    education: [
      {
        id: "edu_seed_1",
        school: "University of São Paulo",
        degree: "BSc Computer Science",
        years: "2016–2020",
      },
    ],
    skills: ["Python", "PyTorch", "RAG", "FastAPI", "Postgres", "AWS"],
  };
}

function seedTopics(): Topic[] {
  return [
    {
      id: "topic_seed_1",
      recordingId: null,
      sourceFileName: "support-copilot.m4a",
      title: "Support search copilot",
      situation:
        "Our support team was drowning in repeat tickets and answers were scattered across old threads and docs.",
      task: "I was asked to cut response time without hiring more agents.",
      action:
        "I built a RAG assistant over the help centre and past tickets with pgvector, and wired it into the agent console.",
      result:
        "Median first-response time dropped from 9 hours to under 1, and deflection rose to 38% of incoming tickets.",
      status: "saved",
    },
    {
      id: "topic_seed_2",
      recordingId: null,
      sourceFileName: "transcription-pipeline.m4a",
      title: "Audio transcription pipeline",
      situation:
        "A client needed thousands of hours of call recordings turned into searchable text, but files kept failing silently.",
      task: "I owned making ingestion reliable and idempotent.",
      action:
        "I chunked long audio into 30s windows, ran a Whisper-family model with retries, and stitched segments with timestamps.",
      result:
        "Processing success went from 71% to 99.4% and a 5-minute file finishes in under 90 seconds.",
      status: "saved",
    },
    {
      id: "topic_seed_3",
      recordingId: null,
      sourceFileName: "cost-dashboard.m4a",
      title: "Per-feature cost logging",
      situation:
        "Model spend was a single opaque bill and nobody knew which feature was expensive.",
      task: "I needed to make cost per action visible to the team.",
      action:
        "I logged tokens and audio minutes per user per action and built a dashboard that attributes spend to each feature.",
      result:
        "We identified one endpoint driving 60% of cost and cut the monthly bill by 35% after optimising it.",
      status: "saved",
    },
  ];
}

interface MockDB {
  savedTopics: Topic[];
  profile: Profile;
  seq: number;
}

// globalThis pin so hot-reload in dev doesn't wipe the store on every edit.
const g = globalThis as unknown as { __resumeAiDB?: MockDB };
const db: MockDB =
  g.__resumeAiDB ??
  (g.__resumeAiDB = {
    savedTopics: seedTopics(),
    profile: seedProfile(),
    seq: 0,
  });

function id(prefix: string): string {
  db.seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${db.seq}`;
}

/** Pool of AI-drafted STAR topics returned for newly "transcribed" files. */
const DRAFT_POOL: Omit<Topic, "id" | "recordingId" | "sourceFileName" | "status">[] = [
  {
    title: "Fraud detection model",
    situation:
      "Chargebacks were climbing and the rules engine flagged too many good customers.",
    task: "I was asked to raise precision without hurting recall.",
    action:
      "I trained a gradient-boosted model on transaction features and shadow-tested it against the live rules for a month.",
    result:
      "False positives fell 42% while catching 12% more real fraud, saving about R$300k a quarter.",
  },
  {
    title: "Onboarding redesign",
    situation:
      "New users dropped off before reaching the core feature of the product.",
    task: "I led the work to get more users to their first success faster.",
    action:
      "I rebuilt onboarding into three guided steps and instrumented each with events to find the drop-off.",
    result:
      "Activation rose from 24% to 41% within two release cycles.",
  },
  {
    title: "Data pipeline migration",
    situation:
      "Nightly batch jobs were brittle and often finished after business hours started.",
    task: "I owned moving us to a streaming pipeline with no downtime.",
    action:
      "I migrated the ETL to incremental streaming and added idempotent retries and alerting.",
    result:
      "Data freshness went from 8 hours to under 5 minutes and on-call pages dropped by 70%.",
  },
];

// --- Topics ---------------------------------------------------------------

export function listSaved(): Topic[] {
  return db.savedTopics;
}

export function saveDrafts(drafts: Topic[]): number {
  const saved = drafts.map((t) => ({
    ...t,
    id: t.id || id("topic"),
    status: "saved" as const,
  }));
  db.savedTopics.push(...saved);
  return saved.length;
}

export function deleteTopic(topicId: string): void {
  db.savedTopics = db.savedTopics.filter((t) => t.id !== topicId);
}

/** Produce AI-drafted STAR topics for uploaded files (real path: transcribe+structure). */
export function draftForFiles(files: { id: string; fileName: string }[]): Topic[] {
  return files.map((f, i) => {
    const sample = DRAFT_POOL[i % DRAFT_POOL.length];
    return {
      id: id("topic"),
      recordingId: f.id,
      sourceFileName: f.fileName,
      ...sample,
      status: "draft" as const,
    };
  });
}

// --- Matching -------------------------------------------------------------

export function matchTopics(jobDescription: string, topN: number): Match[] {
  void jobDescription; // real path embeds this and scores by cosine similarity
  return db.savedTopics.slice(0, topN).map((t, i) => ({
    id: id("match"),
    topicId: t.id,
    topicTitle: t.title || "Untitled topic",
    roleOrProject: t.title || "Role or project",
    score: Math.max(0.5, 0.95 - i * 0.08),
    bullets: toResumeBullets(t),
    included: true,
  }));
}

/**
 * Rewrite a STAR topic as 2–4 resume bullets (action verb + what + measurable
 * result). Mock heuristic: pair the action with the result, then add the task as
 * context. The real path asks an LLM to do this against the job's keywords.
 */
function toResumeBullets(t: Topic): string[] {
  const bullets: string[] = [];
  if (t.action && t.result) {
    bullets.push(`${t.action.replace(/\.$/, "")}, ${lowerFirst(t.result)}`);
  } else if (t.action) {
    bullets.push(t.action);
  }
  if (t.result && !bullets.some((b) => b.includes(t.result))) {
    bullets.push(t.result);
  }
  if (t.task) bullets.push(t.task);
  return bullets.filter(Boolean).slice(0, 4);
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

// --- Profile --------------------------------------------------------------

export function getProfile(): Profile {
  return db.profile;
}

export function putProfile(profile: Profile): Profile {
  const education: EducationEntry[] = (profile.education ?? []).map((e) => ({
    ...e,
    id: e.id || id("edu"),
  }));
  db.profile = { ...emptyProfile(), ...profile, education };
  return db.profile;
}
