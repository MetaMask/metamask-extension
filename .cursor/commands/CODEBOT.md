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

For each file type, reference these cursor rules:

- **All files**: `.cursor/rules/coding-guidelines.mdc`
- **Test files**: `.cursor/rules/unit-testing-guidelines.mdc`
- **Controller files**: `.cursor/rules/controller-guidelines.mdc`
- **Redux files**: `.cursor/rules/redux-guidelines.mdc`
- **Components**: React guidelines from `.cursor/rules/coding-guidelines.mdc` + `.cursor/rules/react-performance-guidelines.mdc`

### Step 4: Analyze Each Changed File

For each file, check for violations across severity levels:

#### 🔴 CRITICAL (FAIL - Blocks Merge)

**Test Files:**
- [ ] No "should" in test names
- [ ] AAA pattern (Arrange, Act, Assert) followed
- [ ] Each test has one clear purpose
- [ ] No `any` types
- [ ] External dependencies mocked
- [ ] Jest mocks used (not Sinon)

**Controller Files:**
- [ ] Extends `BaseController`
- [ ] Exports `getDefault${ControllerName}State`
- [ ] State metadata defined (persist, anonymous, usedInUi)
- [ ] All state updates use `this.update()`
- [ ] No direct state mutations
- [ ] Messenger types defined
- [ ] No callbacks in constructor

**Redux Files:**
- [ ] No state mutations in reducers
- [ ] No side effects in reducers
- [ ] No non-serializable values
- [ ] Using Redux Toolkit (`createSlice`)
- [ ] Proper TypeScript types

**Component Files:**
- [ ] TypeScript (not JavaScript)
- [ ] Functional components (not classes)
- [ ] Props destructured
- [ ] No `any` types
- [ ] No console.logs
- [ ] No inline function creation in JSX (especially in lists)
- [ ] No inline object creation in JSX
- [ ] No index as key in dynamic lists
- [ ] No class components (must use functional with hooks)

**All Files:**
- [ ] TypeScript for new code
- [ ] No `@ts-ignore` without explanation
- [ ] Explicit types for function params and returns
- [ ] No unused imports
- [ ] No commented-out code

#### 🟡 HIGH (Should Fix Before Merge)

**Test Files:**
- Tests are independent
- Test data is realistic
- Edge cases tested
- Error paths tested

**Controller Files:**
- Selectors exported (not getter methods)
- Methods are actions (not setters)
- State is minimal
- Has `destroy()` if cleanup needed

**Redux Files:**
- State is normalized
- Selectors use `select` prefix
- Using `createAsyncThunk` for async
- Actions follow Flux Standard Action

**Component Files:**
- Component size reasonable (<200 lines)
- `useMemo` for expensive computations (sorting, filtering large arrays)
- `useCallback` for callbacks passed to children
- `useEffect` has proper cleanup
- Memoized components (React.memo) for frequently rendered items
- No expensive calculations without memoization
- Static objects/styles defined outside component
- List virtualization for 100+ items

#### 🔵 MEDIUM (Consider Fixing)

**All Files:**
- Functions are focused
- No deep nesting (max 3-4 levels)
- Early returns used
- TSDoc comments on public APIs
- Naming follows conventions
- No duplicated code (DRY)

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

### Test Files (*.test.ts, *.test.tsx)

**Check for:**
1. Test naming: No "should", present tense, action-oriented
2. Test structure: AAA pattern with blank lines
3. Test focus: One assertion per test
4. Mocking: Jest mocks, all externals mocked
5. Async handling: Proper async/await, no dangling promises
6. Test data: Realistic, not foo/bar/test
7. Coverage: Happy path, error cases, edge cases

**Example violations:**

```typescript
❌ WRONG:
it('should render correctly', () => { ... });

✅ CORRECT:
it('renders token list with balances', () => { ... });

❌ WRONG:
it('updates state', () => {
  const result = updateState();
  expect(result).toBeDefined();
  expect(result.count).toBe(1);
  expect(result.items).toHaveLength(2);
});

✅ CORRECT:
it('updates state count', () => {
  const result = updateState();
  expect(result.count).toBe(1);
});

it('adds items to state', () => {
  const result = updateState();
  expect(result.items).toHaveLength(2);
});
```

### Controller Files (*Controller.ts)

**Check for:**
1. Extends BaseController
2. Has `getDefault${Name}State` function
3. State metadata defined
4. Uses `this.update()` for state changes
5. No direct mutations
6. Messenger instead of callbacks
7. Selectors instead of getters
8. Action methods instead of setters

**Example violations:**

```typescript
❌ WRONG:
class TokensController {
  constructor(options) {
    this.state = options.state || {};
  }

  addToken(token) {
    this.state.tokens.push(token); // Direct mutation!
  }
}

✅ CORRECT:
class TokensController extends BaseController<...> {
  constructor(options) {
    super({
      name: 'TokensController',
      metadata: tokensControllerMetadata,
      messenger: options.messenger,
      state: { ...getDefaultTokensControllerState(), ...options.state },
    });
  }

  addToken(token: Token) {
    this.update((state) => {
      state.tokens.push(token); // Immer makes this safe
    });
  }
}

export function getDefaultTokensControllerState() {
  return { tokens: [] };
}
```

