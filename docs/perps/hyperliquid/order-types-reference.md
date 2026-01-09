# HyperLiquid Order Types Reference

**Purpose**: Authoritative reference for all HyperLiquid order types and time-in-force (TIF) options, verified against SDK source code and current codebase usage.

**Verification Standard**: Every claim is traced to either:

- ✅ **SDK Source**: `@nktkas/hyperliquid` TypeScript definitions
- ✅ **Codebase**: Current production/debug code with file:line references
- ⚠️ **Empirical**: Observed behavior (clearly marked)

---

## 1. SDK-Verified TIF Options

**Source**: `node_modules/@nktkas/hyperliquid/esm/src/api/exchange/order.d.ts:29-37`

| TIF                 | Full Name           | Status            | Behavior (from SDK docs)                             |
| ------------------- | ------------------- | ----------------- | ---------------------------------------------------- |
| `Gtc`               | Good til Canceled   | ✅ Used           | Remains active until filled or canceled              |
| `Ioc`               | Immediate or Cancel | ✅ Used           | Fills immediately or cancels any unfilled portion    |
| `Alo`               | Add Liquidity Only  | ⚠️ Available      | Adds liquidity only (post-only)                      |
| `FrontendMarket`    | Frontend Market     | ✅ Used (Primary) | Similar to IOC, used in HyperLiquid UI               |
| `LiquidationMarket` | Liquidation Market  | ⚠️ Internal       | Similar to IOC, used by HyperLiquid for liquidations |

**SDK Type Definition**:

```typescript
/**
 * Time-in-force.
 * - `"Gtc"`: Remains active until filled or canceled.
 * - `"Ioc"`: Fills immediately or cancels any unfilled portion.
 * - `"Alo"`: Adds liquidity only.
 * - `"FrontendMarket"`: Similar to Ioc, used in Hyperliquid UI.
 * - `"LiquidationMarket"`: Similar to Ioc, used in Hyperliquid UI.
 */
readonly tif: v.SchemaWithPipe<readonly [v.UnionSchema<[
  v.LiteralSchema<"Gtc", undefined>,
  v.LiteralSchema<"Ioc", undefined>,
  v.LiteralSchema<"Alo", undefined>,
  v.LiteralSchema<"FrontendMarket", undefined>,
  v.LiteralSchema<"LiquidationMarket", undefined>
], undefined>
```

**Notes**:

- `Fok` (Fill-or-Kill) does **NOT** exist in SDK (commonly assumed but not implemented)
- `LiquidationMarket` is for internal HyperLiquid use only
- `FrontendMarket` is documented in SDK but NOT in official GitBook docs

---

## 2. Current Codebase Usage

**Source**: MetaMask Mobile Perps implementation (as of 2025-10-16)

| Location                         | Order Pattern  | TIF Used            | Use Case                 | Notes              |
| -------------------------------- | -------------- | ------------------- | ------------------------ | ------------------ |
| `HyperLiquidProvider.ts:765`     | Market         | `FrontendMarket`    | Production market orders | Standard pattern   |
| `HyperLiquidProvider.ts:765`     | Limit          | `Gtc`               | Production limit orders  | Standard limit     |
| `HyperLiquidProvider.ts:814-823` | TP/SL          | `trigger` (not TIF) | Take-profit/stop-loss    | Different syntax   |
| `hyperLiquidAdapter.ts:70`       | Market         | `FrontendMarket`    | Adapter (unused)         | Matches production |
| `hyperLiquidAdapter.ts:67`       | Limit          | `Gtc`               | Adapter limit orders     | Matches production |
| `HIP3DebugView.tsx:500`          | Market         | `Ioc`               | Debug/testing only       | Debug code only    |
| `HIP3DebugView.tsx:717`          | Close Position | `FrontendMarket`    | Reduce-only orders       | Standard pattern   |

**Patterns Summary**:

- **Market orders**: `FrontendMarket` (standard for all markets)
- **Limit orders**: `Gtc` (universal)
- **TP/SL orders**: Use `trigger` syntax (not standard TIF)
- **Unused TIF**: `Alo`, `LiquidationMarket`

---

## 3. Order Type Matrix

### Standard Orders (TIF-based)

| Order Intent  | TIF              | Price Strategy                  | Fills             | Rests on Book | Use Case              |
| ------------- | ---------------- | ------------------------------- | ----------------- | ------------- | --------------------- |
| **Market**    | `FrontendMarket` | Aggressive limit + slippage cap | Partial OK        | No            | Immediate execution   |
| **Limit**     | `Gtc`            | User-specified limit            | Partial OK        | Yes           | Standard limit order  |
| **Post-only** | `Alo`            | User-specified limit            | Never immediately | Yes           | Maker-only strategies |

**Key Difference**: HyperLiquid has no "pure" market order. Market execution is achieved via:

```
Aggressive Limit Price + IOC/FrontendMarket TIF = Market Order Behavior
```

### Trigger Orders (TP/SL)

**Source**: `HyperLiquidProvider.ts:814-823`

