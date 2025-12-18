---
description: Front-End Performance Rules - Hooks & Effects
globs: use*.ts,use*.tsx,use*.js,use*.jsx,*.tsx,*.jsx
alwaysApply: false
---

# Front-End Performance Rules: Hooks & Effects

This file covers React hooks and effects optimization rules including useEffect best practices, dependency management, cleanup patterns, and preventing cascading re-renders.

### Rule: Don't Overuse useEffect

**DO:**

- Calculate derived state during render instead of using useEffect
- Only use useEffect for side effects (data fetching, DOM manipulation, subscriptions)

**DON'T:**

- Use useEffect for derived state that can be calculated during render

**Reference:** See: You Might Not Need an Effect

**Example - WRONG:**

```typescript
const TokenDisplay = ({ token }: TokenDisplayProps) => {
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    setDisplayName(`${token.symbol} (${token.name})`);
  }, [token]);

  return <div>{displayName}</div>;
};
```

**Example - CORRECT:**

```typescript
const TokenDisplay = ({ token }: TokenDisplayProps) => {
  const displayName = `${token.symbol} (${token.name})`;
  return <div>{displayName}</div>;
};
```

### Rule: Minimize useEffect Dependencies

**DO:**

- Reduce dependencies by moving values to default parameters when possible
- Only include dependencies that actually trigger the effect

**DON'T:**

- Include unnecessary dependencies that cause effects to run too often

**Example - WRONG:**

```typescript
const TokenBalance = ({ address, network, refreshInterval }: Props) => {
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    const fetch = async () => {
      const result = await fetchBalance(address, network);
      setBalance(result);
    };

    fetch();
    const interval = setInterval(fetch, refreshInterval);
    return () => clearInterval(interval);
  }, [address, network, refreshInterval]); // Effect runs too often
};
```

**Example - CORRECT:**

```typescript
const TokenBalance = ({ address, network, refreshInterval = 10000 }: Props) => {
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    const fetch = async () => {
      const result = await fetchBalance(address, network);
      setBalance(result);
    };

    fetch();
    const interval = setInterval(fetch, refreshInterval);
    return () => clearInterval(interval);
  }, [address, network]); // refreshInterval moved to default param
};
```

### Rule: Never Use JSON.stringify in useEffect Dependencies

**DO:**

- Use useEqualityCheck hook for deep equality checks (recommended)
- Use useRef with deep equality check in effect
- Normalize to stable primitives when possible
- Use createDeepEqualSelector for Redux selectors

**DON'T:**

- Use JSON.stringify in dependencies (expensive, unreliable, breaks with functions/circular refs)
- Use useMemo with JSON.stringify (defeats purpose)

**Why:** JSON.stringify executes on every render, string comparison is slower than reference comparison, creates new string objects defeating memoization, can cause infinite loops, and doesn't handle circular references or functions.

**When You Need Deep Equality:**

- Nested properties of an object change (deep equality)
- Array elements change (deep equality)
- Object reference changes but values are the same (should NOT trigger)

**Example - WRONG:**

```typescript
const usePolling = (input: PollingInput) => {
  useEffect(() => {
    startPolling(input);
  }, [input && JSON.stringify(input)]); // Expensive! Runs every render
};
```

**Example - CORRECT: Option 1 - Use useEqualityCheck hook (Recommended)**

```typescript
import { useEqualityCheck } from './hooks/useEqualityCheck';
import { isEqual } from 'lodash';

const usePolling = (input: PollingInput) => {
  const stableInput = useEqualityCheck(input, isEqual);

  useEffect(() => {
    startPolling(stableInput);
  }, [stableInput]); // Only triggers when deep values actually change
};
```

**Example - CORRECT: Option 2 - useRef with deep equality check**

```typescript
import { isEqual } from 'lodash';

const usePolling = (input: PollingInput) => {
  const inputRef = useRef(input);

  useEffect(() => {
    // Only execute if deep values changed
    if (!isEqual(input, inputRef.current)) {
      inputRef.current = input;
      startPolling(input);
    }
  }, [input]);
};
```

**Example - CORRECT: Option 3 - Normalize to stable primitives**

