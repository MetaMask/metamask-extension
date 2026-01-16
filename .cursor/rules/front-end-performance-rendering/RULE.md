---
description: Front-End Performance Rules - Rendering Performance
globs: "*.tsx,*.jsx,*.ts,*.js"
alwaysApply: false
---

# Front-End Performance Rules: Rendering Performance

This file covers rendering performance optimization rules including list keys, virtualization, React.memo, code splitting, lazy loading, memoization, and Web Workers.

### Rule: Use Proper Keys for Lists

**DO:**

- Use unique, stable identifiers from data (address, id, uuid) as keys
- Ensure keys are stable across re-renders
- Only use index if list never reorders and items don't have IDs

**DON'T:**

- Use array index as key for dynamic lists that can reorder, filter, or have items added/removed
- Use random values or Math.random() as keys

**Why:** Using array index as key breaks React's reconciliation when lists can be reordered, filtered, or items added/removed. This causes state to get mixed up between items, bugs with form inputs, focus, animations, and performance issues from unnecessary re-renders.

**Example - WRONG:**

```typescript
const TokenList = ({ tokens }: TokenListProps) => {
  return (
    <div>
      {tokens.map((token, index) => (
        <TokenItem key={index} token={token} /> // Bad if list can reorder!
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

### Rule: Virtualize Long Lists

**DO:**

- Use virtualization libraries (react-window or react-virtualized) for lists with 100+ items
- Only render visible items to improve performance

**DON'T:**

- Render 1000+ items at once without virtualization

**Example - WRONG:**

```typescript
const TransactionList = ({ transactions }: TransactionListProps) => {
  return (
    <div className="transaction-list">
      {transactions.map(tx => (
        <TransactionItem key={tx.hash} transaction={tx} />
      ))}
    </div>
  );
};
```

**Example - CORRECT:**

```typescript
import { FixedSizeList } from 'react-window';

