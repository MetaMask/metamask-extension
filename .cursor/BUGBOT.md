  # BUGBOT Rules

## Core Mission

Automated test quality enforcement and bug detection for MetaMask Extension codebase

## Execution Protocol

### 1. General Coding Guidelines

- **ALWAYS** load and reference [coding-guidelines](rules/coding-guidelines/RULE.md)
- Applies to all files (alwaysApply: true)
- Check for TypeScript usage in new code
- Verify functional components and hooks are used in React
- Check for proper component optimization (memoization, useEffect usage)
- Verify object destructuring for props
- Check file organization patterns
- Verify naming conventions (PascalCase for components, camelCase for functions, `use` prefix for hooks, `with` prefix for HOCs)
- Check code reusability (DRY principle)
- Verify documentation requirements (TSDoc for utilities, README for components)
- Ensure tests are written for all components and utilities
- Verify external packages are well-maintained and necessary

Use the rules in the [coding-guidelines](rules/coding-guidelines/RULE.md) to enforce the test quality and bug detection.

### 2. Unit Tests

- **ALWAYS** load and reference [unit testing guidelines](rules/unit-testing-guidelines/RULE.md)
- Verify test file naming pattern: `*.test.{ts,tsx,js,jsx}`
- Check for proper Jest and testing library imports
- Ensure tests are colocated with implementation files

Use the rules in the [unit testing guidelines](rules/unit-testing-guidelines/RULE.md) to enforce the test quality and bug detection.

### 3. E2E Tests

- **ALWAYS** load and reference [e2e-testing-guidelines](rules/e2e-testing-guidelines/RULE.md)
- Verify test file naming pattern: `test/e2e/**/*.spec.{ts,js}`
- Check for proper imports from the E2E framework
- Verify Page Object Model pattern is used
- Ensure tests are written in TypeScript (.spec.ts)

Use the rules in the [e2e-testing-guidelines](rules/e2e-testing-guidelines/RULE.md) to enforce the test quality and bug detection.

### 4. Controller Guidelines

- **ALWAYS** load and reference [controller-guidelines](rules/controller-guidelines/RULE.md)
- Auto-detect controller files based on naming patterns: `*Controller.ts`, `*Controller.js`, `*-controller.ts`, `*-controller.js`
- Only apply when analyzing controller files
- Verify controller inherits from BaseController
- Verify that controller has state
- Check state management patterns (partial state acceptance, default state functions, state metadata)
- Verify constructor uses single options bag pattern
- Check for messenger usage instead of callbacks for inter-controller communication
- Verify selectors are used instead of getter methods for derived state
- Check that action methods model high-level user actions, not low-level setters
- Verify minimal state (no derived values stored)
- Check proper lifecycle management (initialization, cleanup in `destroy()`)

Use the rules in the [controller-guidelines](rules/controller-guidelines/RULE.md) to enforce the test quality and bug detection.

### 5. Front-End Performance Guidelines

#### 5.1 Hooks & Effects Optimization

- **ALWAYS** load and reference [front-end-performance-hooks-effects](rules/front-end-performance-hooks-effects/RULE.md)
- Auto-detect files: `use*.{ts,tsx,js,jsx}`, `*.{tsx,jsx}`
- Check useEffect usage patterns, dependency management (never use JSON.stringify)
- Verify cleanup functions for intervals, subscriptions, and async operations
- Ensure proper hook usage (unconditional calls, refs for persistent values)

Use the rules in the [front-end-performance-hooks-effects](rules/front-end-performance-hooks-effects/RULE.md) to enforce the test quality and bug detection.

#### 5.2 React Compiler & Anti-Patterns

- **ALWAYS** load and reference [front-end-performance-react-compiler](rules/front-end-performance-react-compiler/RULE.md)
- Auto-detect files: `*.{tsx,jsx,ts,js}`
- Verify manual memoization for cross-file dependencies, Redux selectors, and external state
- Keep existing useMemo/useCallback for effect dependencies
- Check proper list keys and avoid over-memoization

Use the rules in the [front-end-performance-react-compiler](rules/front-end-performance-react-compiler/RULE.md) to enforce the test quality and bug detection.

#### 5.3 Rendering Performance

- **ALWAYS** load and reference [front-end-performance-rendering](rules/front-end-performance-rendering/RULE.md)
- Auto-detect files: `*.{tsx,jsx,ts,js}`
- Verify unique keys, virtualization for long lists, and React.memo usage
- Check code splitting (React.lazy/Suspense) and pagination patterns
- Ensure expensive computations use useMemo or Redux selectors

Use the rules in the [front-end-performance-rendering](rules/front-end-performance-rendering/RULE.md) to enforce the test quality and bug detection.

#### 5.4 State Management & Redux

- **ALWAYS** load and reference [front-end-performance-state-management](rules/front-end-performance-state-management/RULE.md)
- Auto-detect files: `*selector*.{ts,js}`, `*reducer*.{ts,js}`, `*ducks*.{ts,js}`, `*slice*.{ts,js}`
- Verify immutable reducers, no side effects, and serializable state
- Check normalized state structure (byId/allIds) and proper selector memoization
- Ensure efficient selector patterns (avoid Object.values() without memoization, combine multiple useSelector calls)

Use the rules in the [front-end-performance-state-management](rules/front-end-performance-state-management/RULE.md) to enforce the test quality and bug detection.
