---
description: Analyze code changes between current branch and main
---

# CODEBOT Command

Automated code quality enforcement that analyzes only the changes in your current branch compared to main.

## What This Command Does

1. **Detects changed files** between your current branch and main branch
2. **Analyzes only the changed lines** (not entire files) - focuses on code you introduced
3. **Categorizes files** by type (test, controller, redux, component, general)
4. **Applies relevant rules** from cursor guidelines to your changes
5. **Reports violations** in newly added/modified code only with severity levels and fix suggestions
6. **Provides actionable feedback** for PR readiness
7. **Optional Deep Mode:** Performs exhaustive checks against all detailed guidelines when requested

**Important:** CODEBOT only analyzes the lines you added or modified (marked with `+` in git diff). Pre-existing issues in unchanged code are not reported.

## Arguments

| Argument | Description                                                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep` | **Deep Analysis Mode:** Reads full rule files, checks architectural patterns, treats "Medium" issues as "High", and verifies edge cases. |
| `--pr`   | **PR Description Only:** Skips code analysis and generates only the PR description following `.github/pull-request-template.md`.         |

## Output Behavior

By default, CODEBOT will:

1. Run code analysis
2. Generate PR description
3. **Save report to `CODEBOT_ANALYSIS_[branch-name].md`** in the project root

When `--pr` is used:

- Skip code analysis
- Generate only the PR description (ready to copy to GitHub)

## Core Principles

### Reproducibility Guarantee

CODEBOT MUST produce **deterministic, reproducible results**:

✅ **Required:**

- Same code = Same violations
- Running twice on same branch = Identical reports (except timestamps)
- All issues backed by verified evidence
- No randomly inflated/deflated issue counts

✅ **Consistency:**

- If you previously analyzed this branch:
  - Re-read all changed files (don't rely on memory)
  - Apply the same verification standards
  - Report should match previous analysis (unless code changed)

### Evidence-Based Analysis

Every violation MUST be:

- ✅ Verified in git diff (only changed lines analyzed)
- ✅ Located at specific line number(s) in newly added/modified code
- ✅ Demonstrated with code snippet from the changes
- ✅ Linked to specific guideline rule
- ✅ NOT reported if it exists in unchanged code (even if it violates rules)

## Execution Steps

### Step 1: Get Changed Files and Diffs

Run these commands to identify changed files and their specific changes:

```bash
# Get list of changed files
git diff --name-only main...HEAD

