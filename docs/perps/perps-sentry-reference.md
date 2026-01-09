# Perps Sentry Event Reference

## Overview

This document defines all Sentry performance traces and measurements for the Perps feature. The monitoring system tracks:

- UI screen load performance
- Trading operation execution
- WebSocket connection lifecycle
- API integration timing
- Data fetch operations

## Platform Context

All Sentry events automatically include platform context:

| Tag                 | Value                        | Purpose           |
| ------------------- | ---------------------------- | ----------------- |
| `browser`           | Chrome, Firefox, etc.        | Browser type      |
| `environment_type`  | popup, sidepanel, fullscreen | UI context        |
| `extension_version` | e.g., `12.0.0`               | Extension version |

### Querying by Platform (Sentry)

```
# Extension events only
tags.environment_type:[popup, sidepanel, fullscreen, notification]

# Sidepanel-specific performance
tags.environment_type:sidepanel transaction:Perps*
```

## Two Tracing Approaches

### 1. `usePerpsMeasurement` Hook (UI Screens)

**Use for:** Screen/component load performance with conditional completion.

**Location:** `ui/hooks/perps/usePerpsMeasurement.ts`

**When to use:**

- Screen load measurements
- Modal appearances
- UI component rendering
- Any measurement that depends on data loading states

**Pattern:**

```typescript
import { useEffect, useRef } from 'react';
import * as Sentry from '@sentry/browser';

// Custom hook for Perps measurements
export function usePerpsMeasurement({
  traceName,
  conditions = [],
}: {
  traceName: string;
  conditions?: boolean[];
}) {
  const transactionRef = useRef<Sentry.Transaction | null>(null);
  const startTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    // Start transaction on mount
    transactionRef.current = Sentry.startTransaction({
      name: traceName,
      op: 'ui.load',
      tags: {
        feature: 'perps',
      },
    });
    startTimeRef.current = performance.now();

    return () => {
      // Cleanup if component unmounts before completion
      if (transactionRef.current) {
        transactionRef.current.setStatus('cancelled');
        transactionRef.current.finish();
      }
    };
  }, [traceName]);

  // Complete when all conditions are met
  useEffect(() => {
    const allConditionsMet = conditions.every(Boolean);
    if (allConditionsMet && transactionRef.current) {
      transactionRef.current.setMeasurement(
        'time_to_ready',
        performance.now() - startTimeRef.current,
        'millisecond',
      );
      transactionRef.current.setStatus('ok');
      transactionRef.current.finish();
      transactionRef.current = null;
    }
  }, [conditions]);
}

// Usage
usePerpsMeasurement({
  traceName: 'Perps Order View',
  conditions: [!!market, !!account, !isLoading],
});
```

### 2. Direct Sentry API (Controllers/Background)

**Use for:** Controller operations, WebSocket events, API calls, data fetches.

**When to use:**

- Trading operations (placeOrder, closePosition, etc.)
- WebSocket lifecycle events
- API call timing
- Controller-level data fetches

**Pattern:**

```typescript
import * as Sentry from '@sentry/browser';

// Basic transaction
const transaction = Sentry.startTransaction({
  name: 'Perps Place Order',
  op: 'perps.order_submission',
  tags: {
    provider: 'hyperliquid',
    order_type: 'market',
    feature: 'perps',
  },
  data: {
    is_buy: true,
  },
});

try {
  // Create spans for sub-operations
  const validationSpan = transaction.startChild({
    op: 'validation',
    description: 'Validate order parameters',
  });
  await validateOrder(params);
  validationSpan.finish();

  const submissionSpan = transaction.startChild({
    op: 'api.request',
    description: 'Submit order to exchange',
  });
  const result = await provider.placeOrder(params);
  submissionSpan.finish();

  transaction.setStatus('ok');
  transaction.setData('order_id', result.orderId);
} catch (error) {
  transaction.setStatus('internal_error');
  Sentry.captureException(error);
} finally {
  transaction.finish();
}
```

## Event Catalog

### UI Screen Measurements (16 events)

**Purpose:** Track screen load times and user-perceived performance.