```typescript
const usePolling = (input: PollingInput) => {
  const inputId = useMemo(() => input.id, [input.id]);
  const inputChainId = useMemo(() => input.chainId, [input.chainId]);
  const inputRpcUrl = useMemo(() => input.rpcUrl, [input.rpcUrl]);

  useEffect(() => {
    startPolling(input);
  }, [inputId, inputChainId, inputRpcUrl]); // Only depends on primitives
};
```

**When to Use Each Approach:**

| Approach                | Use When                                    | Pros                                 | Cons                 |
| ----------------------- | ------------------------------------------- | ------------------------------------ | -------------------- |
| useEqualityCheck        | Objects/arrays from props or external state | Simple, reusable, handles edge cases | Requires hook import |
| useRef + isEqual        | One-off cases, custom logic needed          | Full control, no extra hook          | More boilerplate     |
| Normalize to primitives | Can extract stable IDs/values               | Most performant, clear dependencies  | Not always possible  |

**Key Principles:**

- Use deep equality when object references change frequently but values don't
- Prefer useEqualityCheck hook - Already implemented in codebase
- Normalize when possible - Extract stable primitives (IDs, strings, numbers)
- Never use JSON.stringify
- Don't skip dependencies - Always include dependencies, use deep equality to stabilize them

### Rule: Include All Dependencies in useEffect

**DO:**

- Include all values used in the effect in the dependency array
- Use useRef with a flag if you truly only want to track once

**DON'T:**

- Use empty dependency arrays when values from closure are used (creates stale closures)
- Skip dependencies to avoid re-running effects

**Example - WRONG:**

```typescript
const Name = ({ type, name }: NameProps) => {
  useEffect(() => {
    trackEvent({
      properties: {
        petname_category: type, // Uses 'type' from closure
        has_petname: Boolean(name?.length), // Uses 'name' from closure
      },
    });
  }, []); // Empty deps - 'type' and 'name' are stale!
};
```

**Example - CORRECT:**

```typescript
const Name = ({ type, name }: NameProps) => {
  useEffect(() => {
    trackEvent({
      properties: {
        petname_category: type,
        has_petname: Boolean(name?.length),
      },
    });
  }, [type, name]); // Include all dependencies

  // OR if you truly only want to track once:
  const hasTrackedRef = useRef(false);
  useEffect(() => {
    if (!hasTrackedRef.current) {
      trackEvent({
        properties: {
          petname_category: type,
          has_petname: Boolean(name?.length),
        },
      });
      hasTrackedRef.current = true;
    }
  }, [type, name]);
};
```

### Rule: Include All Dependencies in useMemo/useCallback

**DO:**

- Always include all dependencies in useMemo/useCallback dependency arrays
- Use ESLint rule react-hooks/exhaustive-deps to catch missing dependencies

**DON'T:**

- Skip dependencies (causes stale closures and bugs)

**Example - WRONG:**

```typescript
const TokenList = ({ tokens, filter }: TokenListProps) => {
  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => token.symbol.includes(filter));
  }, [tokens]); // Missing filter dependency!
};
```

**Example - CORRECT:**

```typescript
const TokenList = ({ tokens, filter }: TokenListProps) => {
  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => token.symbol.includes(filter));
  }, [tokens, filter]); // All dependencies included
};
```

### Rule: Avoid Cascading useEffect Chains

**DO:**

- Combine effects or compute during render using useMemo
- Use single effect for async operations

**DON'T:**

- Create multiple effects where one sets state that triggers another (causes unnecessary re-renders)

**Example - WRONG:**

```typescript
const useHistoricalPrices = () => {
  const [prices, setPrices] = useState([]);
  const [metadata, setMetadata] = useState(null);

  // First effect fetches and updates Redux
  useEffect(() => {
    fetchPrices();
    const intervalId = setInterval(fetchPrices, 60000);
    return () => clearInterval(intervalId);
  }, [chainId, address]);

  // Second effect responds to Redux state change
  useEffect(() => {
    const pricesToSet = historicalPricesNonEvm?.[address]?.intervals ?? [];
    setPrices(pricesToSet); // Triggers third effect
  }, [historicalPricesNonEvm, address]);

  // Third effect depends on state from second effect
  useEffect(() => {
    const metadataToSet = deriveMetadata(prices);
    setMetadata(metadataToSet);
  }, [prices]);
};
```

**Example - CORRECT:**

