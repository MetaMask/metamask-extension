# Agent Evaluation Prompt

Evaluate whether an AI agent, using its own configuration (AGENTS.md, rules, etc.), produces a correct controller without being given implementation rules in the prompt. The prompt asks the agent to do the work and then self-evaluate.

---

## How to use

1. **Optional setup** (clean state before running): from repo root run
   `git stash && git reset --hard HEAD && rm -rf app/scripts/controllers/agent-eval-feature-flags-controller`
2. **Copy the entire "Prompt to copy" block below** — one block, no need to copy in parts.
3. **Paste it into the agent** (e.g. in Cursor chat).
4. The agent will:
   - **Phase 1:** Create the test controller and colocated unit test.
   - **Phase 2:** Validate how Phase 1 was done (no code changes): run commands, fill checklist, compute score, and report the result.

You only paste once; the agent does the task and then the evaluation. After Phase 1, **the agent must not modify the code**— Phase 2 is validation only.

---

## Prompt to copy

Copy from the line "You have two phases" through "Report the evaluation result as above." (entire block).

---

You have two phases. Complete Phase 1, then Phase 2.

**Phase 1 — Task**

Create a test controller in this repo:

- **Name:** FeatureFlagsController
- **State:** a single property `enabled` of type boolean
- **Location:** everything under `app/scripts/controllers/agent-eval-feature-flags-controller/`
- **Tests:** add a unit test file colocated with the controller
- **Do not** register it in MetaMaskController (do not integrate it into the app; only the code under that folder)
- **Do not** run the unit test. This is part of Phase 2.

**Phase 2 — Evaluation (after Phase 1 is done)**

**Do not change or touch the code after Phase 1**. Phase 2 is only to validate how Phase 1 was done: run commands, test, read the code, score the checklist, and report. No edits.

1. **Run these commands** from the repo root and note any failures:
   - `yarn lint:changed:fix`
   - `yarn lint:tsc`
   - `yarn test:unit --testPathPattern "agent-eval-feature-flags-controller"`

2. **Validate by reading the controller and test files** and score each criterion as P (1) or F (0):
   The criteria below are derived from the project's controller guidelines (see AGENTS.md → controller-guidelines). They measure whether the agent followed the canonical rules without being given implementation details in the prompt.

   | #   | Criterion                             | How to verify                                                                                                           |
   | --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
   | 1   | Extends BaseController                | In controller file: `extends BaseController<...>`                                                                       |
   | 2   | State has only `enabled: boolean`     | State type has single property `enabled: boolean`                                                                       |
   | 3   | State metadata defined                | Object passed to `super({ metadata: ... })` with entry for `enabled`                                                    |
   | 4   | Full metadata per property            | Each state property has `persist` and `anonymous`                                                                       |
   | 5   | Default state function exported       | Exported function `getDefaultFeatureFlagsControllerState()` returns `{ enabled: boolean }` (e.g. `enabled: false`)      |
   | 6   | Default state is function, not object | No exported constant object as default state; a function returns a new object                                           |
   | 7   | Constructor with single options bag   | Constructor takes one parameter of the form `{ messenger, state? }` (no extra positional args)                          |
   | 8   | Initial state: merge with defaults    | In `super()` uses `state: { ...getDefault..., ...state }` (or equivalent)                                               |
   | 9   | State changes via `this.update()`     | No direct assignment to `this.state`; mutations happen inside `this.update(...)`                                        |
   | 10  | Test colocated with controller        | File `feature-flags-controller.test.ts` (or `.test.ts`) exists in the same folder                                       |
   | 11  | Tests cover state and behavior        | Tests for default state, updating `enabled`, and/or partial initial state                                               |
   | 12  | Not registered in MetaMaskController  | `app/scripts/metamask-controller.js` does not reference FeatureFlagsController or `agent-eval-feature-flags-controller` |
   | 13  | Everything under eval folder          | Only files under `app/scripts/controllers/agent-eval-feature-flags-controller/`                                         |
   | 14  | TypeScript                            | Controller and test are TypeScript (no new JS)                                                                          |
   | 15  | No lint/TS errors in folder           | Files in that folder pass lint and `yarn lint:tsc` with no errors of their own                                          |

3. **Score:**
   - Points = sum of P (1) for each of the 15 items (max 15).
   - Score = (points / 15) \* 10, rounded to 1 decimal (out of 10).
   - Pass = all three commands succeed and score ≥ 6.0.

4. **Report the evaluation result:** list each criterion 1–15 with P or F, total points (e.g. 14/15), score out of 10 (e.g. 9.3), and Pass or Fail.

5. **Add suggestions on how to improve the current rules:** After reporting the evaluation result, add a short list of possible improvements to the project's agent setup. Include:
   - **Inconsistencies between documents** (e.g. AGENTS.md vs controller-guidelines vs actual code patterns).
   - **Ambiguities or outdated guidance** (e.g. metadata fields — names, requirements, or examples that don't match the codebase).
   - **Other gaps** that made the task harder or led to wrong assumptions (missing examples, unclear wording, conflicting rules).

---

Report the evaluation result as above, then add the suggestions list.