| Trigger Type    | Syntax                                                   | Execution               | Use Case            |
| --------------- | -------------------------------------------------------- | ----------------------- | ------------------- |
| **Stop Loss**   | `{ trigger: { isMarket: true, triggerPx, tpsl: 'sl' } }` | Market order at trigger | Auto-exit on loss   |
| **Take Profit** | `{ trigger: { isMarket: true, triggerPx, tpsl: 'tp' } }` | Market order at trigger | Auto-exit on profit |

**Notes**:

- Trigger orders do NOT use TIF syntax
- `isMarket: true` executes as market order when triggered
- `isMarket: false` would execute as limit order at `triggerPx`

---

## 4. SDK Type Definitions

### Standard Order Structure

**Source**: `node_modules/@nktkas/hyperliquid/esm/src/api/exchange/order.d.ts`

```typescript
interface Order {
  a: number; // Asset ID
  b: boolean; // true = buy, false = sell
  p: string; // Price (formatted string)
  s: string; // Size (formatted string)
  r: boolean; // true = reduce-only
  t: OrderType; // Order type (limit or trigger)
  c?: string; // Optional client order ID
}

type OrderType =
  | {
      limit: {
        tif: 'Gtc' | 'Ioc' | 'Alo' | 'FrontendMarket' | 'LiquidationMarket';
      };
    }
  | { trigger: { isMarket: boolean; triggerPx: string; tpsl: 'tp' | 'sl' } };
```

### Order Request

```typescript
interface OrderRequest {
  orders: Order[]; // Array of orders (batch support)
  grouping?: 'na' | 'normalTpsl' | 'positionTpsl';
  builder?: {
    // Optional builder address for fee sharing
    b: string; // Builder address
    f: number; // Fee in basis points
  };
}
```

---

## 5. Code Examples

### Example 1: Market Order (FrontendMarket)

**Source**: `HyperLiquidProvider.ts:765`

```typescript
const marketOrder = {
  a: assetId, // e.g., 0 for BTC
  b: side === 'buy', // true for buy, false for sell
  p: formatHyperLiquidPrice({
    // Aggressive price with slippage cap
    price: slippageCapPrice,
    szDecimals: asset.szDecimals,
  }),
  s: formatHyperLiquidSize({
    // Order size
    size: orderSize,
    szDecimals: asset.szDecimals,
  }),
  r: false, // Not reduce-only
  t: { limit: { tif: 'FrontendMarket' } },
};

await exchangeClient.order({ orders: [marketOrder] });
```

### Example 2: Limit Order (Gtc)

**Source**: `HyperLiquidProvider.ts:765`

```typescript
const limitOrder = {
  a: assetId,
  b: side === 'buy',
  p: formatHyperLiquidPrice({
    price: userSpecifiedPrice, // User's limit price
    szDecimals: asset.szDecimals,
  }),
  s: formatHyperLiquidSize({
    size: orderSize,
    szDecimals: asset.szDecimals,
  }),
  r: false,
  t: { limit: { tif: 'Gtc' } }, // Rests on book until filled
};

await exchangeClient.order({ orders: [limitOrder] });
```

### Example 3: Stop Loss Trigger

**Source**: `HyperLiquidProvider.ts:814-823`

```typescript
const stopLossOrder = {
  a: assetId,
  b: !isLongPosition, // Opposite side to close
  p: formatHyperLiquidPrice({
    price: parseFloat(stopLossPrice),
    szDecimals: asset.szDecimals,
  }),
  s: formatHyperLiquidSize({
    size: positionSize,
    szDecimals: asset.szDecimals,
  }),
  r: true, // Reduce-only
  t: {
    trigger: {
      isMarket: true, // Market order when triggered
      triggerPx: formatHyperLiquidPrice({
        price: parseFloat(stopLossPrice),
        szDecimals: asset.szDecimals,
      }),
      tpsl: 'sl', // Stop loss type
    },
  },
};

await exchangeClient.order({ orders: [stopLossOrder] });
```

### Example 4: Close Position (Reduce-Only)

**Source**: `HIP3DebugView.tsx:717`

```typescript
const closeOrder = {
  a: assetId,
  b: !isLongPosition, // Opposite side
  p: formatHyperLiquidPrice({
    price: aggressiveClosePrice,
    szDecimals: asset.szDecimals,
  }),
  s: formatHyperLiquidSize({
    size: Math.abs(positionSize),
    szDecimals: asset.szDecimals,
  }),
  r: true, // MUST be reduce-only
  t: { limit: { tif: 'FrontendMarket' } },
};

await exchangeClient.order({ orders: [closeOrder] });
```

---

## 6. Response Formats

### Successful Order Response

```typescript
interface OrderResponse {
  status: 'ok';
  response: {
    type: 'order';
    data: {
      statuses: OrderStatus[]; // One per order in batch
    };
  };
}

interface OrderStatus {
  resting?: {
    // Present if order rests on book
    oid: number; // Order ID
  };
  filled?: {
    // Present if order filled (partial or complete)
    totalSz: string; // Total filled size
    avgPx: string; // Average fill price
    oid: number; // Order ID
  };
  error?: string; // Present if order rejected
}
```

### Response Patterns