```typescript
const useHistoricalPrices = () => {
  // Compute prices during render from Redux state
  const prices = useMemo(() => {
    return historicalPricesNonEvm?.[address]?.intervals ?? [];
  }, [historicalPricesNonEvm, address]);

  // Compute metadata during render from prices
  const metadata = useMemo(() => {
    return deriveMetadata(prices);
  }, [prices]);

  // Single effect for async operations
  useEffect(() => {
    fetchPrices();
    const intervalId = setInterval(fetchPrices, 60000);
    return () => clearInterval(intervalId);
  }, [chainId, address]);

  return { prices, metadata };
};
```

### Rule: Avoid Conditional Early Returns with All Dependencies

**DO:**

- Split effects when conditional logic excludes some dependencies
- Ensure all dependencies in array are actually used

**DON'T:**

- Include dependencies that aren't used when condition is true

**Example - WRONG:**

```typescript
const useHistoricalPrices = ({ isEvm, chainId, address }: Props) => {
  useEffect(() => {
    if (isEvm) {
      return; // Early return
    }
    // Only uses chainId and address when not EVM
    fetchPrices(chainId, address);
  }, [isEvm, chainId, address]); // Includes all deps even when unused
};
```

**Example - CORRECT:**

```typescript
// Option 1: Split effects
const useHistoricalPrices = ({ isEvm, chainId, address }: Props) => {
  useEffect(() => {
    if (!isEvm) {
      fetchPrices(chainId, address);
    }
  }, [isEvm, chainId, address]); // All deps are used

  // OR Option 2: Separate effects
  useEffect(() => {
    if (isEvm) return;
    fetchPrices(chainId, address);
  }, [isEvm]); // Only depends on condition

  useEffect(() => {
    if (!isEvm) {
      fetchPrices(chainId, address);
    }
  }, [chainId, address]); // Only when not EVM
};
```

### Rule: Use useRef for Persistent Values

**DO:**

- Use useRef for values that need to persist across renders
- Use refs for mounted flags, intervals, and other persistent state

**DON'T:**

- Use regular variables for values that need to persist (they get reset on every render)

**Example - WRONG:**

```typescript
const usePolling = (input: PollingInput) => {
  let isMounted = false; // Gets reset every render!

  useEffect(() => {
    isMounted = true;
    startPolling(input);

    return () => {
      isMounted = false;
    };
  }, [input]);
};
```

**Example - CORRECT:**

```typescript
const usePolling = (input: PollingInput) => {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    startPolling(input);

    return () => {
      isMountedRef.current = false;
    };
  }, [input]);
};
```

### Rule: Always Call Hooks Unconditionally

**DO:**

- Always call hooks in the same order on every render
- Use conditional logic inside hooks, not conditional hook calls

**DON'T:**

- Call hooks conditionally (breaks Rules of Hooks)
- Create hooks dynamically or in loops

**Example - WRONG:**

```typescript
const TokenDisplay = ({ token, showDetails }: TokenDisplayProps) => {
  const [balance, setBalance] = useState('0');

  if (showDetails) {
    // ⚠️ Hook called conditionally - breaks Rules of Hooks!
    const [metadata, setMetadata] = useState(null);
    useEffect(() => {
      fetchMetadata(token.id).then(setMetadata);
    }, [token.id]);
  }

  return <div>{balance}</div>;
};
```

**Example - CORRECT:**

```typescript
const TokenDisplay = ({ token, showDetails }: TokenDisplayProps) => {
  const [balance, setBalance] = useState('0');
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    if (showDetails) {
      fetchMetadata(token.id).then(setMetadata);
    }
  }, [token.id, showDetails]);

  return (
    <div>
      <div>Balance: {balance}</div>
      {showDetails && metadata && <div>Metadata: {metadata.name}</div>}
    </div>
  );
};
```

**Example - WRONG: Dynamic hook creation**

```typescript
const AssetList = ({ assets }: AssetListProps) => {
  // ⚠️ Number of hooks changes based on assets.length!
  const balances = assets.map((asset) => {
    const [balance, setBalance] = useState('0'); // Wrong!
    useEffect(() => {
      fetchBalance(asset.id).then(setBalance);
    }, [asset.id]);
    return balance;
  });
};
```

**Example - CORRECT:**

