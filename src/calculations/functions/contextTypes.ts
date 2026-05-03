/** Test types used in analytics (CSV TEST column). */
export const TEST_TYPES = ["ACT", "SAT", "PSAT"] as const;
export type TestType = (typeof TEST_TYPES)[number];

export type StudentTestBlock = {
  studentKey: string;
  studentName: string;
  testType: TestType;
  /** All rows for this student + test type, chronological by TEST DATE. */
  rowsChrono: Record<string, string>[];
  baselineRow: Record<string, string> | null;
  /** Latest row for this test type (max TEST DATE) — tutoring, remote, sessions, etc. */
  latestRow: Record<string, string> | null;
  /** Latest row strictly after baseline date; null if no baseline or no follow-up. */
  latestAfterBaselineRow: Record<string, string> | null;
  improvementTotal: number | null;
  improvementVerbal: number | null;
  improvementMath: number | null;
  baselineTotal: number | null;
  latestTotal: number | null;
  baselineVerbal: number | null;
  latestVerbal: number | null;
  baselineMath: number | null;
  latestMath: number | null;
  progression: { testDate: string; total: number }[];
  tutoringHours: number | null;
  remotePct: number | null;
  gradYear: number | null;
  /** Prep start used for prep length (manager first session if chosen, else first session). */
  firstSession: string;
  lastSession: string;
  prepLengthWeeks: number | null;
  numTests: number | null;
  /** COMPLETION from latest row for this test type. */
  completion: string;
};

/** One row per student (all tests combined). */
export type StudentRollup = {
  studentKey: string;
  studentName: string;
  latestRowGlobal: Record<string, string> | null;
  /** COMPLETION from globally latest row by TEST DATE — student-level completion. */
  completion: string;
  gradYear: number | null;
};

export type StudentAnalyticsContext = {
  blocks: StudentTestBlock[];
  rollups: StudentRollup[];
  mergedRowCount: number;
};

export type StatJobResult = { summary: string; data: unknown };
