# Calculations reference

This document describes every stats job, how data is derived once and reused, and how jobs relate to each other. Implementation lives under `src/calculations/`.

## Shared context (`buildStudentTestAnalytics`)

**File:** `functions/buildContext.ts`

One pass over the **merged** CSV rows (after pipeline column + non-empty filters) produces:

- **`StudentRollup`** — one per student (LAST + FIRST). **Completion** and **grad year** for “per student” rates use the **globally latest row** (max `TEST DATE` across all test types).
- **`StudentTestBlock`** — one per **(student, test type)** where `TEST ∈ { ACT, SAT, PSAT }` and at least one row exists for that pair.

For each block:

| Concept | Rule |
| --- | --- |
| Rows over time | All rows for that student + type, sorted by `TEST DATE` (supports trajectories). |
| Baseline | Among those rows, rows with non-empty `BASELINE` after trim; **earliest** `TEST DATE`. |
| Latest row (attributes) | Row with **latest** `TEST DATE` for that type — tutoring hours, `%REMOTE`, sessions, `NUM TESTS`, completion label for that track, grad year for bucket stats. |
| Latest-after-baseline | Latest row with `TEST DATE` **strictly after** baseline date — used with baseline row for **score improvements** and “latest” totals in improvement lists. |
| Prep length (weeks) | **Prep start** uses **MANAGER FIRST SESSION** or **FIRST SESSION** (not both required): per row, manager wins if non-empty, else first session. Scan for the first non-empty prep start on that test type’s rows **chronologically**; **LAST SESSION** = last non-empty scanning **backward**. If still missing, the same scan runs across **all rows for that student** (any test). If **no** prep start is found after that, **prep length is not computed** (`null`). Calendar day difference, **÷ 7, round up**. If **LAST SESSION** is empty but prep start is set, the end date is the **local calendar date of the current stats run** (whenever the pipeline last executed for the active selection). |
| Progression series | Every row for that type with a parseable **TOTAL** and non-empty date → `{ testDate, total }[]` in order. |

**Reuse:** Registered stats read this context only. There is **no** second baseline/latest pass inside individual jobs.

## Pipeline grouping (`runStats`)

**File:** `pipeline.ts`

Stats that share the same `requiredFields` and `requiredNonEmptyFields` share one **merge** and one **`buildStudentTestAnalytics`** call. Today **all** jobs share **`STATS_REQUIRED_FIELDS`** (headers `buildContext` expects except **MANAGER FIRST SESSION** / **FIRST SESSION**, which may be missing on the file) and the same non-empty rule (`LAST NAME`, `FIRST NAME`, `TEST`, `TEST DATE`), so there is **one** context build per **`runStats`** invocation.

**Student filtering:** After merge and non-empty filtering, **`runStats`** may restrict rows with **`includeStudentKeys`** (student keys in the same format **`buildContext`** uses). Only matching rows reach **`buildStudentTestAnalytics`**; every job shares that cohort. Omitting **`includeStudentKeys`** or supplying an empty set keeps all merged students.

**Invocation timing:** Runs are triggered when application state (**`StatsPageContext`**) updates included files, parsed **`datasets`**, or the effective student cohort; overlapping async executions are superseded via a generation counter.

Each job returns **`{ summary, data }`**. **`StatRunResult`** pairs those with **`statId`**, **`label`**, and **`contributingFiles`**.

---

## Job index (23)

### Score (3)

| `id` | What `data` is |
| --- | --- |
| `score_improvement_sections_per_track` | Points with `studentName`, `testType`, **`section`** (`TOTAL` \| `VERBAL` \| `MATH`), **`baseline`**, **`delta`** (eligible rows match the former per-track jobs). |
| `score_progression_per_track` | `points[]` of `{ testDate, total }` per student per type (all scored points). |
| `score_improvement_by_grad_year` | Buckets: `gradYear`, `testType`, `avgImprovement`, `studentCount` (TOTAL improvement; grad year from **latest row for that type**). |

**Shared:** Baseline / latest-after-baseline and improvement fields on each block.

---

### Tutoring (3)

| `id` | `data` |
| --- | --- |
| `tutoring_hours_vs_improvement_scatter` | Points: `studentName`, `tutoringHours`, `improvement`, `testType`. |
| `tutoring_avg_hours_by_test_type` | `testType`, `avgHours`, `studentCount`. |
| `tutoring_avg_hours_by_completion` | `completion` label, `avgHours`, `studentCount`. |