| TraceName                   | Conditions Tracked                            | Notes                                                    |
| --------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| `PerpsTabView`              | Tab visible, markets loaded, connection ready | Main perps landing                                       |
| `PerpsMarketListView`       | Markets data, prices available                | Market browser (also used for home view for consistency) |
| `PerpsPositionDetailsView`  | Position data, market stats, history loaded   | Position details                                         |
| `PerpsOrderView`            | Current price, market data, account available | Trade entry                                              |
| `PerpsClosePositionView`    | Position data, current price                  | Position exit                                            |
| `PerpsAdjustMarginView`     | Position data, balance/max removable (mode)   | Adjust margin (add/remove) - differentiated by mode tag  |
| `PerpsFlipPositionSheet`    | Position data, fees, current price            | Flip position confirmation bottom sheet                  |
| `PerpsWithdrawView`         | Account balance, destination token            | Withdrawal form                                          |
| `PerpsTransactionsView`     | Order fills loaded                            | History view                                             |
| `PerpsOrderSubmissionToast` | Immediate (shows when toast appears)          | Order feedback                                           |

**Note on PerpsHomeView:** The new home view introduced in TAT-1538 uses `PerpsMarketListView` trace name for consistency with existing metrics, as it replaced the previous market list view. This maintains historical performance comparison capability.

**Measurements (sub-operations):**
| PerpsMeasurementName | Unit | Description |
|---------------------|------|-------------|
| `PERPS_TAB_LOADED` | ms | Tab screen render complete |
| `PERPS_MARKETS_SCREEN_LOADED` | ms | Market list render |
| `PERPS_ASSET_SCREEN_LOADED` | ms | Asset details render |
| `PERPS_TRADE_SCREEN_LOADED` | ms | Order form render |
| `PERPS_CLOSE_SCREEN_LOADED` | ms | Close position render |
| `PERPS_WITHDRAWAL_SCREEN_LOADED` | ms | Withdrawal form render |
| `PERPS_TRANSACTION_HISTORY_SCREEN_LOADED` | ms | History render |
| `PERPS_ORDER_SUBMISSION_TOAST_LOADED` | ms | Toast display |
| `PERPS_ORDER_CONFIRMATION_TOAST_LOADED` | ms | Confirmation toast |
| `PERPS_CLOSE_ORDER_SUBMISSION_TOAST_LOADED` | ms | Close toast |
| `PERPS_CLOSE_ORDER_CONFIRMATION_TOAST_LOADED` | ms | Close confirmation |
| `PERPS_LEVERAGE_BOTTOM_SHEET_LOADED` | ms | Leverage picker |

### Trading Operations (9 events)

**Purpose:** Track order execution, position management, and transaction completion.

| TraceName            | Operation                 | Tags                                                      | Data Attributes                                                   |
| -------------------- | ------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| `PerpsPlaceOrder`    | `PerpsOrderSubmission`    | provider, orderType, market, leverage, isTestnet          | isBuy, orderPrice, success, orderId                               |
| `PerpsEditOrder`     | `PerpsOrderSubmission`    | provider, orderType, market, leverage, isTestnet          | isBuy, orderPrice, success, orderId                               |
| `PerpsCancelOrder`   | `PerpsOrderSubmission`    | provider, market, isTestnet, **isBatch** (batch ops only) | orderId, success, **coinCount** (batch), **successCount** (batch) |
| `PerpsClosePosition` | `PerpsPositionManagement` | provider, coin, closeSize, isTestnet, **isBatch** (batch) | success, filledSize, **closeAll** (batch), **coinCount** (batch)  |
| `PerpsUpdateTPSL`    | `PerpsPositionManagement` | provider, market, isTestnet                               | takeProfitPrice, stopLossPrice, success                           |
| `PerpsUpdateMargin`  | `PerpsPositionManagement` | provider, coin, action, isTestnet                         | amount, success                                                   |
| `PerpsFlipPosition`  | `PerpsPositionManagement` | provider, coin, fromDirection, toDirection, isTestnet     | size, success                                                     |
| `PerpsWithdraw`      | `PerpsOperation`          | assetId, provider, isTestnet                              | success, txHash, withdrawalId                                     |
| `PerpsDeposit`       | `PerpsOperation`          | assetId, provider, isTestnet                              | success, txHash                                                   |

**Batch Operations Pattern:**

- `closePositions()` and `cancelOrders()` use the same trace names as single operations
- Add `isBatch: 'true'` tag to distinguish batch from single operations
- Include `coinCount` or order count in data attributes
- Add `closeAll: 'true'` data attribute when closing all positions
- Batch operations execute individual traces in parallel and aggregate results