# Get the actual diff with context
git diff main...HEAD
```

Parse the output to get:

1. List of modified files (focus only on `.ts`, `.tsx`, `.js`, `.jsx` files)
2. Actual line changes (additions/modifications marked with `+` in diff)
3. Line numbers of changes (from diff hunks `@@ -X,Y +A,B @@`)

Exclude: `.*/`, `node_modules/`, `dist/`, `builds/`, `lavamoat/`, `test-artifacts/`, `*.d.ts`

**IMPORTANT:** Only analyze the lines that were **added or modified** in this branch (marked with `+` in the diff), not the entire file content.

### Step 2: Categorize Files by Type

For each changed file, determine its type:

- **E2E test file**: Contains `.spec.` in filename OR is in `test/e2e/` directory
- **Unit test file**: Contains `.test.` in filename (NOT in `test/e2e/`)
- **Controller file**: Contains `Controller.ts` or `-controller.ts`
- **Redux file**: Contains `reducer`, `slice`, `actions`, or `selectors` in filename
- **Component file**: `.tsx` or `.jsx` in `ui/` directory
- **General file**: All other TypeScript/JavaScript files

**Note:** E2E tests (`.spec.ts`) and unit tests (`.test.ts`) have different guidelines. Apply the correct rules based on file type.

### Step 3: Load Applicable Guidelines

For each file type, reference these cursor rules.

**If `--deep` argument is present:** You MUST use `read_file` to fetch the full content of the relevant rule files below. Do not rely solely on the checklists.

**IMPORTANT - Rule References:**
When you read guideline files, note:

- The line numbers where specific rules are defined
- The section headings/names for each rule
- Multiple locations if the same rule appears in different files
- Cross-references to other guidelines (e.g., AGENTS.md)

- **All files**: `.cursor/rules/coding-guidelines/RULE.md`
- **Unit test files** (`.test.ts`): `.cursor/rules/unit-testing-guidelines/RULE.md`
- **E2E test files** (`.spec.ts`, `test/e2e/`): `.cursor/rules/e2e-testing-guidelines/RULE.md`
- **Controller files**: `.cursor/rules/controller-guidelines/RULE.md`
- **Redux files**: `.cursor/rules/front-end-performance-state-management/RULE.md`
- **Components**:
  - `.cursor/rules/coding-guidelines/RULE.md` (general React patterns)
  - `.cursor/rules/front-end-performance-rendering/RULE.md` (rendering performance - keys, memoization, virtualization)
  - `.cursor/rules/front-end-performance-hooks-effects/RULE.md` (hooks & effects)
  - `.cursor/rules/front-end-performance-react-compiler/RULE.md` (React Compiler considerations)

### Step 4: Analyze Only the Changed Lines

**🔴 MANDATORY:** Focus ONLY on the lines that were added or modified in this branch.

**Analysis Scope:**

- ✅ Analyze lines marked with `+` in the git diff
- ✅ Read surrounding context from file (to understand the change)
- ❌ Do NOT report violations in unchanged code (even if they exist)
- ❌ Do NOT analyze the entire file as if it's all new code

**Process for EACH changed file:**

1. ✅ Get the diff for this specific file: `git diff main...HEAD -- path/to/file`
2. ✅ Identify the changed line ranges (from `@@ -X,Y +A,B @@` markers)
3. ✅ Read the complete file with `read_file` (for context)
4. ✅ Read applicable guideline files from `.cursor/rules/`
5. ✅ **Focus analysis ONLY on the changed lines** (lines with `+` in diff)
6. ✅ Copy exact code snippets from changed lines that violate rules
7. ✅ Document each violation with evidence (see Step 4.5)

**If --deep mode:** Additionally read full rule files and verify architectural patterns, check for edge cases, and treat "Medium" priority checks as if they were "High".

**Important:** If a violation exists in unchanged code, do NOT report it. Only report violations introduced or modified in this branch.

For each changed section, check for violations across severity levels. **Reference `.cursor/rules/` files for comprehensive guidelines and examples.**

#### 🔴 CRITICAL (FAIL - Blocks Merge)

**Test Files** → See `.cursor/rules/unit-testing-guidelines.mdc` for details:

- [ ] No "should" in test names (present tense only)
- [ ] AAA pattern (Arrange, Act, Assert) with clear separation
- [ ] Each test has one clear purpose
- [ ] No `any` types
- [ ] External dependencies mocked (Jest mocks, not Sinon)
- [ ] async/await used (not done() callbacks)

**Controller Files** → See `.cursor/rules/controller-guidelines.mdc` for details:

- [ ] Extends `BaseController`
- [ ] Exports `getDefault${ControllerName}State` function
- [ ] State metadata defined (persist, anonymous/includeInDebugSnapshot, includeInStateLogs, usedInUi)
- [ ] All state updates use `this.update()` (no direct mutations)
- [ ] Messenger types defined (no callbacks in constructor)

**Redux Files** → See `.cursor/rules/front-end-performance-state-management.mdc` for details:

- [ ] No state mutations in reducers (unless Redux Toolkit with Immer)
- [ ] No side effects in reducers
- [ ] Using Redux Toolkit (`createSlice`)
- [ ] Proper TypeScript types
- [ ] No non-serializable values in state (no Promises, functions, Maps/Sets)
- [ ] **No inline selector functions** in useSelector (extract to memoized selectors)

**Component Files** → See `.cursor/rules/front-end-performance-rendering.mdc`, `.cursor/rules/front-end-performance-hooks-effects.mdc`, `.cursor/rules/front-end-performance-react-compiler.mdc`, and `.cursor/rules/coding-guidelines.mdc` for details:

- [ ] TypeScript (not JavaScript)
- [ ] Functional components (not classes)
- [ ] Props destructured in function parameters
- [ ] No `any` types
- [ ] No console.logs
- [ ] **No index as key** in dynamic lists (use unique IDs)
- [ ] **No JSON.stringify in useEffect dependencies** (use useEqualityCheck or normalize to primitives)
- [ ] **All dependencies included** in useEffect/useMemo/useCallback (no missing deps)
- [ ] **Hooks called unconditionally** (not inside conditionals/loops)
- [ ] **useEffect cleanup** for subscriptions/intervals/fetch requests

**All Files** → See `.cursor/rules/coding-guidelines.mdc` for details:

- [ ] TypeScript for new code
- [ ] No `@ts-ignore` without explanation
- [ ] Explicit types for function params and returns
- [ ] No unused imports
- [ ] No commented-out code

#### 🟡 HIGH (Should Fix Before Merge)

**Test Files** → See `.cursor/rules/unit-testing-guidelines.mdc`:

- [ ] Tests are independent
- [ ] Test data is realistic and inline
- [ ] Edge cases and error paths tested

**Controller Files** → See `.cursor/rules/controller-guidelines.mdc`:

- [ ] Selectors exported (not getter methods)
- [ ] Methods are actions (not setters)
- [ ] State is minimal (no derived values)
- [ ] Has `destroy()` if cleanup needed

**Redux Files** → See `.cursor/rules/front-end-performance-state-management.mdc`:

- [ ] State is normalized (byId/allIds pattern for complex data)
- [ ] Selectors use `select` prefix
- [ ] Using `createAsyncThunk` for async operations
- [ ] No identity functions in selectors (always transform data)
- [ ] Granular input selectors (not deep property access)
- [ ] Selectors select only needed properties (not entire state slices)
- [ ] Combined related selectors into one memoized selector (reduce subscriptions)

**Component Files** → See `.cursor/rules/front-end-performance-rendering.mdc` and `.cursor/rules/front-end-performance-hooks-effects.mdc`:

- [ ] Component size reasonable (<200 lines)
- [ ] `useMemo` for expensive computations (sorting/filtering large arrays)
- [ ] `useCallback` for callbacks passed to children
- [ ] `useEffect` has proper cleanup (intervals, subscriptions, AbortController)
- [ ] React.memo for frequently rendered components
- [ ] Static objects/styles defined outside component
- [ ] List virtualization for 100+ items
- [ ] No cascading useEffect chains (combine or compute during render)
- [ ] No useEffect for derived state (calculate during render)
- [ ] Manual memoization for cross-file dependencies (Redux, external hooks)
- [ ] Prevent state updates after unmount (cancelled flag pattern)

#### 🔵 MEDIUM (Consider Fixing)

**All Files** → See `.cursor/rules/coding-guidelines.mdc`:

- [ ] Functions are focused (single responsibility)
- [ ] No deep nesting (max 3-4 levels, use early returns)
- [ ] TSDoc comments on public APIs
- [ ] Naming follows conventions (PascalCase components, camelCase functions, `use` prefix hooks, `with` prefix HOCs)
- [ ] No duplicated code (DRY principle)
- [ ] File organization follows standard structure (component folder with types, tests, styles)
- [ ] External packages evaluated (Snyk Advisor, maintenance status, security)

### Step 4.5: Evidence Requirements (MANDATORY)

For EVERY violation reported, you MUST provide:

✅ **Required Evidence:**

- [ ] Exact file path
- [ ] Specific line number(s) where violation occurs (must be in changed lines with `+` in diff)
- [ ] Actual code snippet from the changed lines (3-5 lines minimum showing the violation)
- [ ] Confirmation that this line was added/modified in current branch (not pre-existing)
- [ ] Explanation of why it violates the rule
- [ ] Concrete fix with code example
- [ ] **Rule reference:** Which guideline file defines this rule (e.g., `.cursor/rules/coding-guidelines.mdc`)
- [ ] **Rule location:** Specific section/lines in guideline file where rule is documented (e.g., "lines 45-89, 'Use Functional Components and Hooks'")

❌ **NOT Allowed:**

- Generic statements like "Multiple instances found" without listing each
- Bundled issues (e.g., "Issues #9-15") without individual documentation
- Violations in unchanged code (even if they exist in the file)
- Assumed violations not verified in actual code
- Line numbers with "~" or "approximately"
- References to code patterns without showing the actual code
- Vague descriptions without specific examples
- Reporting issues that existed before this branch

**Verification Test:**
Before adding an issue to the report, ask yourself:

1. "Can I show the exact line of code that violates this rule?"
2. "Is this line marked with `+` in the git diff (newly added/modified)?"
3. "If the developer opens this file at this line, will they immediately see the problem?"
4. "Have I actually READ this specific code from the diff, or am I assuming it exists?"
5. "Can I point to the exact guideline file, section, and lines that define this rule?"
6. "Did this code exist before this branch, or is it newly introduced?"

**If you answer "no" to any question, DO NOT report the issue.**

**Rule Reference Examples:**

✅ **GOOD - Complete Rule Reference:**

```
📚 Rule Reference:
- Guideline: .cursor/rules/coding-guidelines.mdc
- Section: "Use Functional Components and Hooks"
- Lines: 45-89
- Also See: AGENTS.md line 5 (Critical Rule #5)
```

✅ **GOOD - Multiple Guideline References:**

```
📚 Rule Reference:
- Guideline: .cursor/rules/front-end-performance-hooks-effects.mdc
- Section: "Don't Overuse useEffect"
- Lines: 11-41
- Also Referenced In: .cursor/rules/front-end-performance-react-compiler.mdc lines 85-121
```

❌ **BAD - Vague Reference:**

```
Rule: Performance guidelines
```

❌ **BAD - File Only, No Section:**

```
Rule: .cursor/rules/coding-guidelines.mdc
```

❌ **BAD - No Line Numbers:**

```
Guideline: coding-guidelines.mdc (React components section)
```

### Step 4.6: Determine PR Readiness Status (MANDATORY)

**Before generating the report header, determine the status using these STRICT rules:**

| Critical Count | High Count | Status            |
| -------------- | ---------- | ----------------- |
| > 0            | any        | ❌ NOT READY      |
| 0              | > 0        | ⚠️ NEEDS REVIEW   |
| 0              | 0          | ✅ READY TO MERGE |

**Status Definitions:**

- **❌ NOT READY** = At least one CRITICAL issue exists → PR cannot merge until fixed
- **⚠️ NEEDS REVIEW** = No critical issues, but HIGH priority issues should be addressed
- **✅ READY TO MERGE** = No critical or high issues → PR meets quality standards

**Pre-Output Verification (MANDATORY):**
Before writing the status in the header, verify:

- [ ] Count critical issues → If count > 0, status MUST be "❌ NOT READY"
- [ ] Count high issues → If critical = 0 and high > 0, status MUST be "⚠️ NEEDS REVIEW"
- [ ] Status text matches the actual issue counts in summary line
- [ ] **NEVER mark "READY TO MERGE" if any CRITICAL issues exist**

**Example Verification:**

```
Summary: 1 critical, 0 high, 0 medium
         ↓
         1 > 0 → Status MUST be ❌ NOT READY

Summary: 0 critical, 2 high, 3 medium
         ↓
         0 critical, 2 high > 0 → Status MUST be ⚠️ NEEDS REVIEW

Summary: 0 critical, 0 high, 5 medium
         ↓
         0 critical, 0 high → Status MUST be ✅ READY TO MERGE
```

### Step 5: Generate Report

**EVIDENCE REQUIREMENTS:**

- Every violation MUST include: File path, exact line numbers (from changed lines only), code snippet, fix, **complete rule reference**
- **Rule reference MUST include:** Guideline file, section name, and line numbers in guideline
- **Only report violations in newly added/modified lines** (marked with `+` in git diff)
- Use actual line numbers (not "~150" or "around line 50")
- Show 3-5 lines of actual code for each violation (from the changes)
- NO generic categories like "Issues #9-15: Various problems"
- Each issue must be individually documented with full evidence
- Developer must be able to verify the rule by opening the guideline file at specified lines
- **Do NOT report pre-existing issues** in unchanged code

Output the analysis in this **concise format**:

````
🤖 CODEBOT: [Branch Name] → [✅ READY TO MERGE | ❌ NOT READY | ⚠️ NEEDS REVIEW]

📋 SUMMARY: X critical, Y high, Z medium issues across N files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CRITICAL (X) - Must fix before merge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. `path/to/file.ts:XX` - [Brief issue description]
   ```typescript
   // Violating code (2-3 lines)
````

**Fix:** [One-line fix instruction]

```typescript
// Fixed code
```

📚 Rule: `.cursor/rules/[file.mdc]` → [Section name]

2. `path/to/file.ts:YY` - [Brief issue description]
   ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟡 HIGH (X) - Should fix before merge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. `path/to/file.ts:XX` - [Issue description]
   **Fix:** [Brief fix instruction]
   📚 Rule: `.cursor/rules/[file.mdc]` → [Section name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔵 MEDIUM (X) - Consider fixing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. `path/to/file.ts:XX` - [Suggestion]
   📚 Rule: `.cursor/rules/[file.mdc]` → [Section name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 PR DESCRIPTION (ready to copy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Generated PR description - see Step 6]

````

**After generating the report, save it to:** `CODEBOT_ANALYSIS_[branch-name].md`

**⚠️ EXCLUDED FROM OUTPUT - DO NOT ADD THESE SECTIONS:**
- ❌ "Files Analyzed" table (listing all changed files)
- ❌ "Verified Clean" or "Clean files list" (listing files with no issues)
- ❌ "Verification" section (internal checks should NOT appear in output)
- ❌ Summary table at the end (redundant with header summary)
- ❌ Analysis date or timestamps

**Report Guidelines:**
- Start with PR readiness status in the header
- Show issue count summary immediately
- **Only include severity sections that have issues** (omit empty CRITICAL/HIGH/MEDIUM sections entirely)
- List issues by priority (Critical → High → Medium)
- Use compact `file.ts:XX` format for locations
- Show code snippets only for critical issues
- **Include rule reference for every issue** (compact format: `📚 Rule: [file] → [section]`)
- Verification must still happen internally (Step 7) but is not shown in the report

### Step 6: Generate PR Description

**Always generate** a PR description following `.github/pull-request-template.md` (included at the end of every analysis report):

```markdown
## **Description**

[Analyze the git diff and write a 2-3 sentence summary:
1. What is the reason for the change?
2. What is the improvement/solution?]

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/MetaMask/metamask-extension/pull/PR?quickstart=1)

## **Changelog**

[If user-facing change:]
CHANGELOG entry: [Past tense description, e.g., "Added token balance API fallback"]

[If not user-facing:]
CHANGELOG entry: null

## **Related issues**

Fixes: [Extract issue number from branch name if present, e.g., pr-38841 → #38841]

## **Manual testing steps**

[Generate specific steps based on changed files:]
1. Go to this page...
2. Perform this action...
3. Verify this behavior...

## **Screenshots/Recordings**

[If UI changes detected: "Screenshots needed for UI changes"]
[If no UI changes: "N/A - No UI changes"]

### **Before**
<!-- [screenshots/recordings] -->

### **After**
<!-- [screenshots/recordings] -->

## **Pre-merge author checklist**

- [ ] I've followed [MetaMask Contributor Docs](https://github.com/MetaMask/contributor-docs) and [MetaMask Extension Coding Standards](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/CODING_GUIDELINES.md).
- [ ] I've completed the PR template to the best of my ability
- [ ] I've included tests if applicable
- [ ] I've documented my code using [JSDoc](https://jsdoc.app/) format if applicable
- [ ] I've applied the right labels on the PR (see [labeling guidelines](https://github.com/MetaMask/metamask-extension/blob/main/.github/guidelines/LABELING_GUIDELINES.md)). Not required for external contributors.

## **Pre-merge reviewer checklist**

- [ ] I've manually tested the PR (e.g. pull and build branch, run the app, test code being changed).
- [ ] I confirm that this PR addresses all acceptance criteria described in the ticket it closes and includes the necessary testing evidence such as recordings and or screenshots.
````

**PR Description Guidelines:**

- Analyze the diff to understand what the changes do (don't just list files)
- Extract issue numbers from branch name (e.g., `fix/38841-balance` → `#38841`)
- Generate realistic testing steps based on changed components
- Determine if changes are user-facing for changelog
- Note if screenshots are needed for UI changes

### Step 7: Final Verification (MANDATORY - Internal Only)

Before presenting the report, perform these verification checks internally. **Do NOT include verification results in the output report.**

Verify:

**Evidence Audit:**

- [ ] Confirm each violation is in a line marked with `+` in git diff
- [ ] Open each file mentioned in violations (using read_file if needed)
- [ ] Verify each line number is accurate and was changed in this branch
- [ ] Verify each code snippet actually exists in the changed lines
- [ ] Check that each violation genuinely violates the cited rule
- [ ] Ensure no violations are based on assumptions
- [ ] **Confirm no pre-existing issues are reported** (only new/modified code)

**Quality Checks:**

- [ ] No issues reported without exact line numbers
- [ ] No "likely" or "probably" language in violations
- [ ] No bundled issues (e.g., "Issues #X-Y")
- [ ] Every CRITICAL and HIGH issue has code snippet from changed lines
- [ ] Issue count matches documented violations (not inflated)
- [ ] Every issue can be immediately located by a developer
- [ ] **Every violation includes rule reference:** Guideline file, section name, and line numbers
- [ ] **Rule references are specific:** Not just file name, but exact section and lines in guideline
- [ ] **No violations reported in unchanged code** (even if they exist)

**Consistency Check:**

- [ ] If you previously analyzed this branch, compare:
  - Similar issue count (unless code changed)
  - Same violations reported (unless code changed)
  - No new "discovered" issues from same code

**If ANY check fails:** Re-analyze with proper verification before generating report.

## Severity Levels (Explicit Criteria)

### 🔴 CRITICAL (BLOCKING - Exit Code 1)

**Criteria:** Issues that violate fundamental project rules or will break standards enforcement

**Examples (MUST have evidence):**

- ✅ Class component when functional component required
- ✅ JavaScript file (.js/.jsx) when TypeScript mandatory
- ✅ Missing BaseController extension in controller
- ✅ Direct state mutation in Redux reducer
- ✅ Missing hook dependencies (verified with actual code)
- ✅ Index used as key in dynamic list
- ✅ console.log statements in code

**NOT CRITICAL:**

- ❌ "File is too long" (this is MEDIUM)
- ❌ "Could use more memoization" (this is HIGH if performance issue)
- ❌ "Missing TypeScript docs" (this is MEDIUM)
- ❌ "Complex logic" (this is MEDIUM)

**Test:** Does this violate a project rule? If yes → CRITICAL. If it's a "should" or "best practice" → HIGH or MEDIUM.

### 🟡 HIGH (Should Fix - Exit Code 0 with warnings)

**Criteria:** Performance issues, strong recommendations, deprecated patterns, or patterns that will cause maintenance problems

**⚠️ Deprecated patterns are always HIGH severity** (not Critical). Deprecated means "should be replaced" not "blocks merge".

**Examples (MUST have evidence):**

- ✅ `driver.delay()` usage in E2E tests — **Deprecated**, use page object wait methods
- ✅ Missing React.memo on frequently rendered component
- ✅ No useMemo for expensive computation (array.sort on 100+ items)
- ✅ Missing useCallback for child component callback prop
- ✅ useEffect without cleanup for subscriptions/intervals
- ✅ Non-memoized Redux selector causing re-renders
- ✅ Component over 200 lines (should be broken down)
- ✅ useEffect used for derived state (calculate during render instead)

**NOT HIGH:**

- ❌ "Component could be smaller" without size threshold (this is MEDIUM)
- ❌ "Function naming could be better" (this is MEDIUM)
- ❌ "Missing comments" (this is MEDIUM)

**Test:** Does this cause performance issues or significantly impact maintainability? If yes → HIGH. If it's code quality → MEDIUM.

### 🔵 MEDIUM (Consider - Exit Code 0)

**Criteria:** Code quality suggestions, readability improvements, not functional issues

**Examples:**

- ✅ Component over 300 lines but under 500 (suggest splitting)
- ✅ Complex conditional logic (suggest extraction)
- ✅ Missing JSDoc on public APIs
- ✅ Deep nesting (suggest early returns)
- ✅ Function could follow single responsibility better
- ✅ Duplicated code (DRY principle)

**Test:** Is this about code quality/readability rather than correctness or performance? If yes → MEDIUM.

## Anti-Patterns to Avoid

When running CODEBOT analysis, DO NOT:

❌ **Bundle Issues Without Details**

```
Bad:  "Issues #9-15: Multiple issues found"
Good: Each issue listed separately with file, line, code snippet
```

❌ **Use Approximate Language**

```
Bad:  "Around line 150, there might be..."
Good: "Lines 147-152: [actual code snippet from changed lines]"
```

❌ **Report Unverified Issues**

```
Bad:  "This pattern likely exists in multiple files"
Good: "File X, lines Y-Z (newly added): [specific verified violation with code]"
```

❌ **Rely on Memory/Assumptions**

```
Bad:  Using knowledge from previous analysis sessions
Good: Read git diff and files fresh every time
```

❌ **Inflate Issue Counts**

```
Bad:  Reporting 27 issues when only 8 are verified
Good: Report only verified issues with evidence
```

❌ **Generic Issue Descriptions**

```
Bad:  "Performance issues found" or "Code quality concerns"
Good: "Lines 45-48 (newly added): Missing memoization for expensive computation causes re-renders"
```

❌ **Vague Rule References**

```
Bad:  "Violates performance guidelines"
Bad:  "Rule: coding-guidelines.mdc"
Good: "Rule: .cursor/rules/front-end-performance-rendering.mdc, lines 12-48, 'Use Proper Keys for Lists'"
Good: "Guideline: .cursor/rules/coding-guidelines.mdc (lines 45-89, 'Use Functional Components'), Also: AGENTS.md line 5"
```

❌ **Report Pre-Existing Issues**

```
Bad:  "Line 50: Uses any type" (but line 50 was not changed in this branch)
Good: Only report violations in lines marked with + in git diff
```

❌ **Status Mismatch with Issue Counts**

```
Bad:  "✅ READY TO MERGE" with "1 critical issue"
      Status says ready but critical issues exist → CONTRADICTORY
Good: "❌ NOT READY" with "1 critical issue"
      Status correctly reflects blocking issues
```

✅ **DO: Be Precise and Verified**

- Every issue = Specific file + line + code + fix + rule reference
- Every report = Fresh analysis with git diff and read_file
- Every violation = In changed lines only (marked with + in diff)
- Every violation = Backed by actual guideline with section and line numbers
- Every claim = Verifiable by opening the file
- Every rule reference = Includes guideline file, section name, and line numbers
- No pre-existing issues = Only analyze new/modified code

## Analysis Rules by File Type

CODEBOT references detailed guidelines in `.cursor/rules/` for comprehensive rules and examples. This section provides quick checklists for what CODEBOT analyzes.

### Unit Test Files (_.test.ts, _.test.tsx)

**Reference:** `.cursor/rules/unit-testing-guidelines/RULE.md`

**CRITICAL Checks:**

- [ ] No "should" in test names (use present tense)
- [ ] AAA pattern (Arrange, Act, Assert) with clear separation
- [ ] Each test has one clear purpose
- [ ] No `any` types
- [ ] External dependencies mocked
- [ ] Jest mocks used (not Sinon)
- [ ] async/await used (not done() callbacks)
- [ ] Test data is realistic and inline

**HIGH Priority Checks:**

- [ ] Tests are independent
- [ ] Edge cases tested
- [ ] Error paths tested
- [ ] Snapshot tests named "render matches snapshot"
- [ ] Test data factories used for complex objects (not shared mutable state)
- [ ] Timer mocking used for time-dependent code (jest.useFakeTimers)

**See `.cursor/rules/unit-testing-guidelines/RULE.md` for:**

- Detailed examples of correct vs incorrect test patterns
- Controller-specific testing patterns
- Mocking strategies
- Async testing best practices

### E2E Test Files (_.spec.ts, _.spec.js, test/e2e/\*\*)

**Reference:** `.cursor/rules/e2e-testing-guidelines/RULE.md`

**CRITICAL Checks:**

- [ ] No "should" in test names (use present tense)
- [ ] No "and" combining multiple scenarios in test names
- [ ] Using `data-testid` for element locators (not CSS classes or XPath)
- [ ] No debug console.log statements
- [ ] No `any` types
- [ ] Using `withFixtures` for proper setup/cleanup

**Deprecated Pattern Detection:** See `.cursor/BUGBOT.md` for regex patterns used to detect anti-patterns.

**HIGH Priority Checks (includes deprecated patterns):**

- [ ] ⚠️ No `driver.delay()` usage — **Deprecated**, use page object wait methods instead
- [ ] Using page objects for page interactions (not raw driver calls)
- [ ] Using fixtures to set up state (not UI interactions for setup)
- [ ] Explicit assertions with clear error messages
- [ ] External requests are mocked when appropriate
- [ ] Check methods use `check_` prefix
- [ ] Test file is in appropriate feature folder
- [ ] Spec files target ~2 minutes runtime

**MEDIUM Priority Checks:**

- [ ] Tests are independent (no dependencies between tests)
- [ ] Detailed logging in page object methods
- [ ] Page objects are TypeScript
- [ ] Page objects don't reference each other (no circular dependencies)

**Deprecated Patterns (E2E):**

See `.cursor/BUGBOT.md` for the complete list of E2E anti-patterns with regex detection patterns.

**Report Format for Deprecated Patterns:**

```
⚠️ **DEPRECATED:** `driver.delay()` should not be used in E2E tests.
→ **Use instead:** Page object wait methods like `assetListPage.checkTokenAmountIsDisplayed()` or `driver.waitForSelector()`

📚 Rule: `.cursor/rules/e2e-testing-guidelines/RULE.md` → "Timing and Waits" section
```

**See `.cursor/rules/e2e-testing-guidelines/RULE.md` for:**

- Page object model patterns
- Wait strategies and timing
- Element locator best practices
- Fixture usage for state setup
- Test organization by feature

### Controller Files (_Controller.ts, _-controller.ts)

**Reference:** `.cursor/rules/controller-guidelines/RULE.md`

**CRITICAL Checks:**

- [ ] Extends `BaseController`
- [ ] Exports `getDefault${ControllerName}State` function
- [ ] State metadata defined (persist, anonymous/includeInDebugSnapshot, includeInStateLogs, usedInUi)
- [ ] All state updates use `this.update()`
- [ ] No direct state mutations
- [ ] Messenger types defined
- [ ] No callbacks in constructor (use messenger)

**HIGH Priority Checks:**

- [ ] Selectors exported (not getter methods)
- [ ] Methods are actions (not setters)
- [ ] State is minimal (no derived values)
- [ ] Has `destroy()` if cleanup needed
- [ ] Single options bag pattern in constructor
- [ ] Action methods validate inputs and throw descriptive errors
- [ ] Controller lifecycle properly handled (initialization, cleanup)

**See `.cursor/rules/controller-guidelines/RULE.md` for:**

- Complete controller architecture patterns
- State metadata examples
- Messenger usage patterns
- Selector implementation examples

### Redux Files (*reducer.ts, *slice.ts, *actions.ts, *selectors.ts)

**Reference:** `.cursor/rules/front-end-performance-state-management/RULE.md` (for Redux patterns)

**CRITICAL Checks:**

- [ ] No state mutations in reducers (unless using Redux Toolkit with Immer)
- [ ] No side effects in reducers
- [ ] Using Redux Toolkit (`createSlice`)
- [ ] Proper TypeScript types
- [ ] No non-serializable values in state

**HIGH Priority Checks:**

- [ ] State is normalized
- [ ] Selectors use `select` prefix
- [ ] Using `createAsyncThunk` for async
- [ ] Actions follow Flux Standard Action pattern

**See `.cursor/rules/front-end-performance-state-management/RULE.md` for:**

- Redux optimization patterns
- Selector memoization strategies
- State normalization examples

### Component Files (_.tsx, _.jsx)

**Reference:**

- `.cursor/rules/coding-guidelines/RULE.md` (general React patterns)
- `.cursor/rules/front-end-performance-rendering/RULE.md` (rendering performance)
- `.cursor/rules/front-end-performance-hooks-effects/RULE.md` (hooks & effects)
- `.cursor/rules/front-end-performance-react-compiler/RULE.md` (React Compiler considerations)

**CRITICAL Checks:**

- [ ] TypeScript (not JavaScript)
- [ ] Functional components (not classes)
- [ ] Props destructured in function parameters
- [ ] No `any` types
- [ ] No console.logs
- [ ] **No index as key in dynamic lists** (use unique IDs)
- [ ] No class components

**HIGH Priority Performance Checks:**

- [ ] Component size reasonable (<200 lines)
- [ ] `useMemo` for expensive computations (sorting, filtering large arrays)
- [ ] `useCallback` for callbacks passed to children
- [ ] `useEffect` has proper cleanup
- [ ] Memoized components (React.memo) for frequently rendered items
- [ ] Static objects/styles defined outside component
- [ ] List virtualization for 100+ items

**MEDIUM Priority Performance Checks:**

- [ ] Components that could benefit from code splitting (React.lazy)
- [ ] No `useEffect` for derived state (calculate during render)
- [ ] Proper dependency arrays in hooks (all dependencies included)
- [ ] Component composition to prevent re-renders (move state down, pass children)
- [ ] useRef for persistent values (not regular variables)
- [ ] Minimize useEffect dependencies (move values to default params when possible)
- [ ] React Compiler: Manual memoization for cross-file dependencies (Redux, external hooks)
- [ ] React Compiler: Keep existing useMemo/useCallback for effect dependencies

**See `.cursor/rules/front-end-performance-rendering/RULE.md` for:**

- Key usage patterns
- Virtualization examples
- React.memo usage guidelines

**See `.cursor/rules/front-end-performance-hooks-effects/RULE.md` for:**

- useEffect best practices
- When NOT to use useEffect
- Cleanup patterns

**See `.cursor/rules/front-end-performance-react-compiler/RULE.md` for:**

- React Compiler capabilities and limitations
- When manual memoization is still required (cross-file dependencies, Redux, external libraries)
- Decision tree for manual memoization needs
- Keep existing useMemo/useCallback for effect dependencies

**See `.cursor/rules/coding-guidelines/RULE.md` for:**

- Component structure patterns
- Props destructuring examples
- General React best practices
- File organization standards
- Naming conventions

## Usage Instructions

### In Cursor Chat

```
/CODEBOT              # Full analysis + PR description (saved to MD file)
/CODEBOT --deep       # Deep analysis + PR description
/CODEBOT --pr         # PR description only (skip analysis)
```

### Expected Output

CODEBOT will:

1. Identify all changed files in your branch
2. Analyze each file according to its type
3. Report violations with severity levels (concise format)
4. Suggest fixes for each issue
5. Give you a PR readiness assessment
6. Generate a PR description (ready to copy to GitHub)
7. **Save report to `CODEBOT_ANALYSIS_[branch-name].md`**

### Integration with Workflow

**Before committing:**

```
/CODEBOT check my changes
```

**Before creating PR:**

```
/CODEBOT am I ready for PR?
```

**After code review feedback:**

```
/CODEBOT verify fixes
```

## Quality Self-Check (Internal Only)

Before generating final report, perform these checks internally. **These checks are NOT included in the output report.**

### Evidence Completeness

- [ ] Every CRITICAL issue has: file path, line numbers, code snippet, fix, **complete rule reference** (guideline file, section, lines)
- [ ] Every HIGH issue has: file path, line numbers, code snippet, suggestion, impact, **complete rule reference**
- [ ] Every MEDIUM issue has: file path, line numbers, benefit explanation, **complete rule reference**
- [ ] No issues with approximate line numbers ("~150", "around line 50")
- [ ] No bundled issues without individual documentation
- [ ] **Every rule reference includes:** Guideline file path, section name, and line numbers in guideline
- [ ] **Rule references are verifiable:** Developer can open guideline file and find the rule at specified lines

### Analysis Quality

- [ ] All changed code files read with `read_file` tool
- [ ] No assumptions made about code without verification
- [ ] Issue count is accurate (matches individually documented issues)
- [ ] No "likely" or "probably" language in issue descriptions
- [ ] Every violation can be immediately found by developer opening the file

### Status Accuracy (CRITICAL)

- [ ] **If critical issues > 0, status MUST be "❌ NOT READY"** (never "READY TO MERGE")
- [ ] **If high issues > 0 (and critical = 0), status MUST be "⚠️ NEEDS REVIEW"**
- [ ] Status in header matches actual issue counts in summary
- [ ] Verified Step 4.6 rules were applied correctly

### Reproducibility

- [ ] If running on same branch twice, same issues would be found
- [ ] Analysis method used consistently (Standard or Deep mode)
- [ ] Guidelines referenced consistently across runs

## Quick Reference

### Common Violations & Fixes

**Note:** When reporting violations, include the specific section name and line numbers from the guideline file.

| Violation                             | Fix                                                      | Reference                                                                                         |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Test name has "should"                | Remove "should", use present tense                       | `.cursor/rules/unit-testing-guidelines/RULE.md` or `.cursor/rules/e2e-testing-guidelines/RULE.md` |
| Direct state mutation                 | Use `this.update()` in controllers                       | `.cursor/rules/controller-guidelines/RULE.md` ("All state updates use this.update()")             |
| Missing BaseController                | Extend from BaseController                               | `.cursor/rules/controller-guidelines/RULE.md` ("Controller Structure")                            |
| Using `any` type                      | Add explicit types                                       | `.cursor/rules/coding-guidelines/RULE.md` ("TypeScript Best Practices")                           |
| Class component                       | Convert to functional component                          | `.cursor/rules/coding-guidelines/RULE.md` (lines 45-89, "Use Functional Components and Hooks")    |
| Props not destructured                | Destructure in function params                           | `.cursor/rules/coding-guidelines/RULE.md` (lines 90-120, "Use Object Destructuring for Props")    |
| Console.log in code                   | Remove debug statements                                  | `.cursor/rules/coding-guidelines/RULE.md` ("Code Style" section)                                  |
| No state metadata                     | Add metadata with persist/anonymous/usedInUi             | `.cursor/rules/controller-guidelines/RULE.md`                                                     |
| Getter method in controller           | Export as selector function                              | `.cursor/rules/controller-guidelines/RULE.md`                                                     |
| Redux state mutation                  | Use Redux Toolkit or immutable updates                   | `.cursor/rules/front-end-performance-state-management/RULE.md`                                    |
| Index as key                          | Use unique ID from data (item.id, item.address)          | `.cursor/rules/front-end-performance-rendering/RULE.md`                                           |
| Missing memoization                   | Wrap expensive calculation in useMemo                    | `.cursor/rules/front-end-performance-rendering/RULE.md`                                           |
| useEffect for derived state           | Calculate during render instead                          | `.cursor/rules/front-end-performance-hooks-effects/RULE.md`                                       |
| JSON.stringify in dependencies        | Use useEqualityCheck or normalize to primitives          | `.cursor/rules/front-end-performance-hooks-effects/RULE.md`                                       |
| Missing dependencies in hooks         | Include all dependencies (use ESLint rule)               | `.cursor/rules/front-end-performance-hooks-effects/RULE.md`                                       |
| Hooks called conditionally            | Call hooks unconditionally, use conditional logic inside | `.cursor/rules/front-end-performance-hooks-effects/RULE.md`                                       |
| No useEffect cleanup                  | Add cleanup for intervals/subscriptions/fetch            | `.cursor/rules/front-end-performance-hooks-effects/RULE.md`                                       |
| Inline selector functions             | Extract to memoized selectors                            | `.cursor/rules/front-end-performance-state-management/RULE.md`                                    |
| Multiple useSelector calls            | Combine into single selector                             | `.cursor/rules/front-end-performance-state-management/RULE.md`                                    |
| Identity function selector            | Always transform data in selector                        | `.cursor/rules/front-end-performance-state-management/RULE.md`                                    |
| Cascading useEffect chains            | Combine effects or compute during render                 | `.cursor/rules/front-end-performance-hooks-effects/RULE.md`                                       |
| **E2E:** `driver.delay()` usage       | ⚠️ **Deprecated:** Use page object wait methods instead  | `.cursor/rules/e2e-testing-guidelines/RULE.md` ("Timing and Waits")                               |
| **E2E:** CSS class locator            | Use `data-testid` attribute                              | `.cursor/rules/e2e-testing-guidelines/RULE.md` ("Element Locators")                               |
| **E2E:** Raw driver calls             | Use page object methods                                  | `.cursor/rules/e2e-testing-guidelines/RULE.md` ("Page Object Model")                              |
| **E2E:** UI setup instead of fixtures | Use `FixtureBuilder` for state setup                     | `.cursor/rules/e2e-testing-guidelines/RULE.md` ("Controlling State")                              |

**Note:** For detailed examples and comprehensive guidelines, see the referenced rule files in `.cursor/rules/`.

## Configuration

CODEBOT automatically:

- ✅ Loads relevant cursor rules from `.cursor/rules/`
- ✅ Identifies file types
- ✅ Reads all changed files with `read_file`
- ✅ Applies appropriate checks based on rule files
- ✅ Provides contextual feedback with references to detailed guidelines
- ✅ Suggests actionable fixes with code examples
- ✅ Verifies all violations with evidence
- ✅ Ensures reproducible results

**Rule Files Reference:**

- `.cursor/rules/coding-guidelines/RULE.md` - General coding standards
- `.cursor/rules/unit-testing-guidelines/RULE.md` - Unit test patterns and best practices
- `.cursor/rules/e2e-testing-guidelines/RULE.md` - E2E test patterns, page objects, and deprecated patterns
- `.cursor/rules/controller-guidelines/RULE.md` - Controller architecture patterns
- `.cursor/rules/front-end-performance-rendering/RULE.md` - Rendering performance (keys, memoization, virtualization)
- `.cursor/rules/front-end-performance-hooks-effects/RULE.md` - Hooks & effects optimization
- `.cursor/rules/front-end-performance-react-compiler/RULE.md` - React Compiler considerations
- `.cursor/rules/front-end-performance-state-management/RULE.md` - Redux & state management

No configuration needed - it just works! When rules are updated in `.cursor/rules/`, CODEBOT automatically uses the latest guidelines.

## Tips for Best Results

1. **Run CODEBOT before creating PR** - Catch issues early in your changes
2. **Fix critical violations first** - They block merge
3. **Address high priority issues** - They improve code quality
4. **Consider suggestions** - They follow best practices
5. **Run again after fixes** - Verify all issues resolved
6. **Trust the evidence** - Every issue is backed by actual code from your changes
7. **Expect consistency** - Same changes = Same report
8. **Focus on your code** - Pre-existing issues in unchanged lines won't be reported

## Remember

CODEBOT analyzes **only the lines you changed** (not entire files), so:

- ✅ Fast analysis (only changed lines from git diff)
- ✅ Focused feedback (only code you introduced/modified)
- ✅ Fair assessment (pre-existing issues ignored)
- ✅ PR-specific (ready to merge?)
- ✅ No noise from existing code
- ✅ Evidence-based (every issue verified in changed lines)
- ✅ Reproducible (consistent results)

**Quality Guarantee:**

- Every violation has exact line numbers (from changed lines only)
- Every issue includes code snippets (from the diff)
- Every fix includes example code
- Every report is reproducible
- No assumptions or approximations
- No blame for pre-existing code

Happy coding! 🚀