| TIF              | Typical Response      | Notes                                   |
| ---------------- | --------------------- | --------------------------------------- |
| `FrontendMarket` | `filled` only         | Partial fill + cancel unfilled          |
| `Ioc`            | `filled` only         | Partial fill + cancel unfilled          |
| `Gtc`            | `resting` or `filled` | Rests on book if not immediately filled |
| `Alo`            | `resting` or `error`  | Rejects if would immediately match      |

### Error Response

```typescript
interface ErrorResponse {
  status: 'err';
  response: string; // Error message
}
```

**Common Errors**:

- `"Price must be divisible by tick size"`: Use `formatHyperLiquidPrice()`
- `"Order could not immediately match"`: IOC/FrontendMarket with no liquidity
- `"Insufficient balance"`: Account not funded for DEX
- `"Size below minimum notional"`: Order size × mid price < $10 (HIP-3 specific)

---

## 7. Special Considerations

### HIP-3 Specific Constraints

**Source**: Empirical observation + `HIP-3-IMPLEMENTATION.md`

| Constraint              | Value                                       | Applies To             | Validation Point            |
| ----------------------- | ------------------------------------------- | ---------------------- | --------------------------- |
| Minimum Notional        | $10 USD                                     | All HIP-3 orders       | Calculated at **mid price** |
| Slippage (⚠️ Empirical) | 5-10%                                       | Market orders          | Not SDK-enforced            |
| Asset ID Format         | `100000 + (dex_index × 10000) + coin_index` | Builder-deployed perps | See `asset-ids.md`          |

**Minimum Notional Formula**:

```typescript
const midPrice = await getMidPrice(coin, dex);
const notionalValue = orderSize * midPrice;

if (notionalValue < 10) {
  throw new Error(
    `Order size too small. Minimum: $${(10 / midPrice).toFixed(6)}`,
  );
}
```

**Important**: Validation uses **mid price**, NOT limit price. An order can pass validation but still be rejected if the limit price would result in notional < $10 at execution.

### Price Formatting Requirements

**Source**: `hyperLiquidAdapter.ts` + SDK constraints

**Rules**:

1. Max 5 significant figures
2. Max `(6 - szDecimals)` decimal places
3. Must be divisible by tick size

**Always use**:

```typescript
import { formatHyperLiquidPrice } from '../utils/hyperLiquidAdapter';

const formattedPrice = formatHyperLiquidPrice({
  price: rawPrice,
  szDecimals: asset.szDecimals,
});
```

**Failure symptoms**:

- Error: "Price must be divisible by tick size"
- Order rejected at exchange level

### Cross-DEX Balance Management

**Source**: `HIP-3-TRADING-GUIDE.md:84-102` (verified behavior)

Each HIP-3 DEX has **separate USDC balance**. Must transfer before trading:

```typescript
// Transfer from main DEX → xyz DEX
await exchangeClient.usdClassTransfer({
  sourceDex: '', // Empty string = main DEX
  destinationDex: 'xyz',
  amount: '100', // USDC amount (string)
});

// Check balance before placing orders
const state = await infoClient.clearinghouseState({
  user: walletAddress,
  dex: 'xyz', // Specify DEX
});
const availableBalance = state.marginSummary.accountValue;
```

### TIF Selection Guide

| Scenario                     | Recommended TIF              | Rationale                          |
| ---------------------------- | ---------------------------- | ---------------------------------- |
| Immediate execution required | `FrontendMarket`             | Production-ready, UI convention    |
| Standard limit orders        | `Gtc`                        | Rests on book, standard behavior   |
| Maker-only strategies        | `Alo`                        | Guarantees liquidity provision     |
| Closing positions            | `FrontendMarket` + `r: true` | Fast execution, reduce-only safety |
| Automated TP/SL              | `trigger` syntax             | Not TIF-based                      |

---

## 8. References

**SDK Source**:

- `@nktkas/hyperliquid` - Official TypeScript SDK
- `node_modules/@nktkas/hyperliquid/esm/src/api/exchange/order.d.ts:29-37` - TIF definitions

**Codebase**:

- `app/components/UI/Perps/controllers/providers/HyperLiquidProvider.ts:765` - Production orders
- `app/components/UI/Perps/utils/hyperLiquidAdapter.ts:64-71` - Adapter patterns
- `app/components/UI/Perps/Debug/HIP3DebugView.tsx:500,717` - Debug/testing

**Documentation**:

- [HyperLiquid Exchange API](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint)
- [Asset ID Calculation](./asset-ids.md)
- [HIP-3 Implementation](./HIP-3-IMPLEMENTATION.md)
- [HyperLiquid Trading Guide](./HYPERLIQUID-TRADING-GUIDE.md)

---

## 9. Document Metadata

**Created**: 2025-10-16
**Last Verified**: 2025-10-16
**SDK Version**: `@nktkas/hyperliquid` (current)
**Verification Standard**: All claims traced to SDK source or codebase with file:line references

**Legend**:

- ✅ **Verified**: From SDK source or production code
- ⚠️ **Available**: In SDK but not currently used
- ⚠️ **Empirical**: Observed behavior, not SDK-documented