**Shared:** `tutoringHours` and `improvementTotal` on blocks.

---

### Remote % (3)

| `id` | `data` |
| --- | --- |
| `remote_vs_improvement_sections_scatter` | Rows: `remotePercent`, **`delta`**, **`section`** (`TOTAL` \| `VERBAL` \| `MATH`), `studentName`, `testType` (each section emitted when improvement exists). |
| `remote_vs_prep_length_scatter` | `remotePercent`, `prepLengthWeeks`, `testType`. |
| `remote_avg_improvement_by_bucket` | For each ACT/SAT/PSAT, buckets `0%`, `1–25%`, …: `testType`, `bucket`, `avgImprovement`, `studentCount`. |

**Shared:** `remotePct`, improvements, prep weeks from blocks.

---

### Prep length (4)

| `id` | `data` |
| --- | --- |
| `prep_length_vs_improvement_scatter` | `prepLengthWeeks`, `improvement`, `testType`. |
| `prep_avg_weeks_by_test_type` | `testType`, `avgPrepWeeks`, `studentCount`. |
| `prep_avg_weeks_by_grad_year` | `gradYear`, `avgPrepWeeks`, `studentCount`. |
| `prep_length_vs_tutoring_hours_scatter` | `prepLengthWeeks`, `tutoringHours`, `studentName`, `testType` (**one point per block**). |

---

### Number of tests (2)

| `id` | `data` |
| --- | --- |
| `num_tests_vs_improvement_scatter` | `numTests`, `improvement`, `testType`. |
| `num_tests_avg_improvement_by_bucket` | For each ACT/SAT/PSAT, buckets `1`…`4`, `5+`: `testType`, `bucket`, `avgImprovement`, `studentCount`. |

`NUM TESTS` is read from the **latest row for that test type**.

---

### Completion (4)

| `id` | `data` |
| --- | --- |
| `completion_rate_overall` | `complete`, `incomplete`, `completionRate` — **counts are students** (rollup completion from global latest row). |
| `completion_rate_by_grad_year` | Per grad year (rollup). |
| `completion_rate_by_test_type` | Per type: **counts student–test tracks** using each block’s completion (latest row for that type). |
| `completion_avg_improvement_by_label` | `testType`, completion **label**, `avgImprovement`, `studentCount`. |

**Shared:** `isCompleteCompletion` → `COMPLETION === "Complete"` (exact trim).

---

### Distributions (3)

| `id` | `data` |
| --- | --- |
| `distribution_baseline_total_by_test_type` | `scores: number[]` per `testType` (baseline TOTAL per block). |
| `distribution_latest_total_by_test_type` | Latest-row TOTAL per block. |
| `distribution_improvements_by_test_type` | Array of `{ testType, improvements: number[] }` (TOTAL delta per qualifying block). |

---

### Summary (1)

| `id` | `data` |
| --- | --- |
| `summary_headline_by_test_type` | One row per ACT/SAT/PSAT: `studentCount`, `avgBaselineTotal`, `avgLatestTotal`, `avgImprovement`, `avgTutoringHours`, `avgPrepWeeks`, `completionRate` (tracks with that type). |

`avgLatestTotal` uses **latest row TOTAL** for every block of that type, not only post-baseline rows.

---

## Related metric groups

- **Section improvements** (`score_improvement_sections_per_track`, `remote_vs_improvement_sections_scatter`) share TOTAL / verbal / math fields with **distribution** and **summary**.
- **Remote** scatters share `remotePct` with **remote buckets** and **summary** indirectly.
- **Prep** scatters share `prepLengthWeeks` with **remote vs prep** and **prep vs tutoring**.
- **Completion** overall vs by grad year share **rollups**; by test type uses **blocks**.

## File map

| Path | Role |
| --- | --- |
| `fields.ts` | CSV header constants. |
| `pipeline.ts` | Merge, filter, group stats, build context once per group, run jobs. |
| `stats/types.ts` | `StatConfig`, shared required field lists. |
| `stats/registry.ts` | All `STATS` definitions (see job index below). |
| `functions/buildContext.ts` | `buildStudentTestAnalytics`. |
| `functions/utils.ts` | Parsing, `mean`, prep weeks, completion check. |
| `functions/derive*.ts` | Pure functions: context → `{ summary, data }`. |
