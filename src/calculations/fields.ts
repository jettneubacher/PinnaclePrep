/**
 * Internal identifiers → exact CSV column headers. All stats and parsing logic
 * should use these constants; do not scatter raw header strings elsewhere.
 */
export const FIELDS = {
  LAST_NAME: "LAST NAME",
  FIRST_NAME: "FIRST NAME",
  COMPLETION: "COMPLETION",
  GRAD_YEAR: "GRAD YEAR",
  NUM_TESTS: "NUM TESTS",
  TUTORING_HOURS: "P/SAT/ACT TUTORING HOURS",
  TEST: "TEST",
  TEST_DATE: "TEST DATE",
  BASELINE: "BASELINE",
  VERBAL: "VERBAL",
  MATH: "MATH",
  TOTAL: "TOTAL",
  MANAGER_FIRST_SESSION: "MANAGER FIRST SESSION",
  FIRST_SESSION: "FIRST SESSION",
  LAST_SESSION: "LAST SESSION",
  REMOTE_PCT: "%REMOTE",
} as const;
