# Prompt: AI agent to generate exploratory release test plan

Use this prompt with an AI agent (Cursor, ChatGPT, Claude, etc.) to turn the **draft** test plan (PR inventory + placeholders) into a **full exploratory test plan** with concrete charters and verification steps.

---

## When is the plan generated?

**No es automático:** no hay workflow ni trigger. El plan se genera cuando alguien ejecuta el script en local o **le pide al agente** que lo genere (p. ej. "genera el test plan para la release branch actual"). En local: `yarn generate:release-test-plan`.

## How the agent can do it (no workflow needed)

An agent (e.g. in Cursor) can handle the whole flow:

1. **You ask the agent** (e.g. “Generate the release test plan for the current release branch and commit it” or “Acaba de crearse la PR de release 13.18.0, genera el test plan y haz commit”).
2. **The agent** runs `yarn generate:release-test-plan` (with `--release-branch=release/X.Y.Z` if needed). That creates the **draft** (e.g. `docs/exploratory-testing-plan-13.18.0.md`).
3. **Optionally**, the agent uses the **“Prompt for the AI”** below to expand the draft (replace placeholder charters with concrete steps) and writes the result back to the file.
4. **The agent** commits and pushes the file to the release branch.

So the agent can both generate the draft and expand it, and push the result—no CI workflow required.

## Instructions for the agent (when asked to generate the test plan)

When the user asks you to generate or add the release test plan (e.g. after a release branch or release PR is created):

1. Determine the release branch (e.g. from context or ask). If not specified, run `yarn generate:release-test-plan` with no args (uses latest release branch on origin).
2. Run: `yarn generate:release-test-plan --release-branch=release/X.Y.Z` (or with no `--release-branch` for latest). This creates `docs/exploratory-testing-plan-<version>.md`.
3. Optionally expand the draft: use the "Prompt for the AI" below as your own instructions; replace the "Exploratory charters" section with concrete, actionable charters and steps based on the PR inventory in the draft; write the result back to the same file.
4. Commit and push: `git add docs/exploratory-testing-plan-<version>.md` and `git commit -m "docs: add exploratory test plan for release X.Y.Z"`, then push to the current branch.

---

## Alternative: human runs script, agent only expands

If you prefer to run the script yourself and use the agent only to expand the charters:

1. **You** run `yarn generate:release-test-plan` → this creates the **draft** file.
2. **You** send the agent the **“Prompt for the AI”** below and attach or paste the **draft**.
3. **Agent** returns the same document with the "Exploratory charters" section filled in.
4. **You** save the agent’s output and commit.

---

## Instructions for the human

1. Generate the draft:  
   `yarn generate:release-test-plan`  
   (or with `--release-branch=release/X.Y.Z`).  
   This creates `docs/exploratory-testing-plan-<version>.md` with the PR inventory and placeholder charters.

2. Open that draft file and the prompt below in your AI tool.

3. Send the agent the **Prompt for the AI** below, and attach or paste the **draft document** as the input to expand.

4. The agent should output the same document with the "Exploratory charters" section (and optionally "Test setup and data") replaced by concrete, actionable content.

5. Save the agent’s output over the draft or to a new file (e.g. `docs/exploratory-testing-plan-<version>.md`).

---

## Prompt for the AI

```
You are a QA test automation expert. Your task is to expand a **draft exploratory regression test plan** for a MetaMask Browser Extension release into a **full test plan** that any tester can follow.

**Input:** A markdown document that contains:
- A "PR inventory by focus area" section (Swaps/Bridge, Perps, Predictions, Mobile Core UX, Assets, Other/General) with links and short descriptions per PR.
- A "Test setup and data" section (may be generic).
- An "Exploratory charters" section with **placeholder** charters (e.g. "verify [describe main scenario]", "Edge cases and failure modes").

**Your task:**
1. Keep the document structure and all content **up to** "Exploratory charters" unchanged (title, Inputs reviewed, PR inventory by focus area, Test setup and data).
2. **Replace** the "Exploratory charters" section with **concrete, actionable charters** for each focus area that has PRs. For each area:
   - Add numbered charters (1, 2, 3…) that correspond to the PRs or themes in that area.
   - Under each charter, add bullet steps that a tester can follow (e.g. "Open swap in popup, fill From/To, capture quote, close popup, reopen; validate quote restore.").
   - Cover happy path, edge cases, and failure modes where relevant (e.g. empty state, errors, popup vs full window).
3. For focus areas with **no** PRs in the draft, keep a single short charter: regression verification for that area (e.g. "Verify existing behavior still works; deep links and flows remain correct.").
4. If the PR list implies specific test data (e.g. a new network, a feature flag), add or refine bullets under "Test setup and data" (e.g. "Enable Perps via `.manifest-overrides.json`", "Add Tempo Testnet").
5. Keep the "Exit criteria" section as-is at the end.

**Style:**
- Charters: short title + bullet steps. Same style as in existing MetaMask exploratory plans (e.g. "1. Quote persistence in popup mode" with bullets underneath).
- Be specific enough that a tester knows what to do without reading the PRs.
- Prefer popup, sidepanel, and full window where the feature applies.
- Output valid markdown only; no commentary outside the document.
```

---

## Example (what the AI should do)

**Before (draft):**  
`1. _Charter 1:_ Focus on PRs: #39654, #39653 — verify [describe main scenario].`

**After (AI output):**  
`1. Quote persistence in popup mode`  
`   - Open swap/bridge in popup, fill From/To, capture quote, close popup, reopen.`  
`   - Validate quote restore behavior and no stale fee values.`  
`2. MM fee disclaimer visibility`  
`   - Compare swaps with and without MM feeData in quote response.`  
`   - Confirm disclaimer toggles correctly and does not flicker on re-quote.`

Reference the existing `docs/exploratory-testing-plan-13.18.0.md` in this repo for the exact style and depth expected.
