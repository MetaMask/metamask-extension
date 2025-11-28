---
description: Analyze code changes between current branch and main
---

# CODEBOT Command

Automated code quality enforcement that analyzes only the changes in your current branch compared to main.

## What This Command Does

1. **Detects changed files** between your current branch and main branch
2. **Categorizes files** by type (test, controller, redux, component, general)
3. **Applies relevant rules** from cursor guidelines
4. **Reports violations** with severity levels and fix suggestions
5. **Provides actionable feedback** for PR readiness
6. **Optional Deep Mode:** Performs exhaustive checks against all detailed guidelines when requested

## Arguments

| Argument | Description |
|----------|-------------|
| `--deep` | **Deep Analysis Mode:** Reads full rule files, checks architectural patterns, treats "Medium" issues as "High", and verifies edge cases. |

## Execution Steps

### Step 1: Get Changed Files

Run this command to identify changed files:

```bash
git diff --name-only main...HEAD
```

Parse the output to get the list of modified files. Focus only on:
- `.ts`, `.tsx`, `.js`, `.jsx` files
- Exclude: `node_modules/`, `dist/`, `build/`, `*.d.ts`

### Step 2: Categorize Files by Type

For each changed file, determine its type:

- **Test file**: Contains `.test.` in filename
- **Controller file**: Contains `Controller.ts` or `-controller.ts`
- **Redux file**: Contains `reducer`, `slice`, `actions`, or `selectors` in filename
- **Component file**: `.tsx` or `.jsx` in `ui/` directory
- **General file**: All other TypeScript/JavaScript files

### Step 3: Load Applicable Guidelines

For each file type, reference these cursor rules.

**If `--deep` argument is present:** You MUST use `read_file` to fetch the full content of the relevant rule files below. Do not rely solely on the checklists.

- **All files**: `.cursor/rules/coding-guidelines.mdc`
- **Test files**: `.cursor/rules/unit-testing-guidelines.mdc`
- **Controller files**: `.cursor/rules/controller-guidelines.mdc`
- **Redux files**: `.cursor/rules/front-end-performance-state-management.mdc`
- **Components**:
  - `.cursor/rules/coding-guidelines.mdc` (general React patterns)
  - `.cursor/rules/front-end-performance-rendering.mdc` (rendering performance - keys, memoization, virtualization)
  - `.cursor/rules/front-end-performance-hooks-effects.mdc` (hooks & effects)
  - `.cursor/rules/front-end-performance-react-compiler.mdc` (React Compiler considerations)

### Step 4: Analyze Each Changed File

For each file, check for violations across severity levels. **Reference `.cursor/rules/` files for comprehensive guidelines and examples.**

**Deep Mode Instructions:**
If running with `--deep`:
1. Check for architectural consistency (does this file match the patterns of surrounding files?).
2. Verify "Medium" priority checks as if they were "High".
3. Explicitly verify all naming conventions and type definitions.
4. Check for edge cases mentioned in the full rule files.

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
- [ ] **No multiple useSelector calls** for same state slice (combine into one)

**Component Files** → See `.cursor/rules/front-end-performance-rendering.mdc`, `.cursor/rules/front-end-performance-hooks-effects.mdc`, `.cursor/rules/front-end-performance-react-compiler.mdc`, and `.cursor/rules/coding-guidelines.mdc` for details:
- [ ] TypeScript (not JavaScript)
- [ ] Functional components (not classes)
- [ ] Props destructured in function parameters
- [ ] No `any` types
- [ ] No console.logs
- [ ] **No inline functions in JSX** (especially in `.map()`)
- [ ] **No inline objects in JSX** (style={{}}, options={{}})
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

### Step 5: Generate Report

Output the analysis in this format:

```
🤖 CODEBOT Analysis: [Current Branch] vs main
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 CHANGED FILES SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Changed Files: X
├─ Test Files: X
├─ Controller Files: X
├─ Redux Files: X
├─ Component Files: X
└─ General Files: X

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ CRITICAL VIOLATIONS (X found) - BLOCKS MERGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[For each critical violation:]

📁 File: path/to/file.ts

  1. [FAIL] Violation description
     Line: XX
     Current: [problematic code]
     Fix: [how to fix it]
     Rule: [which guideline]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  HIGH PRIORITY (X found) - REVIEW REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[For each high priority issue:]

📁 File: path/to/file.ts

  1. [WARN] Issue description
     Line: XX
     Suggestion: [recommendation]
     Impact: [why it matters]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 SUGGESTIONS (X found)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[For each suggestion:]

📁 File: path/to/file.ts

  1. [INFO] Suggestion description
     Line: XX
     Benefit: [improvement it provides]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ CLEAN FILES (passed all checks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ path/to/clean-file-1.ts
✓ path/to/clean-file-2.tsx
✓ path/to/clean-file-3.test.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 QUALITY METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Score: XX/100

Category Breakdown:
  Tests:       XX/100 [status]
  TypeScript:  XX/100 [status]
  Controllers: XX/100 [status]
  Redux:       XX/100 [status]
  Components:  XX/100 [status]

PR Readiness: [READY ✅ | NEEDS WORK ❌]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 ACTION ITEMS (Priority Order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CRITICAL - Must fix before merge:
  1. [File]: [Issue]
  2. [File]: [Issue]

🟡 HIGH - Should fix before merge:
  3. [File]: [Issue]
  4. [File]: [Issue]

🔵 MEDIUM - Consider for next iteration:
  5. [File]: [Issue]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[If critical violations exist:]
⛔ PR is NOT ready to merge. Fix critical violations first.

[If only high priority:]
⚠️  PR can merge but should address high priority issues.

[If only medium/low:]
✅ PR looks good! Consider addressing suggestions.

[If no violations:]
🎉 Perfect! All code quality checks passed.
```