```typescript
// Option 1: Custom hook for single asset
const useAssetBalance = (assetId: string) => {
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    fetchBalance(assetId).then(setBalance);
  }, [assetId]);

  return balance;
};

const AssetList = ({ assets }: AssetListProps) => {
  return (
    <div>
      {assets.map(asset => (
        <AssetItem key={asset.id} asset={asset} />
      ))}
    </div>
  );
};

// Option 2: Component with its own hooks
const AssetItem = ({ asset }: { asset: Asset }) => {
  const balance = useAssetBalance(asset.id);
  return <div>{asset.name}: {balance}</div>;
};
```

### Rule: Prevent Cascading Re-renders from Hook Dependencies

**DO:**

- Use selectors and memoization to break re-render chains
- Isolate hook dependencies by extracting stable values
- Use component composition to prevent unnecessary re-renders

**DON'T:**

- Create effects that depend on frequently changing values without memoization

**Example - WRONG:**

```typescript
const Dashboard = () => {
  const accounts = useSelector((state) => state.accounts); // Large array
  const [filteredAccounts, setFilteredAccounts] = useState([]);

  // Effect runs whenever accounts array reference changes
  useEffect(() => {
    const filtered = accounts.filter((a) => a.isActive);
    setFilteredAccounts(filtered); // Triggers re-render
  }, [accounts]); // accounts reference changes frequently

  // Another effect depends on filteredAccounts
  useEffect(() => {
    updateAnalytics(filteredAccounts); // Triggers another update
  }, [filteredAccounts]);
};
```

**Example - CORRECT:**

```typescript
// In selectors file:
const selectAccounts = (state) => state.accounts;
const selectActiveAccounts = createSelector([selectAccounts], (accounts) =>
  accounts.filter((a) => a.isActive),
);

// In component:
const Dashboard = () => {
  // Selector handles memoization - only changes when accounts actually change
  const activeAccounts = useSelector(selectActiveAccounts);

  // Memoize analytics update to prevent unnecessary calls
  const analyticsRef = useRef(activeAccounts);
  useEffect(() => {
    if (analyticsRef.current !== activeAccounts) {
      updateAnalytics(activeAccounts);
      analyticsRef.current = activeAccounts;
    }
  }, [activeAccounts]);
};
```

**Example - WRONG: Hook depends on frequently changing object**

```typescript
const TokenCard = ({ token }: TokenCardProps) => {
  const [formattedBalance, setFormattedBalance] = useState('');

  useEffect(() => {
    // token object reference changes frequently
    setFormattedBalance(formatBalance(token.balance, token.decimals));
  }, [token]); // Re-runs too often
};
```

**Example - CORRECT:**

```typescript
const TokenCard = ({ token }: TokenCardProps) => {
  // Extract primitive values that change less frequently
  const balance = token.balance;
  const decimals = token.decimals;

  // Calculate during render instead of effect
  const formattedBalance = useMemo(
    () => formatBalance(balance, decimals),
    [balance, decimals]
  );

  return <div>{formattedBalance}</div>;
};
```

### Rule: Use Component Composition to Prevent Re-renders

**DO:**

- Move state down to components that need it
- Pass children as props to prevent re-renders
- Isolate state changes to specific components

**DON'T:**

- Keep all state at the top level causing unnecessary re-renders

**Example - WRONG:**

```typescript
const Dashboard = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <ExpensiveChart /> {/* Re-renders unnecessarily! */}
      <ExpensiveTable /> {/* Re-renders unnecessarily! */}
    </div>
  );
};
```

**Example - CORRECT: Move state down**

```typescript
const Dashboard = () => {
  return (
    <div>
      <Counter /> {/* Only this re-renders */}
      <ExpensiveChart />
      <ExpensiveTable />
    </div>
  );
};

const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
};
```

**Example - CORRECT: Pass children as props**

```typescript
const Dashboard = ({ children }: { children: React.ReactNode }) => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      {children} {/* Children don't re-render! */}
    </div>
  );
};

// Usage:
<Dashboard>
  <ExpensiveChart />
  <ExpensiveTable />
</Dashboard>
```

### Rule: Prevent State Updates After Component Unmount

**DO:**

- Check mounted state before updating state in async operations
- Use cancelled flag pattern with cleanup

**DON'T:**