### WebSocket Performance (6 events)

**Purpose:** Monitor real-time data connection health and latency.

| TraceName                        | Operation        | Measured Duration            | Notes                 |
| -------------------------------- | ---------------- | ---------------------------- | --------------------- |
| `PerpsConnectionEstablishment`   | `PerpsOperation` | Initial connection + preload | End-to-end first data |
| `PerpsWebSocketConnected`        | `PerpsOperation` | Raw connection time          | Transport only        |
| `PerpsWebSocketFirstPositions`   | `PerpsOperation` | Time to first position data  | Data latency          |
| `PerpsWebSocketFirstOrders`      | `PerpsOperation` | Time to first order data     | Data latency          |
| `PerpsWebSocketFirstAccount`     | `PerpsOperation` | Time to first account data   | Data latency          |
| `PerpsAccountSwitchReconnection` | `PerpsOperation` | Account switch full cycle    | Cleanup + reconnect   |

**Measurements (sub-operations):**
| PerpsMeasurementName | Unit | Description |
|---------------------|------|-------------|
| `PERPS_WEBSOCKET_CONNECTION_ESTABLISHMENT` | ms | Transport connection |
| `PERPS_WEBSOCKET_CONNECTION_WITH_PRELOAD` | ms | Connection + data preload |
| `PERPS_WEBSOCKET_FIRST_POSITION_DATA` | ms | First position received |
| `PERPS_WEBSOCKET_ACCOUNT_SWITCH_RECONNECTION` | ms | Account switch timing |
| `PERPS_PROVIDER_INIT` | ms | Provider initialization |
| `PERPS_ACCOUNT_STATE_FETCH` | ms | Account state load |
| `PERPS_SUBSCRIPTIONS_PRELOAD` | ms | Subscription setup |
| `PERPS_RECONNECTION_CLEANUP` | ms | Cleanup before reconnect |
| `PERPS_CONTROLLER_REINIT` | ms | Controller restart |
| `PERPS_NEW_ACCOUNT_FETCH` | ms | New account data |
| `PERPS_RECONNECTION_PRELOAD` | ms | Reconnection subscriptions |

### API Integrations (4 events)

**Purpose:** Track external API call timing and reliability.

| TraceName             | Operation        | Purpose                           | Parent Trace                               |
| --------------------- | ---------------- | --------------------------------- | ------------------------------------------ |
| `PerpsRewardsAPICall` | `PerpsOperation` | Fee discount calculation          | Can be standalone or child of order traces |
| `PerpsDataLakeReport` | `PerpsOperation` | Order reporting for notifications | Fire-and-forget                            |

**Measurements:**
| PerpsMeasurementName | Unit | Description |
|---------------------|------|-------------|
| `PERPS_REWARDS_FEE_DISCOUNT_API_CALL` | ms | Fee discount fetch (cached) |
| `PERPS_REWARDS_POINTS_ESTIMATION_API_CALL` | ms | Points calculation (cached) |
| `PERPS_REWARDS_ORDER_EXECUTION_FEE_DISCOUNT_API_CALL` | ms | Live discount during order |
| `PERPS_DATA_LAKE_API_CALL` | ms | Order report submission |

### Data Fetch Operations (7 events)

**Purpose:** Track controller data fetch timing.

| TraceName                     | Operation        | Fetches                 | Notes    |
| ----------------------------- | ---------------- | ----------------------- | -------- |
| `PerpsGetPositions`           | `PerpsOperation` | Active positions        | REST API |
| `PerpsGetAccountState`        | `PerpsOperation` | Account balance, margin | REST API |
| `PerpsGetMarkets`             | `PerpsOperation` | Available markets       | REST API |
| `PerpsOrdersFetch`            | `PerpsOperation` | Open/historical orders  | REST API |
| `PerpsOrderFillsFetch`        | `PerpsOperation` | Trade execution history | REST API |
| `PerpsFundingFetch`           | `PerpsOperation` | Funding rate history    | REST API |
| `PerpsGetHistoricalPortfolio` | `PerpsOperation` | Portfolio value history | REST API |

**Measurements:**
| PerpsMeasurementName | Unit | Description |
|---------------------|------|-------------|
| `PERPS_GET_POSITIONS_OPERATION` | ms | Position fetch within trace |
| `PERPS_GET_OPEN_ORDERS_OPERATION` | ms | Orders fetch within trace |