## Analysis Rules by File Type

CODEBOT references detailed guidelines in `.cursor/rules/` for comprehensive rules and examples. This section provides quick checklists for what CODEBOT analyzes.

### Test Files (*.test.ts, *.test.tsx)

**Reference:** `.cursor/rules/unit-testing-guidelines.mdc`

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

**See `.cursor/rules/unit-testing-guidelines.mdc` for:**
- Detailed examples of correct vs incorrect test patterns
- Controller-specific testing patterns
- Mocking strategies
- Async testing best practices

### Controller Files (*Controller.ts, *-controller.ts)

**Reference:** `.cursor/rules/controller-guidelines.mdc`

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

**See `.cursor/rules/controller-guidelines.mdc` for:**
- Complete controller architecture patterns
- State metadata examples
- Messenger usage patterns
- Selector implementation examples

### Redux Files (*reducer.ts, *slice.ts, *actions.ts, *selectors.ts)

**Reference:** `.cursor/rules/front-end-performance-state-management.mdc` (for Redux patterns)

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

**See `.cursor/rules/front-end-performance-state-management.mdc` for:**
- Redux optimization patterns
- Selector memoization strategies
- State normalization examples

### Component Files (*.tsx, *.jsx)

**Reference:**
- `.cursor/rules/coding-guidelines.mdc` (general React patterns)
- `.cursor/rules/front-end-performance-rendering.mdc` (rendering performance)
- `.cursor/rules/front-end-performance-hooks-effects.mdc` (hooks & effects)
- `.cursor/rules/front-end-performance-react-compiler.mdc` (React Compiler considerations)

**CRITICAL Checks:**
- [ ] TypeScript (not JavaScript)
- [ ] Functional components (not classes)
- [ ] Props destructured in function parameters
- [ ] No `any` types
- [ ] No console.logs
- [ ] **No inline function creation in JSX** (especially in lists)
- [ ] **No inline object creation in JSX**
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

**See `.cursor/rules/front-end-performance-rendering.mdc` for:**
- Detailed examples of inline function/object violations
- Key usage patterns
- Virtualization examples
- React.memo usage guidelines

**See `.cursor/rules/front-end-performance-hooks-effects.mdc` for:**
- useEffect best practices
- When NOT to use useEffect
- Cleanup patterns

**See `.cursor/rules/front-end-performance-react-compiler.mdc` for:**
- React Compiler capabilities and limitations
- When manual memoization is still required (cross-file dependencies, Redux, external libraries)
- Decision tree for manual memoization needs
- Keep existing useMemo/useCallback for effect dependencies

**See `.cursor/rules/coding-guidelines.mdc` for:**
- Component structure patterns
- Props destructuring examples
- General React best practices
- File organization standards
- Naming conventions

## Usage Instructions

### In Cursor Chat

Simply type:
```
@CODEBOT
```

Or be more specific:
```
@CODEBOT analyze my changes
@CODEBOT --deep
@CODEBOT check PR readiness
@CODEBOT what violations do I have?
```

### Expected Output

CODEBOT will:
1. Identify all changed files in your branch
2. Analyze each file according to its type
3. Report violations with severity levels
4. Suggest fixes for each issue
5. Give you a PR readiness assessment

### Integration with Workflow

**Before committing:**
```
@CODEBOT check my changes
```

**Before creating PR:**
```
@CODEBOT am I ready for PR?
```

**After code review feedback:**
```
@CODEBOT verify fixes
```

## Severity Levels

### 🔴 CRITICAL (Exit Code 1)
- **Blocks merge**
- Must be fixed before PR approval
- Violates essential code quality rules
- Can cause bugs or break conventions

### 🟡 HIGH (Exit Code 0 with warnings)
- **Should fix before merge**
- Violates strong recommendations
- May cause maintenance issues
- Should be addressed in PR review

