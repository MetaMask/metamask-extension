# Perps Mock Implementation

This directory contains mock implementations of the Perps controller and stream manager, allowing UI development without the actual `@metamask/perps-controller` dependency.

## Overview

The mock system provides a "drop and replace" architecture where:

- **Mock mode** (current): Uses static data from `ui/components/app/perps/mocks.ts`
- **Production mode** (future): Uses real `@metamask/perps-controller` integration

## Architecture

```
ui/providers/perps/
├── index.ts                      # Main export (currently exports mocks)
├── index.mock.ts                 # Mock re-exports
├── getPerpsController.mock.ts    # Mock controller implementation
├── PerpsStreamManager.mock.ts    # Mock stream manager implementation
├── getPerpsController.ts         # Real controller (commented out in index.ts)
└── PerpsStreamManager.ts         # Real stream manager (commented out in index.ts)

ui/hooks/perps/stream/
├── index.ts                      # Main export (currently exports mocks)
├── index.mock.ts                 # Mock hook implementations
├── usePerpsLivePositions.ts      # Real hook (commented out in index.ts)
├── usePerpsLiveOrders.ts         # Real hook (commented out in index.ts)
└── usePerpsLiveMarketData.ts     # Real hook (commented out in index.ts)
```

## Mock Implementations

### 1. **MockPerpsController** (`getPerpsController.mock.ts`)

Provides the same API as the real controller:

```typescript
const controller = await getPerpsController(selectedAddress);

// Cancel a single order
await controller.cancelOrder({ orderId: 'order-001', symbol: 'ETH' });

// Cancel all orders
await controller.cancelOrders({ cancelAll: true });
```

**Methods implemented:**

- `cancelOrder({ orderId, symbol })` - Logs to console (no real API call)
- `cancelOrders({ cancelAll })` - Logs to console (no real API call)
- `subscribeToPositions()` - Returns no-op unsubscribe
- `subscribeToOrders()` - Returns no-op unsubscribe
- `subscribeToAccount()` - Returns no-op unsubscribe
- `getActiveProviderOrNull()` - Returns mock provider
- `init()` - Logs initialization
- `disconnect()` - Logs disconnection

### 2. **MockPerpsStreamManager** (`PerpsStreamManager.mock.ts`)

Provides cached data channels with mock data:

```typescript
const streamManager = getPerpsStreamManager();

// Initialize for an address
await streamManager.init(selectedAddress);

// Prewarm (start background subscriptions)
streamManager.prewarm();

// Subscribe to positions
const unsubscribe = streamManager.positions.subscribe((positions) => {
  console.log('Positions:', positions);
});

// Cleanup
streamManager.cleanupPrewarm();
```

**Channels:**

- `positions` - Returns `mockPositions` from mocks.ts
- `orders` - Returns `mockOrders` from mocks.ts
- `account` - Returns `mockAccountState` from mocks.ts
- `markets` - Returns `mockCryptoMarkets` + `mockHip3Markets` from mocks.ts

### 3. **Mock Stream Hooks** (`hooks/perps/stream/index.mock.ts`)

React hooks that return static mock data:

```typescript
// Positions hook
const { positions, isInitialLoading } = usePerpsLivePositions();
// Returns: { positions: mockPositions, isInitialLoading: false }

// Orders hook
const { orders, isInitialLoading } = usePerpsLiveOrders();
// Returns: { orders: mockOrders, isInitialLoading: false }

// Account hook
const { account, isInitialLoading } = usePerpsLiveAccount();
// Returns: { account: mockAccountState, isInitialLoading: false }

// Market data hook
const { cryptoMarkets, hip3Markets, isInitialLoading } =
  usePerpsLiveMarketData();
// Returns: { cryptoMarkets: mockCryptoMarkets, hip3Markets: mockHip3Markets, isInitialLoading: false }
```

## Mock Data Source

All mock data comes from: `ui/components/app/perps/mocks.ts`

This includes:

- **mockPositions** - 9 positions (crypto + HIP-3 equity/commodity/forex)
- **mockOrders** - 9 orders (various states: open, filled, queued)
- **mockAccountState** - Account balance and P&L
- **mockCryptoMarkets** - 8 crypto markets (BTC, ETH, SOL, etc.)
- **mockHip3Markets** - 9 HIP-3 markets (stocks, commodities, forex)

## Switching Between Mock and Real

To switch from **mock** to **production**:

### Step 1: Update `ui/providers/perps/index.ts`

Comment out the MOCK section and uncomment the REAL section:

```typescript
// ============================================================================
// MOCK IMPLEMENTATIONS (currently active)
// ============================================================================

// // Comment out these exports
// export {
//   getPerpsStreamManager,
//   resetPerpsStreamManager,
//   PerpsStreamManager,
// } from './PerpsStreamManager.mock';

// ============================================================================
// REAL IMPLEMENTATIONS (commented out - uncomment to use production controller)
// ============================================================================

// Uncomment these exports
export {
  getPerpsStreamManager,
  resetPerpsStreamManager,
  PerpsStreamManager,
} from './PerpsStreamManager';

export {
  getPerpsController,
  resetPerpsController,
  type PerpsControllerState,
} from './getPerpsController';

// ... etc
```

### Step 2: Update `ui/hooks/perps/stream/index.ts`

Comment out the MOCK section and uncomment the REAL section:

```typescript
// ============================================================================
// MOCK IMPLEMENTATIONS (currently active)
// ============================================================================

// // Comment out these exports
// export {
//   usePerpsLivePositions,
//   type UsePerpsLivePositionsOptions,
//   type UsePerpsLivePositionsReturn,
// } from './index.mock';

// ============================================================================
// REAL IMPLEMENTATIONS (commented out - uncomment to use production controller)
// ============================================================================

// Uncomment these exports
export {
  usePerpsLivePositions,
  type UsePerpsLivePositionsOptions,
  type UsePerpsLivePositionsReturn,
} from './usePerpsLivePositions';

// ... etc
```

### Step 3: That's it!

No other code changes needed. The perps-tab-view component imports from:

- `ui/providers/perps` - Will now get real implementations
- `ui/hooks/perps/stream` - Will now get real hooks

## Testing

The existing tests use Jest mocks and will continue to work regardless of mock/real mode.

See: `ui/components/app/perps/perps-tab-view.test.tsx`

## Benefits of This Approach

1. ✅ **Zero code changes** in components when switching
2. ✅ **Same API** between mock and real implementations
3. ✅ **Easy to merge** UI code without controller dependency
4. ✅ **Simple toggle** - just comment/uncomment in 2 files
5. ✅ **Works with tests** - Jest mocks override both versions

## Development Workflow

### Current (Mock Mode)

```bash
# UI development with mock data
npm start

# Component renders with mockPositions, mockOrders, etc.
# No perps-controller needed
```

### Future (Production Mode)

```bash
# Update index.ts files to export real implementations
# Component now uses real WebSocket streams and controller
npm start
```

## Notes

- Mock implementations log to console for debugging
- No-op functions are used where real implementations would make API calls
- All mock data is synchronous (no async delays)
- BehaviorSubject pattern is maintained (immediate callback with cached data)

## Files Created

1. `getPerpsController.mock.ts` - Mock controller
2. `PerpsStreamManager.mock.ts` - Mock stream manager
3. `index.mock.ts` (providers) - Mock provider exports
4. `index.mock.ts` (hooks) - Mock hook implementations
5. `README.mock.md` (this file) - Documentation
