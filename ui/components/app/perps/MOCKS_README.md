# Perps Mock Data & Controllers

This directory contains mock implementations for developing and testing the Perps UI without requiring the full controller integration.

## Overview

- **`mocks.ts`** - Mock data (positions, orders, markets, account state, transactions)
- **`mockPerpsController.ts`** - Mock PerpsController implementation
- **`mockPerpsStreamManager.ts`** - Mock PerpsStreamManager implementation

## Usage

### Option 1: Using Mock Controller with Provider

```typescript
import { PerpsControllerProvider } from '../../providers/perps/PerpsControllerProvider';
import { getMockPerpsController } from '../../components/app/perps/mocks';

function MyApp() {
  const selectedAddress = '0x123...';
  const mockController = await getMockPerpsController(selectedAddress);

  return (
    <PerpsControllerProvider controller={mockController}>
      <PerpsHomePage />
    </PerpsControllerProvider>
  );
}
```

### Option 2: Using Mock Stream Manager

```typescript
import { getMockPerpsStreamManager } from '../../components/app/perps/mocks';

function MyComponent() {
  const streamManager = getMockPerpsStreamManager();

  useEffect(() => {
    streamManager.init('0x123...');
    streamManager.prewarm();

    return () => streamManager.cleanupPrewarm();
  }, []);

  // Subscribe to data
  useEffect(() => {
    const unsubscribe = streamManager.positions.subscribe((positions) => {
      console.log('Positions:', positions);
    });
    return unsubscribe;
  }, []);
}
```

### Option 3: Module Replacement (Recommended for Development)

Create a mock module file that can be swapped via webpack alias or environment variable:

**`ui/providers/perps/index.mock.ts`:**

```typescript
// Export mocks as if they were the real implementations
export { getMockPerpsController as getPerpsController } from '../../components/app/perps/mockPerpsController';
export { getMockPerpsStreamManager as getPerpsStreamManager } from '../../components/app/perps/mockPerpsStreamManager';
```

**Webpack config:**

```javascript
resolve: {
  alias: {
    // When USE_PERPS_MOCKS=true, replace real implementations with mocks
    ...(process.env.USE_PERPS_MOCKS === 'true' && {
      'ui/providers/perps/getPerpsController': 'ui/providers/perps/index.mock.ts',
      'ui/providers/perps/PerpsStreamManager': 'ui/providers/perps/index.mock.ts',
    }),
  },
}
```

Then run:

```bash
USE_PERPS_MOCKS=true yarn start
```

## Mock Features

### Mock Controller

The mock controller provides:

- ✅ **Realistic subscriptions** - Positions, orders, account, and prices
- ✅ **Simulated updates** - Periodic data updates to mimic WebSocket streams
- ✅ **Working mutations** - `cancelOrder()` and `updateMargin()` modify mock state
- ✅ **Async behavior** - Simulated network delays for realistic UX
- ✅ **Price variations** - Mock prices fluctuate slightly to simulate market movement

### Mock Stream Manager

The mock stream manager provides:

- ✅ **Cached data channels** - Immediate data delivery (BehaviorSubject-like)
- ✅ **Prewarm support** - `prewarm()` / `cleanupPrewarm()` lifecycle
- ✅ **Optimistic updates** - `setOptimisticTPSL()` for UI responsiveness
- ✅ **All markets** - Both crypto and HIP-3 markets (stocks, commodities, forex)

## Mock Data

### Positions

- 9 positions (5 crypto + 4 HIP-3)
- Mix of long/short, isolated/cross margin
- Various leverage levels
- With/without TP/SL

### Orders

- 9 orders (6 crypto + 3 HIP-3)
- Market, limit, and trigger orders
- Various states (open, filled, queued, canceled)

### Markets

- 8 crypto markets (BTC, ETH, SOL, ARB, POL, AVAX, LINK, UNI)
- 11 HIP-3 markets:
  - 6 equities (TSLA, AAPL, MSFT, NVDA, AMZN, GOOGL)
  - 3 commodities (GOLD, SILVER, CL/Oil)
  - More can be added as needed

### Account State

- Total balance: $15,250
- Available: $10,125
- Margin used: $5,125
- Unrealized PnL: +$375

## Testing

Both mock implementations can be reset for testing:

```typescript
import { resetMockPerpsController, resetMockPerpsStreamManager } from './mocks';

beforeEach(() => {
  resetMockPerpsController();
  resetMockPerpsStreamManager();
});
```

## Notes

- Mock data is intentionally comprehensive to cover edge cases
- Subscriptions auto-cleanup on unmount (return unsubscribe function)
- Mock state is isolated per instance (unless using singleton getters)
- Network delays are simulated (50-500ms) for realistic loading states