### Redux Files (*reducer.ts, *slice.ts)

**Check for:**
1. No state mutations (unless using Redux Toolkit)
2. No side effects in reducers
3. Using Redux Toolkit (createSlice)
4. Proper action types (domain/eventName)
5. Selectors with `select` prefix
6. Normalized state for complex data
7. No form state in Redux

**Example violations:**

```typescript
❌ WRONG:
function todosReducer(state = [], action) {
  switch (action.type) {
    case 'ADD_TODO':
      state.push(action.payload); // Mutation!
      return state;
  }
}

✅ CORRECT:
const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    todoAdded: (state, action) => {
      state.push(action.payload); // Safe with Immer
    },
  },
});
```

### Component Files (*.tsx, *.jsx)

**Check for:**
1. TypeScript (not JavaScript)
2. Functional components (not classes)
3. Props destructured
4. Proper hook usage
5. Memoization where needed
6. No unnecessary useEffect
7. Proper cleanup in useEffect
8. **Performance optimizations** (see React Performance Guidelines)

**Example violations:**

```typescript
❌ WRONG:
class TokenList extends React.Component {
  render() {
    return <div>{this.props.tokens.map(...)}</div>;
  }
}

✅ CORRECT:
const TokenList = ({ tokens }: TokenListProps) => {
  return <div>{tokens.map(...)}</div>;
};

❌ WRONG:
const TokenList = (props: TokenListProps) => {
  return <div>{props.tokens.map(...)}</div>;
};

✅ CORRECT:
const TokenList = ({ tokens }: TokenListProps) => {
  return <div>{tokens.map(...)}</div>;
};
```

### React Performance Checks (*.tsx, *.jsx)

Reference: `.cursor/rules/react-performance-guidelines.mdc`

**CRITICAL Performance Violations:**

1. **Inline Functions in Lists** - Creates new function on every render
   ```typescript
   ❌ WRONG:
   {items.map(item => (
     <Item onClick={() => handleClick(item.id)} />
   ))}

   ✅ CORRECT:
   const handleClick = useCallback((id) => { /* ... */ }, []);
   {items.map(item => (
     <Item onClick={handleClick} itemId={item.id} />
   ))}
   ```

2. **Inline Objects in JSX** - Creates new object on every render
   ```typescript
   ❌ WRONG:
   <Box style={{ padding: 16, margin: 8 }} />

   ✅ CORRECT:
   const BOX_STYLE = { padding: 16, margin: 8 };
   <Box style={BOX_STYLE} />
   ```

3. **Index as Key in Dynamic Lists** - Breaks React reconciliation
   ```typescript
   ❌ WRONG:
   {items.map((item, index) => <Item key={index} />)}

   ✅ CORRECT:
   {items.map(item => <Item key={item.id} />)}
   ```

4. **Missing Memoization for Expensive Operations**
   ```typescript
   ❌ WRONG:
   const sorted = items.sort((a, b) => a.value - b.value);

   ✅ CORRECT:
   const sorted = useMemo(
     () => items.sort((a, b) => a.value - b.value),
     [items]
   );
   ```

5. **useEffect for Derived State** - Should calculate during render
   ```typescript
   ❌ WRONG:
   const [displayName, setDisplayName] = useState('');
   useEffect(() => {
     setDisplayName(`${token.symbol} (${token.name})`);
   }, [token]);

   ✅ CORRECT:
   const displayName = `${token.symbol} (${token.name})`;
   ```

**HIGH Priority Performance Issues:**

- Component size >200 lines (should be broken down)
- Missing React.memo on frequently rendered components
- Missing useCallback for callbacks passed to children
- No virtualization for lists with 100+ items
- Expensive calculations in component body without useMemo
- Large state objects that should be split
- Context values not memoized

**MEDIUM Priority Performance Issues:**

- Components that could benefit from code splitting
- Missing cleanup in useEffect
- Too many dependencies in useMemo/useCallback
- Premature optimization (memoizing simple operations)

## Usage Instructions

### In Cursor Chat

Simply type:
```
@CODEBOT
```

Or be more specific:
```
@CODEBOT analyze my changes
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

| Violation | Fix |
|-----------|-----|
| Test name has "should" | Remove "should", use present tense |
| Direct state mutation | Use `this.update()` in controllers |
| Missing BaseController | Extend from BaseController |
| Using `any` type | Add explicit types |
| Class component | Convert to functional component |
| Props not destructured | Destructure in function params |
| Console.log in code | Remove debug statements |
| No state metadata | Add metadata with persist/anonymous/usedInUi |
| Getter method in controller | Export as selector function |
| Redux state mutation | Use Redux Toolkit or immutable updates |
| Inline function in list | Use useCallback, pass stable reference |
| Inline object in JSX | Define constant outside component or use useMemo |
| Index as key | Use unique ID from data (item.id, item.address) |
| Missing memoization | Wrap expensive calculation in useMemo |
| useEffect for derived state | Calculate during render instead |
| Class component | Convert to functional component with hooks |

## Configuration

CODEBOT automatically:
- ✅ Loads relevant cursor rules
- ✅ Identifies file types
- ✅ Applies appropriate checks
- ✅ Provides contextual feedback
- ✅ Suggests actionable fixes

No configuration needed - it just works!

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