### Market Data Updates (1 event)

**Purpose:** Track real-time price update subscriptions.

| TraceName               | Operation         | Subscription Duration        | Data                                         |
| ----------------------- | ----------------- | ---------------------------- | -------------------------------------------- |
| `PerpsMarketDataUpdate` | `PerpsMarketData` | Active subscription lifetime | symbols, includeMarketData, includeOrderBook |

## Adding New Events

### Adding a UI Screen Measurement

**Step 1:** Add TraceName to `app/util/trace.ts`

```typescript
export enum TraceName {
  // ... existing entries
  PerpsYourNewView = 'Perps Your New View',
}
```

**Step 2:** Use hook in your component

```typescript
import { usePerpsMeasurement } from '../../hooks/usePerpsMeasurement';
import { TraceName } from '../../../../../util/trace';

const YourComponent = () => {
  const { data, isLoading } = useSomeData();

  // Track when component is ready
  usePerpsMeasurement({
    traceName: TraceName.PerpsYourNewView,
    conditions: [!isLoading, !!data],
  });

  return <View>...</View>;
};
```

**Step 3:** (Optional) Add measurement for sub-operation

```typescript
// In constants/performanceMetrics.ts
export enum PerpsMeasurementName {
  PERPS_YOUR_OPERATION = 'perps_your_operation',
}

// In your component
import { setMeasurement } from '@sentry/react-native';
import { PerpsMeasurementName } from '../../constants/performanceMetrics';

const startTime = performance.now();
await doSomething();
setMeasurement(
  PerpsMeasurementName.PERPS_YOUR_OPERATION,
  performance.now() - startTime,
  'millisecond',
);
```

### Adding a Controller Operation Trace

**Step 1:** Add TraceName and Operation to `app/util/trace.ts`

```typescript
export enum TraceName {
  PerpsYourOperation = 'Perps Your Operation',
}

export enum TraceOperation {
  PerpsYourCategory = 'perps.your_category',
}
```

**Step 2:** Implement trace in controller

```typescript
import { trace, endTrace, TraceName, TraceOperation } from '../../../../util/trace';
import { v4 as uuidv4 } from 'uuid';

async yourOperation(params: Params): Promise<Result> {
  const traceId = uuidv4();
  let traceData:
    | { success: boolean; error?: string; resultData?: string }
    | undefined;

  try {
    trace({
      name: TraceName.PerpsYourOperation,
      id: traceId,
      op: TraceOperation.PerpsYourCategory,
      tags: {
        provider: this.state.activeProvider,
        isTestnet: this.state.isTestnet,
      },
      data: {
        someParam: params.value,
      },
    });

    const result = await this.provider.doSomething(params);

    // Build success trace data
    traceData = { success: true, resultData: result.id };
    return result;
  } catch (error) {
    // Build error trace data
    traceData = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    throw error;
  } finally {
    // Always end trace, even on errors
    endTrace({
      name: TraceName.PerpsYourOperation,
      id: traceId,
      data: traceData,
    });
  }
}
```

**Step 3:** (Optional) Add sub-measurement

```typescript
// Within your trace
const subOpStart = performance.now();
const data = await fetchData();
setMeasurement(
  PerpsMeasurementName.PERPS_YOUR_SUB_OPERATION,
  performance.now() - subOpStart,
  'millisecond',
  traceSpan, // Optional: attach to parent span
);
```

## Event Naming Conventions

### TraceName Format

- Pattern: `Perps<Action><Subject>`
- Examples: `PerpsPlaceOrder`, `PerpsWebSocketConnected`, `PerpsTabView`

### TraceOperation Format

- Pattern: `perps.<category>`
- Categories:
  - `perps.operation` - General operations
  - `perps.order_submission` - Order-related operations
  - `perps.position_management` - Position operations
  - `perps.market_data` - Market data subscriptions

### PerpsMeasurementName Format

- Pattern: `PERPS_<CATEGORY>_<ACTION>_<SUBJECT>`
- All uppercase with underscores
- Examples: `PERPS_WEBSOCKET_CONNECTION_ESTABLISHMENT`, `PERPS_GET_POSITIONS_OPERATION`

## Performance Markers (Development)

Use these markers with DevLogger for development filtering:

```typescript
import { PERFORMANCE_CONFIG } from '../constants/perpsConfig';

DevLogger.log(
  `${PERFORMANCE_CONFIG.LOGGING_MARKERS.SENTRY_PERFORMANCE} Screen loaded`,
  { metric: TraceName.PerpsOrderView },
);
```

**Available markers:**

- `PERPSMARK_SENTRY` - Sentry performance logs
- `PERPSMARK_METRICS` - MetaMetrics events
- `PERPSMARK_SENTRY_WS` - WebSocket performance

**Usage in development:**

```bash
# Filter Sentry logs only
adb logcat | grep PERPSMARK_SENTRY

# Filter WebSocket performance
adb logcat | grep PERPSMARK_SENTRY_WS

# All Perps performance logs
adb logcat | grep PERPSMARK_
```

## Error Logging Best Practices (Extension)

### Standard Pattern

All errors should be logged with consistent context using Sentry:

```typescript
import * as Sentry from '@sentry/browser';
import log from 'loglevel';

try {
  await someOperation();
} catch (error) {
  // Log to console for development
  log.error('Perps operation failed:', error);

  // Capture in Sentry with context
  Sentry.withScope((scope) => {
    scope.setTag('feature', 'perps');
    scope.setTag('context', 'PerpsController.placeOrder');
    scope.setTag('provider', 'hyperliquid');
    scope.setTag('network', isTestnet ? 'testnet' : 'mainnet');
    scope.setExtra('operation_params', params);
    Sentry.captureException(error);
  });

  throw error;
}
```

### Context Helper Pattern (Controllers)

Controllers should implement a `captureError()` helper for consistency:

```typescript
/**
 * Capture error with standard Perps context
 */
private captureError(
  error: Error,
  method: string,
  extra?: Record<string, unknown>,
): void {
  Sentry.withScope((scope) => {
    scope.setTag('feature', 'perps');
    scope.setTag('context', `PerpsController.${method}`);
    scope.setTag('provider', this.state.activeProvider);
    scope.setTag('network', this.state.isTestnet ? 'testnet' : 'mainnet');

    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  });
}

// Usage in catch blocks
try {
  const positions = await this.provider.getPositions(params);
  return positions;
} catch (error) {
  this.captureError(error, 'getPositions', { params });
  throw error;
}
```

### Required Context Tags

| Tag        | Type   | Purpose                         | Example                    |
| ---------- | ------ | ------------------------------- | -------------------------- |
| `feature`  | string | Feature name for Sentry queries | `'perps'`                  |
| `context`  | string | Component + method path         | `'PerpsController.method'` |
| `provider` | string | Active provider name            | `'hyperliquid'`            |
| `network`  | string | Network environment             | `'testnet'` or `'mainnet'` |

### When to Capture Errors

1. **Always capture** in controller/service catch blocks
2. **Always capture** in connection management catch blocks
3. **Always capture** in async callbacks that might fail silently
4. **Don't capture** in UI components (let errors bubble to controllers)
5. **Don't capture** expected validation errors (e.g., insufficient balance)

---

## Best Practices

1. **Use transactions** for operations that span multiple async steps
2. **Use spans** for sub-operations within a transaction
3. **Include success/error status** when finishing transactions
4. **Add tags** for filtering (provider, network, asset, etc.)
5. **Use setMeasurement** for timing sub-operations
6. **Always finish transactions** in finally blocks
7. **Parent-child spans**: Use `startChild()` for nested measurements
8. **Use `Sentry.withScope()`** to add context without affecting other errors

## Related Files (Extension)

- **Sentry setup**: `app/scripts/sentry.js`
- **Measurement hook**: `ui/hooks/perps/usePerpsMeasurement.ts` (to be created)
- **Measurement constants**: `ui/hooks/perps/constants/performanceMetrics.ts` (to be created)
- **Controller**: `app/scripts/controllers/perps/` (to be implemented)

## Extension vs Mobile Differences

| Aspect       | Mobile                       | Extension                    |
| ------------ | ---------------------------- | ---------------------------- |
| Sentry SDK   | `@sentry/react-native`       | `@sentry/browser`            |
| Logger       | Custom `Logger` util         | `loglevel` or `log`          |
| Trace utils  | `app/util/trace.ts`          | Sentry transactions directly |
| Platform tag | Auto-detected as iOS/Android | `environment_type` tag       |
