# TODOS

Deferred work captured during planning and review sessions.

---

## packages/editor

### [TODO-01] Add vitest + unit tests for position-mapping.ts

**What:** Add vitest to `packages/editor` and write unit tests for `mapCorrectionToRange` and `findAllSuggestionRanges`.

**Why:** These are pure TypeScript functions with multiple subtle edge cases (multi-paragraph text, off-by-one ProseMirror positions, stale text after editing). They're invisible to debug in the browser and the easiest code in the package to test.

**Pros:** Catches offset bugs before they silently show wrong highlights in the UI.
**Cons:** Adds vitest and test infrastructure to a currently-empty package.

**Context:** Deferred during the initial editor extensions review (feat/core branch). The user chose to ship decorations first. Position-mapping is the highest-risk code in the package — a 1-char offset error highlights the wrong word. Tests go here first.

**Depends on / blocked by:** `packages/editor/src/utils/position-mapping.ts` must be implemented first.

---

### [TODO-02] Implement "Accept correction" action

**What:** Add `acceptCorrection(correction: Correction)` to `useEditorWithFeedback`. Clicking the "적용" button in the `FeedbackTooltip` replaces the highlighted text with `correction.corrected` via a ProseMirror transaction and removes that correction from the plugin state.

**Why:** Right now the tooltip is read-only — the user sees the correction but has to manually retype it. One-click acceptance is the core UX value of the feature.

**Pros:** Turns the feature from informational to actionable. High-impact, probably ~15 min with CC once decorations are working.
**Cons:** Requires a ProseMirror transaction (`tr.replaceWith(from, to, schema.text(corrected))`) and plugin state update (filter accepted correction from `corrections[]`).

**Context:** Deferred during feat/core review to keep the initial implementation focused. The infrastructure (decorations + position-mapping) must exist first.

**Depends on / blocked by:** [TODO-01 optional but recommended], FeedbackHighlight extension working.

---

### [TODO-03] Wire `useEditorWithFeedback` into apps/web DiaryEditor

**What:** Add `@langjournal/editor: workspace:*` to `apps/web/package.json`, create/update the `DiaryEditor` component to use `useEditorWithFeedback()`, and connect `entry.feedback` from `useJournal()` to `setFeedback()`.

**Why:** The editor package is only useful once apps/web uses it. The `useJournal` hook already returns `entry.feedback: FeedbackRecord | undefined` — the wiring is mostly plumbing.

**Pros:** Makes the whole feedback highlight feature visible in the actual app.
**Cons:** Touches `apps/web`, separate from `packages/editor`.

**Context:** Estimated ~30 min. Deferred during feat/core review. Also needs to: run `pnpm build` in `packages/editor` first (tsc must produce `dist/`), inject `feedbackStyles` CSS into the Next.js global stylesheet.

**Depends on / blocked by:** `packages/editor` build pipeline working (`pnpm --filter @langjournal/editor build`).

---

### [TODO-04] Handle cross-paragraph corrections

**What:** Improve `mapCorrectionToRange` to handle corrections whose `offset+length` spans a paragraph boundary in the ProseMirror document.

**Why:** Currently the validation guard (`doc.textBetween(from, to) !== correction.original`) returns `null` and silently skips the decoration. A correction that crosses a line break gets no highlight.

**Pros:** No silent skips in edge cases.
**Cons:** Adds complexity to position-mapping. Extremely rare in practice (diary entries have short sentences).

**Context:** The validation guard prevents wrong highlights (safe fail). The failure mode is invisible to the user — the correction just doesn't highlight. Acceptable for MVP. Re-visit if users report missing highlights.

**Depends on / blocked by:** [TODO-01] — this edge case is exactly what unit tests would catch.