const TransactionList = ({ transactions }: TransactionListProps) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <TransactionItem transaction={transactions[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={transactions.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

**Recommended libraries:**

- react-window - Lightweight, recommended for most use cases
- react-virtualized - More features, larger bundle size

**Example - CORRECT: Variable Size Virtual Scrolling**

```typescript
import { VariableSizeList } from 'react-window';

const TransactionList = ({ transactions }: TransactionListProps) => {
  const listRef = useRef<VariableSizeList>(null);

  // Calculate item size based on content
  const getItemSize = (index: number) => {
    const tx = transactions[index];
    // Different heights for different transaction types
    return tx.type === 'complex' ? 120 : 80;
  };

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <TransactionItem transaction={transactions[index]} />
    </div>
  );

  return (
    <VariableSizeList
      ref={listRef}
      height={600}
      itemCount={transactions.length}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
};
```

### Rule: Use React.memo for Expensive Components

**DO:**

- Wrap expensive components in React.memo to skip re-renders when props haven't changed
- Use custom comparison function when needed
- Apply to components that render often with same props

**DON'T:**

- Use React.memo on components whose props change frequently
- Use React.memo on simple components that are already fast to render

**When to use React.memo:**

- ✅ Component renders often with same props
- ✅ Component is expensive to render (complex calculations, large lists)
- ✅ Component is in the middle of a frequently updating tree
- ❌ Props change frequently
- ❌ Component is already fast to render

**Example - WRONG:**

```typescript
const TokenListItem = ({ token, onSelect }: TokenListItemProps) => {
  return (
    <div onClick={() => onSelect(token)}>
      {token.symbol} - {token.balance}
    </div>
  );
};
```

**Example - CORRECT: Memoized component**

```typescript
const TokenListItem = React.memo(({ token, onSelect }: TokenListItemProps) => {
  return (
    <div onClick={() => onSelect(token)}>
      {token.symbol} - {token.balance}
    </div>
  );
});
```

**Example - CORRECT: With custom comparison**

```typescript
const TokenListItem = React.memo(
  ({ token, onSelect }: TokenListItemProps) => {
    return (
      <div onClick={() => onSelect(token)}>
        {token.symbol} - {token.balance}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return prevProps.token.address === nextProps.token.address &&
           prevProps.token.balance === nextProps.token.balance;
  }
);
```

### Rule: Use Pagination and Infinite Scroll for Large Datasets

**DO:**

- Load data in chunks for very large datasets
- Implement progressive pagination with page size limits
- Use refs for page tracking to avoid unnecessary re-renders

**DON'T:**

- Load all assets/data at once (1000+ items) which blocks UI

**Example - WRONG:**

```typescript
const AssetList = ({ accountId }: AssetListProps) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Loads ALL assets at once - blocks UI
    fetchAllAssets(accountId).then(allAssets => {
      setAssets(allAssets); // 1000+ assets loaded at once!
      setLoading(false);
    });
  }, [accountId]);

  return loading ? <Spinner /> : <div>{assets.map(a => <Asset key={a.id} asset={a} />}</div>;
};
```

**Example - CORRECT:**

```typescript
const AssetList = ({ accountId }: AssetListProps) => {
  const [assets, setAssets] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const pageRef = useRef(0);
  const PAGE_SIZE = 50;

  const loadPage = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const result = await fetchAssetsPage(accountId, pageRef.current, PAGE_SIZE);
      setAssets(prev => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      pageRef.current += 1;
    } finally {
      setLoading(false);
    }
  }, [accountId, loading, hasMore]);

  useEffect(() => {
    // Load first page on mount
    loadPage();
  }, [accountId]); // Reset on account change

  return (
    <div>
      {assets.map(a => <Asset key={a.id} asset={a} />)}
      {hasMore && (
        <button onClick={loadPage} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};
```

### Rule: Use React.lazy for Route-Based Code Splitting

**DO:**

- Use React.lazy() and Suspense for route-based code splitting
- Lazy load pages and heavy components
- Provide fallback UI in Suspense boundaries

**DON'T:**

- Import all pages upfront

**Example - WRONG:**

```typescript
import Settings from './pages/Settings';
import Tokens from './pages/Tokens';
import Activity from './pages/Activity';

const App = () => {
  return (
    <Routes>
      <Route path="/settings" element={<Settings />} />
      <Route path="/tokens" element={<Tokens />} />
      <Route path="/activity" element={<Activity />} />
    </Routes>
  );
};
```

**Example - CORRECT:**

```typescript
import { lazy, Suspense } from 'react';

const Settings = lazy(() => import('./pages/Settings'));
const Tokens = lazy(() => import('./pages/Tokens'));
const Activity = lazy(() => import('./pages/Activity'));

const App = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/settings" element={<Settings />} />
        <Route path="/tokens" element={<Tokens />} />
        <Route path="/activity" element={<Activity />} />
      </Routes>
    </Suspense>
  );
};
```

### Rule: Lazy Load Heavy Components

**DO:**

- Lazy load modals and heavy components that aren't immediately visible
- Use IntersectionObserver for lazy loading images
- Start loading images before they become visible (use rootMargin)

**Example - CORRECT:**

```typescript
const QRCodeScanner = lazy(() => import('./components/QRCodeScanner'));

const SendToken = () => {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div>
      <input placeholder="Recipient address" />
      <button onClick={() => setShowScanner(true)}>
        Scan QR Code
      </button>

      {showScanner && (
        <Suspense fallback={<div>Loading scanner...</div>}>
          <QRCodeScanner onScan={handleScan} />
        </Suspense>
      )}
    </div>
  );
};
```

**Example - CORRECT: Lazy load asset images**

```typescript
const AssetCard = ({ asset }: AssetCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' } // Start loading 50px before visible
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <div>{asset.name}</div>
      {imageLoaded ? (
        <img src={asset.imageUrl} alt={asset.name} />
      ) : (
        <div className="placeholder">Loading image...</div>
      )}
    </div>
  );
};
```

### Rule: Memoize Expensive Computations

**DO:**

- Use useMemo for Map creation, array transformations, and expensive operations
- Memoize computations that depend on props/state that change frequently
- Move complex computations to Redux selectors when possible

**DON'T:**

- Create Maps, Sets, or complex objects during render without memoization
- Run expensive map/filter/reduce operations on every render
- Perform expensive operations in components when they can be moved to selectors

**Example - WRONG:**

```typescript
const UnconnectedAccountAlert = () => {
  const internalAccounts = useSelector(getInternalAccounts);
  const connectedAccounts = useSelector(getOrderedConnectedAccountsForActiveTab);

  // Map creation runs on every render
  const internalAccountsMap = new Map(
    internalAccounts.map((acc) => [acc.address, acc]),
  );

  // Array mapping runs on every render
  const connectedAccountsWithName = connectedAccounts.map((account) => ({
    ...account,
    name: internalAccountsMap.get(account.address)?.metadata.name,
  }));

  return <div>{connectedAccountsWithName.map(...)}</div>;
};
```

**Example - CORRECT:**

```typescript
const UnconnectedAccountAlert = () => {
  const internalAccounts = useSelector(getInternalAccounts);
  const connectedAccounts = useSelector(getOrderedConnectedAccountsForActiveTab);

  // Memoize Map creation
  const internalAccountsMap = useMemo(
    () => new Map(internalAccounts.map((acc) => [acc.address, acc])),
    [internalAccounts]
  );

  // Memoize array transformation
  const connectedAccountsWithName = useMemo(
    () =>
      connectedAccounts.map((account) => ({
        ...account,
        name: internalAccountsMap.get(account.address)?.metadata.name,
      })),
    [connectedAccounts, internalAccountsMap]
  );

  return <div>{connectedAccountsWithName.map(...)}</div>;
};
```

**Example - WRONG: Expensive operations without memoization**

```typescript
const AssetDashboard = ({ assets, filters }: AssetDashboardProps) => {
  // These run on EVERY render, even if assets/filters haven't changed
  const filtered = assets
    .filter(asset => matchesFilters(asset, filters))
    .map(asset => enrichAssetData(asset)) // Expensive transformation
    .sort((a, b) => compareAssets(a, b)); // Expensive comparison

  const aggregated = filtered.reduce((acc, asset) => {
    acc.totalValue += parseFloat(asset.balance) * asset.price;
    acc.byChain[asset.chainId] = (acc.byChain[asset.chainId] || 0) + asset.value;
    return acc;
  }, { totalValue: 0, byChain: {} });

  return (
    <div>
      <TotalValue value={aggregated.totalValue} />
      {filtered.map(asset => <AssetCard key={asset.id} asset={asset} />)}
    </div>
  );
};
```

**Example - CORRECT:**

```typescript
const AssetDashboard = ({ assets, filters }: AssetDashboardProps) => {
  // Memoize filtered and enriched assets
  const filtered = useMemo(() => {
    return assets
      .filter(asset => matchesFilters(asset, filters))
      .map(asset => enrichAssetData(asset))
      .sort((a, b) => compareAssets(a, b));
  }, [assets, filters]); // Only recompute when dependencies change

  // Memoize aggregated data
  const aggregated = useMemo(() => {
    return filtered.reduce((acc, asset) => {
      acc.totalValue += parseFloat(asset.balance) * asset.price;
      acc.byChain[asset.chainId] = (acc.byChain[asset.chainId] || 0) + asset.value;
      return acc;
    }, { totalValue: 0, byChain: {} });
  }, [filtered]); // Depends on filtered, which is already memoized

  return (
    <div>
      <TotalValue value={aggregated.totalValue} />
      {filtered.map(asset => <AssetCard key={asset.id} asset={asset} />)}
    </div>
  );
};
```

### Rule: Move Complex Computations to Selectors

**DO:**

- Move expensive computations from components to Redux selectors
- Use createSelector for memoized selectors
- Keep selectors focused on specific state slices

**DON'T:**

- Perform expensive computations in component render functions

**Example - WRONG:**

```typescript
const AssetList = () => {
  const assets = useSelector(state => state.assets);
  const filters = useSelector(state => state.filters);

  // Expensive computation runs in component render
  const filtered = assets
    .filter(asset => matchesFilters(asset, filters))
    .map(asset => expensiveTransform(asset));

  return <div>{filtered.map(a => <Asset key={a.id} asset={a} />)}</div>;
};
```

**Example - CORRECT:**

```typescript
// In selectors file:
const selectAssets = (state) => state.assets;
const selectFilters = (state) => state.filters;

const selectFilteredAssets = createSelector(
  [selectAssets, selectFilters],
  (assets, filters) => {
    // Only recomputes when assets or filters change
    return assets
      .filter(asset => matchesFilters(asset, filters))
      .map(asset => expensiveTransform(asset));
  },
);

// In component:
const AssetList = () => {
  // Selector handles memoization automatically
  const filteredAssets = useSelector(selectFilteredAssets);

  return <div>{filteredAssets.map(a => <Asset key={a.id} asset={a} />)}</div>;
};
```

### Rule: Use Web Workers for Heavy Computations

**DO:**

- Use Web Workers for very expensive computations (crypto operations, large data transformations)
- Terminate workers on component unmount
- Use refs to maintain worker references

**Example - CORRECT:**

```typescript
// worker.ts
self.onmessage = (e) => {
  const { assets, filters } = e.data;

  // Heavy computation in worker thread
  const result = assets
    .filter(asset => matchesFilters(asset, filters))
    .map(asset => expensiveCryptoOperation(asset))
    .sort((a, b) => compareAssets(a, b));

  self.postMessage(result);
};

// Component
const AssetList = ({ assets, filters }: AssetListProps) => {
  const [processed, setProcessed] = useState([]);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./worker.ts', import.meta.url));

    workerRef.current.onmessage = (e) => {
      setProcessed(e.data);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ assets, filters });
    }
  }, [assets, filters]);

  return <div>{processed.map(a => <Asset key={a.id} asset={a} />)}</div>;
};
```

### Rule: Debounce Frequent Updates

**DO:**

- Debounce rapid updates to avoid UI jitter
- Use debounced values for frequently changing data like balances

**Example - CORRECT:**

```typescript
import { useDebouncedValue } from './hooks/useDebouncedValue';

const AssetBalance = ({ assetId }: AssetBalanceProps) => {
  const balance = useSelector(state => selectAssetBalance(state, assetId));

  // Debounce rapid updates to avoid jitter
  const debouncedBalance = useDebouncedValue(balance, 300);

  return <div>{debouncedBalance}</div>;
};

// Hook implementation
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```