- Update state after component unmount (causes memory leaks and React warnings)

**Example - WRONG:**

```typescript
const TokenBalance = ({ address }: TokenBalanceProps) => {
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    fetchBalance(address).then((result) => {
      setBalance(result); // ⚠️ May update after unmount!
    });
  }, [address]);
};
```

**Example - CORRECT:**

```typescript
const TokenBalance = ({ address }: TokenBalanceProps) => {
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      const result = await fetchBalance(address);
      if (!cancelled) {
        setBalance(result);
      }
    };

    fetch();

    return () => {
      cancelled = true;
    };
  }, [address]);
};
```

### Rule: Use AbortController for Fetch Requests

**DO:**

- Use AbortController to cancel fetch requests on unmount
- Check if request was aborted before updating state
- Handle AbortError appropriately

**DON'T:**

- Leave fetch requests running after component unmount

**Example - WRONG:**

```typescript
const AssetList = ({ chainId }: AssetListProps) => {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    fetch(`/api/assets/${chainId}`)
      .then((res) => res.json())
      .then((data) => setAssets(data)); // Request continues after unmount!
  }, [chainId]);
};
```

**Example - CORRECT:**

```typescript
const AssetList = ({ chainId }: AssetListProps) => {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/assets/${chainId}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!controller.signal.aborted) {
          setAssets(data);
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch assets:', error);
        }
      });

    return () => {
      controller.abort(); // Cancels request on unmount
    };
  }, [chainId]);
};
```

### Rule: Clean Up Intervals and Subscriptions

**DO:**

- Always clean up intervals, timeouts, and subscriptions in useEffect cleanup
- Use cancelled flag pattern for async operations in intervals

**DON'T:**

- Leave intervals or subscriptions running after unmount

**Example - WRONG:**

```typescript
const PriceTicker = ({ tokenAddress }: PriceTickerProps) => {
  const [price, setPrice] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      const newPrice = await fetchPrice(tokenAddress);
      setPrice(newPrice);
    }, 1000); // ⚠️ Interval continues after unmount!

    // Missing cleanup!
  }, [tokenAddress]);
};
```

**Example - CORRECT:**

```typescript
const PriceTicker = ({ tokenAddress }: PriceTickerProps) => {
  const [price, setPrice] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchPrice = async () => {
      const newPrice = await fetchPriceData(tokenAddress);
      if (!cancelled) {
        setPrice(newPrice);
      }
    };

    fetchPrice(); // Initial fetch
    const interval = setInterval(fetchPrice, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval); // Cleanup on unmount
    };
  }, [tokenAddress]);
};
```

### Rule: Avoid Large Object Retention in Closures

**DO:**

- Extract only needed data from large objects
- Use refs for stable references to avoid capturing large objects in closures
- Minimize what's captured in closure scope

**DON'T:**

- Capture large objects in closures (prevents garbage collection)

**Example - WRONG:**

```typescript
const TransactionList = ({ transactions }: TransactionListProps) => {
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    // Large transactions array captured in closure
    const expensiveFilter = () => {
      return transactions
        .filter((tx) => tx.status === 'pending')
        .map((tx) => expensiveTransform(tx)); // Large object retained!
    };

    const interval = setInterval(() => {
      setFiltered(expensiveFilter());
    }, 5000);

    return () => clearInterval(interval);
  }, [transactions]); // transactions array reference changes frequently
};
```

**Example - CORRECT:**

```typescript
const TransactionList = ({ transactions }: TransactionListProps) => {
  const [filtered, setFiltered] = useState([]);
  const transactionsRef = useRef(transactions);

  // Update ref without causing effect to re-run
  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  useEffect(() => {
    let cancelled = false;

    const expensiveFilter = () => {
      // Use ref to avoid capturing transactions in closure
      const currentTransactions = transactionsRef.current;
      return currentTransactions
        .filter((tx) => tx.status === 'pending')
        .map((tx) => ({
          id: tx.id,
          amount: tx.amount,
          // Only extract needed properties, not entire object
        }));
    };

    const updateFiltered = () => {
      if (!cancelled) {
        setFiltered(expensiveFilter());
      }
    };

    updateFiltered();
    const interval = setInterval(updateFiltered, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []); // Empty deps - uses ref instead
};
```
