---
description: Front-End Performance Rules - React Compiler & Anti-Patterns
globs: '*.tsx,*.jsx,*.ts,*.js'
alwaysApply: false
---

# Front-End Performance Rules: React Compiler & Anti-Patterns

This file covers React Compiler considerations and common performance anti-patterns. React Compiler automatically optimizes React applications, but manual memoization is still required in certain cases.

**Note:** This codebase uses React Compiler, a build-time tool that automatically optimizes React applications by memoizing components and hooks. React Compiler understands the Rules of React and works with existing JavaScript/TypeScript code without requiring rewrites.

**Reference:** React Compiler Introduction

### What React Compiler Does

React Compiler automatically applies memoization to improve update performance (re-renders). It focuses on two main use cases:

1. Skipping cascading re-rendering of components - Fine-grained reactivity where only changed parts re-render
2. Skipping expensive calculations - Memoizing expensive computations within components and hooks

**Example: Automatic Fine-Grained Reactivity**

```typescript
// React Compiler automatically prevents unnecessary re-renders
function FriendList({ friends }) {
  const onlineCount = useFriendOnlineCount();

  if (friends.length === 0) {
    return <NoFriends />;
  }

  return (
    <div>
      <span>{onlineCount} online</span>
      {friends.map((friend) => (
        <FriendListCard key={friend.id} friend={friend} />
      ))}
      <MessageButton /> {/* Won't re-render when onlineCount changes! */}
    </div>
  );
}
```

**Example: Automatic Memoization of Expensive Calculations**

```typescript
// React Compiler automatically memoizes expensive computations
function TableContainer({ items }) {
  // This expensive calculation is automatically memoized
  const data = expensivelyProcessAReallyLargeArrayOfObjects(items);
  return <Table data={data} />;
}
```

**Note:** For truly expensive functions used across multiple components, consider implementing memoization outside React, as React Compiler only memoizes within components/hooks and doesn't share memoization across components.

### React Compiler Assumptions

React Compiler assumes your code:

- Is valid, semantic JavaScript
- Tests nullable/optional values before accessing (e.g., enable strictNullChecks in TypeScript)
- Follows the Rules of React

React Compiler can verify many Rules of React statically and will skip compilation when it detects errors. Install eslint-plugin-react-compiler to see compilation errors.

### React Compiler Limitations

#### Single-File Compilation

React Compiler operates on a single file at a time - it only uses information within that file to perform optimizations. This means:

- Works well for most React code (React's programming model uses plain JavaScript values)
- Cannot see across file boundaries
- Cannot use TypeScript/Flow type information (has its own internal type system)
- Cannot optimize based on information from other files

**Impact:** Code that depends on values from other files may not be optimized as effectively.

#### Effects and Dependency Memoization (Open Research Area)

Effects memoization is still an open area of research. React Compiler can sometimes memoize differently from manual memoization, which can cause issues with effects that rely on dependencies not changing to prevent infinite loops.

**Recommendation:**

- Keep existing useMemo() and useCallback() calls - Especially for effect dependencies to ensure behavior doesn't change
- Write new code without useMemo/useCallback - Let React Compiler handle it automatically
- React Compiler will statically validate that auto-memoization matches existing manual memoization
- If it can't prove they're the same, the component/hook is safely skipped over

**Example - CORRECT: Keep existing useMemo for effect dependencies**

```typescript
const TokenBalance = ({ address }: Props) => {
  const network = useSelector(getNetwork);

  // Keep useMemo to ensure effect behavior is preserved
  const networkConfig = useMemo(
    () => ({
      chainId: network.chainId,
      rpcUrl: network.rpcUrl,
    }),
    [network.chainId, network.rpcUrl],
  );

  useEffect(() => {
    fetchBalance(address, networkConfig);
  }, [address, networkConfig]); // Stable reference prevents infinite loops
};
```

**Example - CORRECT: New code - no manual memoization needed**

```typescript
const TokenList = ({ tokens }: TokenListProps) => {
  // React Compiler handles this automatically
  const sortedTokens = tokens
    .slice()
    .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));

  return (
    <div>
      {sortedTokens.map(token => (
        <TokenItem key={token.address} token={token} />
      ))}
    </div>
  );
};
```

### When Manual Memoization is Still Required

Due to React Compiler's single-file compilation limitation and inability to see across file boundaries, manual memoization is required for:

#### 1. Cross-File Dependencies

**DO:**

- Use manual memoization for computations that depend on values from other files

**DON'T:**

- Rely on React Compiler to optimize cross-file dependencies

**Example - WRONG:**

```typescript
// file1.ts
export const getProcessedTokens = (tokens: Token[]) => {
  return tokens.map(/* expensive processing */);
};

// file2.tsx
import { getProcessedTokens } from './file1';

const AssetList = () => {
  const tokens = useSelector(getTokens);

  // React Compiler can't see into getProcessedTokens from another file
  const processed = getProcessedTokens(tokens); // Runs on every render!
};
```

**Example - CORRECT:**

```typescript
const AssetList = () => {
  const tokens = useSelector(getTokens);

  // Manual memoization required - function from another file
  const processed = useMemo(() => getProcessedTokens(tokens), [tokens]);
};
```

**Why:** React Compiler only sees code within the current file. Functions imported from other files are opaque.

#### 2. Redux Selectors and External State Management

**DO:**

- Use manual memoization for Redux-derived values

**DON'T:**

- Rely on React Compiler to optimize Redux selectors

**Example - WRONG:**

```typescript
const AssetList = () => {
  const tokens = useSelector(getTokens); // External state
  const balances = useSelector(getBalances); // External state

  // React Compiler can't see into Redux - manual memoization needed
  const tokensWithBalances = tokens.map((token) => ({
    ...token,
    balance: balances[token.address],
  }));
};
```

**Example - CORRECT:**

```typescript
const AssetList = () => {
  const tokens = useSelector(getTokens);
  const balances = useSelector(getBalances);

  // Manual memoization required - React Compiler can't optimize Redux values
  const tokensWithBalances = useMemo(
    () =>
      tokens.map((token) => ({
        ...token,
        balance: balances[token.address],
      })),
    [tokens, balances],
  );
};
```

**Why:** Redux selectors return values from outside React's compilation scope. React Compiler operates on single files and can't track changes to external state.

#### 3. Values from External Hooks or Libraries

**DO:**

- Use manual memoization for values returned from hooks in external libraries or custom hooks defined in other files

**Example - WRONG:**

```typescript
// hooks.ts (different file)
export function useTokenTracker({ tokens }) {
  // Complex logic using Redux, context, etc.
  return { tokensWithBalances: /* ... */ };
}

// component.tsx
import { useTokenTracker } from './hooks';

const TokenTracker = ({ tokens }: Props) => {
  const { tokensWithBalances } = useTokenTracker({ tokens }); // External hook

  // React Compiler can't see into useTokenTracker from another file
  const formattedTokens = tokensWithBalances.map(token => ({
    ...token,
    formattedBalance: formatCurrency(token.balance),
  }));
};
```

**Example - CORRECT:**

```typescript
const TokenTracker = ({ tokens }: Props) => {
  const { tokensWithBalances } = useTokenTracker({ tokens });

  // Manual memoization required - hook from another file
  const formattedTokens = useMemo(
    () =>
      tokensWithBalances.map((token) => ({
        ...token,
        formattedBalance: formatCurrency(token.balance),
      })),
    [tokensWithBalances, formatCurrency],
  );
};
```

**Why:** React Compiler operates on single files. Hooks defined in other files are opaque, especially if they use Redux, context, or other external state.

#### 4. Conditional Logic with External State

**DO:**

- Use manual memoization when conditional logic combines props/state with external state

**Example - WRONG:**

```typescript
const AssetPicker = ({ hideZeroBalance }: Props) => {
  const tokens = useSelector(getTokens); // External state
  const balances = useSelector(getBalances); // External state

  // Conditional filtering - React Compiler may not optimize this
  const filteredTokens = hideZeroBalance
    ? tokens.filter((t) => balances[t.address] > 0)
    : tokens;
};
```

**Example - CORRECT:**

```typescript
const AssetPicker = ({ hideZeroBalance }: Props) => {
  const tokens = useSelector(getTokens);
  const balances = useSelector(getBalances);

  // Manual memoization required - conditional + external state
  const filteredTokens = useMemo(
    () =>
      hideZeroBalance ? tokens.filter((t) => balances[t.address] > 0) : tokens,
    [hideZeroBalance, tokens, balances],
  );
};
```

**Why:** React Compiler can optimize simple conditionals based on props/state within the same file, but struggles when combined with external state from other files.

#### 5. Functions Passed to Third-Party Components

**DO:**

- Use manual useCallback when passing functions to components from external libraries

**Example - WRONG:**

```typescript
import { ThirdPartyList } from 'some-library'; // External library

const TokenList = ({ tokens, onSelect }: Props) => {
  const dispatch = useDispatch();

  // React Compiler can't see into third-party component from node_modules
  return (
    <ThirdPartyList
      items={tokens}
      onItemClick={(token) => {
        dispatch(selectToken(token));
        onSelect(token);
      }}
    />
  );
};
```

**Example - CORRECT:**

```typescript
const TokenList = ({ tokens, onSelect }: Props) => {
  const dispatch = useDispatch();

  // Manual useCallback required - external component from another file/library
  const handleItemClick = useCallback(
    (token: Token) => {
      dispatch(selectToken(token));
      onSelect(token);
    },
    [dispatch, onSelect]
  );

  return (
    <ThirdPartyList items={tokens} onItemClick={handleItemClick} />
  );
};
```

**Why:** React Compiler operates on single files. Components from node_modules or other files are opaque and cannot be analyzed.

#### 6. Computations Dependent on Refs or DOM Values

**DO:**

- Use manual memoization when computations depend on useRef values, DOM queries, or other mutable values

**Example - WRONG:**

```typescript
const TokenInput = ({ tokens }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState('');

  // React Compiler can't track ref.current changes statically
  const filteredTokens = tokens.filter((token) => {
    const inputValue = inputRef.current?.value || filter;
    return token.symbol.includes(inputValue);
  });
};
```

**Example - CORRECT:**

```typescript
const TokenInput = ({ tokens }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState('');

  // Manual memoization required - refs are mutable
  const filteredTokens = useMemo(() => {
    const inputValue = inputRef.current?.value || filter;
    return tokens.filter((token) => token.symbol.includes(inputValue));
  }, [tokens, filter]); // Note: ref.current not in deps (intentional)
};
```

**Why:** Refs are mutable values that React Compiler cannot track statically. DOM queries and other runtime values also cannot be analyzed at compile time.

#### 7. Reselect Selectors and Complex Compositions

**DO:**

- Use Reselect selectors (already memoized) when available
- Use manual memoization if selector not available

**Example - WRONG:**

```typescript
// selectors.ts (different file)
export const selectTotalBalance = createSelector(
  [getAccounts, getBalances],
  (accounts, balances) =>
    accounts.reduce((sum, acc) => sum + balances[acc.address], 0),
);

// component.tsx
import { selectTotalBalance } from './selectors';

const Dashboard = () => {
  const accounts = useSelector(getAccounts);
  const balances = useSelector(getBalances);

  // React Compiler can't see into selectTotalBalance from another file
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + balances[acc.address],
    0,
  );
};
```

**Example - CORRECT:**

```typescript
// Option 1: Use Reselect selector (preferred - already memoized)
const Dashboard = () => {
  const totalBalance = useSelector(selectTotalBalance); // Reselect handles memoization
};

// Option 2: Manual memoization if selector not available
const Dashboard = () => {
  const accounts = useSelector(getAccounts);
  const balances = useSelector(getBalances);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, acc) => sum + balances[acc.address], 0),
    [accounts, balances],
  );
};
```

**Why:** Reselect selectors defined in other files are opaque to React Compiler. However, Reselect already provides memoization, so this is often not an issue.

#### 8. Effect Dependencies (Keep Existing Memoization)

**DO:**

- Keep existing useMemo/useCallback for effect dependencies

**DON'T:**

- Remove existing memoization for effect dependencies

**Example - CORRECT:**

```typescript
const TokenBalance = ({ address }: Props) => {
  const [balance, setBalance] = useState('0');
  const network = useSelector(getNetwork);

  // Keep useMemo to ensure effect behavior is preserved
  const networkConfig = useMemo(
    () => ({
      chainId: network.chainId,
      rpcUrl: network.rpcUrl,
    }),
    [network.chainId, network.rpcUrl],
  );

  useEffect(() => {
    // Stable networkConfig reference prevents infinite loops
    fetchBalance(address, networkConfig);
  }, [address, networkConfig]);
};
```

**Why:** React Compiler will statically validate that auto-memoization matches existing manual memoization. If it can't prove they're the same, it safely skips compilation. To ensure effect behavior doesn't change, keep existing useMemo/useCallback calls for effect dependencies.

**Recommendation:**

- Keep existing useMemo/useCallback for effects
- Write new code without manual memoization (let React Compiler handle it)
- If you notice unexpected effect behavior, file an issue

#### 9. Context Values from External Providers

**DO:**

- Use manual memoization if computation is expensive when consuming context from providers defined in other files

**Example - WRONG:**

```typescript
// context.tsx (different file)
export const ExternalI18nContext = createContext(/* ... */);

// component.tsx
import { ExternalI18nContext } from './context';

const TokenDisplay = ({ token }: Props) => {
  const { formatCurrency, locale } = useContext(ExternalI18nContext);

  // React Compiler may not optimize context values from another file
  const formattedBalance = formatCurrency(token.balance, locale);
};
```

**Example - CORRECT:**

```typescript
const TokenDisplay = ({ token }: Props) => {
  const { formatCurrency, locale } = useContext(ExternalI18nContext);

  // Manual memoization if this computation is expensive
  const formattedBalance = useMemo(
    () => formatCurrency(token.balance, locale),
    [formatCurrency, token.balance, locale],
  );
};
```

**Why:** Context providers defined in other files may not be fully analyzed by React Compiler. However, simple context consumption often works fine without manual memoization.

#### 10. Computations with Multiple Cross-File Dependencies

**DO:**

- Use manual memoization when computations combine multiple external sources from different files

**Example - WRONG:**

```typescript
import { formatCurrency } from './utils'; // External function
import { CurrencyContext } from './context'; // External context

const AssetCard = ({ assetId }: Props) => {
  const asset = useSelector((state) => selectAsset(state, assetId)); // Redux
  const { locale } = useContext(CurrencyContext); // Context from another file

  // Multiple external dependencies from different files
  const displayData = {
    name: asset.name,
    balance: formatCurrency(asset.balance, locale), // Function from another file
  };
};
```

**Example - CORRECT:**

```typescript
const AssetCard = ({ assetId }: Props) => {
  const asset = useSelector((state) => selectAsset(state, assetId));
  const { locale } = useContext(CurrencyContext);

  // Manual memoization required - multiple external sources from different files
  const displayData = useMemo(
    () => ({
      name: asset.name,
      balance: formatCurrency(asset.balance, locale),
    }),
    [asset, locale], // formatCurrency is stable if from another file
  );
};
```

**Why:** React Compiler can optimize simple prop/state combinations within a single file, but struggles with complex dependency chains spanning multiple files.

### Decision Tree: Do You Need Manual Memoization?

**Is the computation/value:**

- From another file (imported function/hook)? → ✅ Manual memoization required
- From Redux selectors? → ✅ Manual memoization required
- From external library (node_modules)? → ✅ Manual memoization required
- Used as useEffect dependency? → ✅ Keep existing useMemo/useCallback
- Depends on refs or DOM values? → ✅ Manual memoization required
- Combines multiple cross-file dependencies? → ✅ Manual memoization required
- Simple props/state within same file? → ❌ React Compiler handles it

**Is the callback:**

- Used as useEffect dependency? → ✅ Keep existing useCallback
- Passed to external component/library? → ✅ Manual useCallback required
- Depends on imported functions/hooks? → ✅ Manual useCallback required
- Simple prop handler within file? → ❌ React Compiler handles it

### Summary: React Compiler Capabilities and Limitations

**React Compiler CAN optimize:**

- Components and hooks within the same file
- Expensive calculations within components/hooks
- Fine-grained reactivity (preventing cascading re-renders)
- Inline objects/functions with React-controlled dependencies
- Derived state from props/state within the file
- Simple conditional memoization based on props/state

**React Compiler CANNOT optimize:**

- Code across file boundaries (single-file compilation)
- Functions/hooks imported from other files
- Redux selectors and external state management
- Components from external libraries (node_modules)
- Computations dependent on refs or DOM values
- TypeScript/Flow type information (uses own type system)
- Effect dependencies (keep existing useMemo/useCallback - open research area)

**Key Limitations:**

- Single-file compilation - Cannot see across files
- No type information - Doesn't use TypeScript/Flow types
- Effects memoization - Still an open research area

**Best Practices:**

- Write new code without useMemo/useCallback - let React Compiler handle it
- Keep existing useMemo/useCallback for effect dependencies
- Use manual memoization for cross-file dependencies
- Install eslint-plugin-react-compiler to catch compilation errors

**Rule of thumb:** If it's within the same file and uses props/state, React Compiler handles it. If it crosses file boundaries (imports, Redux, external libraries), use manual memoization.

## Common Performance Anti-Patterns

### ❌ Anti-Pattern: Memoizing Everything

**Problem:** Over-optimizing with unnecessary memoization adds complexity without benefit.

**Solution:** Only memoize expensive operations or when passing to memoized children.

**Example - WRONG:**

```typescript
// This is overkill and adds unnecessary complexity
const SimpleComponent = React.memo(() => {
  const value1 = useMemo(() => prop1 + prop2, [prop1, prop2]);
  const value2 = useMemo(() => prop3 * 2, [prop3]);
  const handler = useCallback(() => {}, []);

  return <div onClick={handler}>{value1} {value2}</div>;
});
```

**Example - CORRECT:**

```typescript
// Only memoize when actually needed
const SimpleComponent = ({ prop1, prop2, prop3 }: Props) => {
  const value1 = prop1 + prop2; // Simple calculation - no memo needed
  const value2 = prop3 * 2; // Simple calculation - no memo needed
  const handler = () => {}; // Simple handler - no callback needed

  return <div onClick={handler}>{value1} {value2}</div>;
};
```

### ❌ Anti-Pattern: Wrong Dependencies in useMemo/useCallback

**Problem:** Missing dependencies causes stale closures and bugs.

**Solution:** Always include all dependencies. Use ESLint rule `react-hooks/exhaustive-deps`.

**Example - WRONG:**

```typescript
const TokenList = ({ tokens, filter }: TokenListProps) => {
  // Dependencies are wrong - should include filter!
  const filteredTokens = useMemo(() => {
    return tokens.filter(token => token.symbol.includes(filter));
  }, [tokens]); // Missing filter dependency!

  return <div>...</div>;
};
```

**Example - CORRECT:**

```typescript
const TokenList = ({ tokens, filter }: TokenListProps) => {
  const filteredTokens = useMemo(() => {
    return tokens.filter(token => token.symbol.includes(filter));
  }, [tokens, filter]); // All dependencies included

  return <div>...</div>;
};
```

### ❌ Anti-Pattern: Using Index as Key for Dynamic Lists

**Problem:** Breaks React's reconciliation when lists can be reordered, filtered, or have items added/removed.

**Solution:** Use unique, stable identifiers from data.

**Example - WRONG:**

```typescript
const TokenList = ({ tokens }: TokenListProps) => {
  // If tokens can be reordered/filtered, this breaks React's reconciliation
  return (
    <div>
      {tokens.map((token, index) => (
        <TokenItem key={index} token={token} />
      ))}
    </div>
  );
};
```

**Example - CORRECT:**

```typescript
const TokenList = ({ tokens }: TokenListProps) => {
  return (
    <div>
      {tokens.map(token => (
        <TokenItem key={token.address} token={token} />
      ))}
    </div>
  );
};
```