### 🔵 MEDIUM (Exit Code 0)
- **Consider fixing**
- Suggestions for improvement
- Best practices recommendations
- Can be addressed later

## Quick Reference

### Common Violations & Fixes

| Violation | Fix | Reference |
|-----------|-----|-----------|
| Test name has "should" | Remove "should", use present tense | `.cursor/rules/unit-testing-guidelines.mdc` |
| Direct state mutation | Use `this.update()` in controllers | `.cursor/rules/controller-guidelines.mdc` |
| Missing BaseController | Extend from BaseController | `.cursor/rules/controller-guidelines.mdc` |
| Using `any` type | Add explicit types | `.cursor/rules/coding-guidelines.mdc` |
| Class component | Convert to functional component | `.cursor/rules/coding-guidelines.mdc` |
| Props not destructured | Destructure in function params | `.cursor/rules/coding-guidelines.mdc` |
| Console.log in code | Remove debug statements | `.cursor/rules/coding-guidelines.mdc` |
| No state metadata | Add metadata with persist/anonymous/usedInUi | `.cursor/rules/controller-guidelines.mdc` |
| Getter method in controller | Export as selector function | `.cursor/rules/controller-guidelines.mdc` |
| Redux state mutation | Use Redux Toolkit or immutable updates | `.cursor/rules/front-end-performance-state-management.mdc` |
| Inline function in list | Use useCallback, pass stable reference | `.cursor/rules/front-end-performance-rendering.mdc` |
| Inline object in JSX | Define constant outside component or use useMemo | `.cursor/rules/front-end-performance-rendering.mdc` |
| Index as key | Use unique ID from data (item.id, item.address) | `.cursor/rules/front-end-performance-rendering.mdc` |
| Missing memoization | Wrap expensive calculation in useMemo | `.cursor/rules/front-end-performance-rendering.mdc` |
| useEffect for derived state | Calculate during render instead | `.cursor/rules/front-end-performance-hooks-effects.mdc` |
| JSON.stringify in dependencies | Use useEqualityCheck or normalize to primitives | `.cursor/rules/front-end-performance-hooks-effects.mdc` |
| Missing dependencies in hooks | Include all dependencies (use ESLint rule) | `.cursor/rules/front-end-performance-hooks-effects.mdc` |
| Hooks called conditionally | Call hooks unconditionally, use conditional logic inside | `.cursor/rules/front-end-performance-hooks-effects.mdc` |
| No useEffect cleanup | Add cleanup for intervals/subscriptions/fetch | `.cursor/rules/front-end-performance-hooks-effects.mdc` |
| Inline selector functions | Extract to memoized selectors | `.cursor/rules/front-end-performance-state-management.mdc` |
| Multiple useSelector calls | Combine into single selector | `.cursor/rules/front-end-performance-state-management.mdc` |
| Identity function selector | Always transform data in selector | `.cursor/rules/front-end-performance-state-management.mdc` |
| Cascading useEffect chains | Combine effects or compute during render | `.cursor/rules/front-end-performance-hooks-effects.mdc` |

**Note:** For detailed examples and comprehensive guidelines, see the referenced rule files in `.cursor/rules/`.

## Configuration

CODEBOT automatically:
- ✅ Loads relevant cursor rules from `.cursor/rules/`
- ✅ Identifies file types
- ✅ Applies appropriate checks based on rule files
- ✅ Provides contextual feedback with references to detailed guidelines
- ✅ Suggests actionable fixes

**Rule Files Reference:**
- `.cursor/rules/coding-guidelines.mdc` - General coding standards
- `.cursor/rules/unit-testing-guidelines.mdc` - Test patterns and best practices
- `.cursor/rules/controller-guidelines.mdc` - Controller architecture patterns
- `.cursor/rules/front-end-performance-rendering.mdc` - Rendering performance (keys, memoization, virtualization)
- `.cursor/rules/front-end-performance-hooks-effects.mdc` - Hooks & effects optimization
- `.cursor/rules/front-end-performance-react-compiler.mdc` - React Compiler considerations
- `.cursor/rules/front-end-performance-state-management.mdc` - Redux & state management

No configuration needed - it just works! When rules are updated in `.cursor/rules/`, CODEBOT automatically uses the latest guidelines.

## Tips for Best Results

1. **Run CODEBOT before creating PR** - Catch issues early
2. **Fix critical violations first** - They block merge
3. **Address high priority issues** - They improve code quality
4. **Consider suggestions** - They follow best practices
5. **Run again after fixes** - Verify all issues resolved

## Remember

CODEBOT analyzes **only your changes** (current branch vs main), so:
- ✅ Fast analysis (only changed files)
- ✅ Focused feedback (your code only)
- ✅ PR-specific (ready to merge?)
- ✅ No noise from existing code

Happy coding! 🚀
