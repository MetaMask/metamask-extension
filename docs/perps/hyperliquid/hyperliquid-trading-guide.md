# HyperLiquid Trading Guide

Comprehensive operational reference for trading on all HyperLiquid markets: validator-operated perps, spot (HIP-1), and builder-deployed perps (HIP-3).

---

## Market Types

HyperLiquid supports three distinct market types, each with unique characteristics:

### Main DEX Perpetuals (Validator-Operated)

**Source**: Official HyperLiquid DEX

- **Asset IDs**: Direct index from `meta.universe` (e.g., BTC = 0)
- **Margin**: Cross or isolated margin supported
- **Fees**: Base tier rates (0.045% taker, 0.015% maker at Tier 0)
- **Collateral**: USDC
- **Examples**: BTC-PERP, ETH-PERP, SOL-PERP

### Spot Markets (HIP-1 Tokens)

**Source**: [HIP-1.md](./HIP-1.md)

- **Asset IDs**: `10000 + spotInfo.index` from `spotMeta` _(asset-ids.md:5)_
  - Example: PURR/USDC = 10000 (first spot asset)
- **Decimals**: Uses both `weiDecimals` (on-chain precision) and `szDecimals` (trading lot size) _(HIP-1.md:9-10)_
- **Token ID**: 34-character hexadecimal format
- **Dust Conversion**: Daily at 00:00 UTC for balances < 1 lot size with notional ≤ $1 _(HIP-1.md:44-48)_
- **Fee Distribution** _(HIP-1.md:40-42)_:
  - Base token fees → Deployer (configurable 0-100%, remainder burned)
  - Quote token fees → Assistance Fund
- **Examples**: PURR/USDC, HYPE/USDC

### Builder-Deployed Perps (HIP-3)

**Source**: [HIP-3.md](./HIP-3.md)

- **Asset IDs**: `100000 + (dex_index × 10000) + index_in_meta` _(asset-ids.md:7)_
  - Example: xyz:ABC with dex_index=1, coin_index=0 → asset=110000
- **Margin**: Isolated-only (cross margin coming in future upgrade) _(HIP-3.md:44)_
- **Fees**: 2× base rates (50% deployer share, net same protocol fee) _(HIP-3.md:46-47)_
- **Staking**: Deployers must stake 500k HYPE _(HIP-3.md:39)_
- **Open Interest Caps** _(HIP-3.md:29-35)_:
  - Notional cap: Per-DEX and per-asset
  - Size cap: 1B per asset (constant)
- **Examples**: xyz:BTC, abc:ETH

### Asset ID Reference

**Source**: [asset-ids.md](./asset-ids.md)

| Market Type | Formula                                | Example           |
| ----------- | -------------------------------------- | ----------------- |
| Main Perps  | `index`                                | BTC = 0           |
| Spot        | `10000 + index`                        | PURR/USDC = 10000 |
| HIP-3 Perps | `100000 + (dex_index × 10000) + index` | xyz:ABC = 110000  |

**Note**: Spot ID ≠ Token ID. Example (HYPE):

- Mainnet token ID: 150, Spot ID: 107
- Testnet token ID: 1105, Spot ID: 1035

---

## Universal Trading Rules

**Source**: [exchange-endpoint.md](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint)

These rules apply to **ALL** HyperLiquid markets (perps, spot, HIP-3):

### Minimum Order Value

**$10 USD minimum** for all orders, validated at mid price.

```typescript
const midPrice = await getMidPrice(coin, dex);
const notionalValue = orderSize * midPrice;

if (notionalValue < 10) {
  throw new Error(`Order must have minimum value of $10.`);
}
```

**Critical**: Validation uses **mid price**, NOT limit price. Orders passing validation may still be rejected if execution price results in notional < $10.

### Order Structure

All markets use identical order structure:

```typescript
interface Order {
  a: number; // Asset ID (calculated per market type)
  b: boolean; // true = buy, false = sell
  p: string; // Price (formatted string)
  s: string; // Size (formatted string)
  r: boolean; // true = reduce-only
  t: OrderType; // limit or trigger
  c?: string; // Optional client order ID
}
```

### Time-in-Force (TIF) Options

**Applies to**: All limit orders on all market types

**For comprehensive reference, see [ORDER-TYPES-REFERENCE.md](./ORDER-TYPES-REFERENCE.md)**

| TIF                 | Full Name           | Behavior                                  | Use Case                 |
| ------------------- | ------------------- | ----------------------------------------- | ------------------------ |
| `Gtc`               | Good til Canceled   | Remains on book until filled/canceled     | Standard limit orders    |
| `Ioc`               | Immediate or Cancel | Fills immediately, cancels unfilled       | Market-like execution    |
| `Alo`               | Add Liquidity Only  | Post-only, rejects if would match         | Maker-only strategies    |
| `FrontendMarket`    | Frontend Market     | Similar to IOC, HyperLiquid UI convention | Simplified market orders |
| `LiquidationMarket` | Liquidation Market  | Internal HyperLiquid use only             | System liquidations      |

**Source**: SDK `@nktkas/hyperliquid/esm/src/api/exchange/order.d.ts:29-37`

### Market Order Pattern

**HyperLiquid has no "pure" market order.** All markets emulate via aggressive limit + FrontendMarket:

- **Buy**: `price = currentPrice × (1 + slippage)`
- **Sell**: `price = currentPrice × (1 - slippage)`
- **TIF**: `FrontendMarket` (immediate or cancel)
- **MetaMask default**: 1% slippage (configurable)

### Trading Hours

**24/7/365 continuous trading** - No after-hours halts on any market type.

**Liquidity variations** (⚠️ Empirical):

- Peak hours: Tighter spreads
- Off-hours: Wider spreads, increase slippage tolerance

---

## Market-Specific Constraints

### HIP-3 Builder-Deployed Perps

**Source**: [HIP-3.md](./HIP-3.md)

#### Fees

- **2× base fee rates** _(HIP-3.md:46-47)_
  - User perspective: 2× validator-operated perp fees
  - Deployer receives: 50% of total fees (fixed)
  - Protocol receives: Same net fee as main DEX
  - User rebates: Unaffected, standard discounts apply
- **Fee configurability**: Coming in future upgrade

#### Margin Mode

- **Isolated-only required** _(HIP-3.md:44)_
- Cross margin: Future upgrade

#### Collateral Transfer

- **Automatic from main DEX** _(exchange-endpoint.md)_:
  - HIP-3 actions auto-transfer USDC from validator-operated perps balance
  - Collateral returns to source when released
- Manual transfer still supported via `usdClassTransfer()`

#### Open Interest Caps

**Source**: HIP-3.md:29-35

| Cap Type | Scope           | Limit                   | Notes                             |
| -------- | --------------- | ----------------------- | --------------------------------- |
| Notional | Per-DEX (total) | Custom, set by deployer | Sum of `abs(position) × mark`     |
| Notional | Per-asset       | Custom, set by deployer | Configurable via deployer actions |
| Size     | Per-asset       | 1B (constant)           | Sum of `abs(position)`            |

**Recommendation**: Set `szDecimals` such that minimal increment = $1-10 at initial mark price.

### Spot Markets (HIP-1)

**Source**: [HIP-1.md](./HIP-1.md)

#### Decimal Precision

- **`weiDecimals`** _(HIP-1.md:9)_: On-chain precision (e.g., 18 for ETH-like, 8 for BTC-like)
- **`szDecimals`** _(HIP-1.md:10)_: Trading lot size on order books
  - Lot size = `10^(weiDecimals - szDecimals)`
  - Constraint: `szDecimals + 5 ≤ weiDecimals`
- **Spot USDC**: `szDecimals = weiDecimals = 8` _(HIP-1.md:34)_

#### Dust Conversion

**Source**: HIP-1.md:44-48

- **Frequency**: Daily at 00:00 UTC
- **Threshold**: Balance < 1 lot size AND notional ≤ $1
- **Process**:
  1. Aggregate all user dust for token
  2. Submit market sell order for aggregated dust
  3. USDC proceeds distributed proportionally to dusted users
  4. If aggregate < 1 lot size: dust is burned
- **Skipped if**:
  - Book is one-sided
  - Notional too high (PURR: >$10k, others: >$3k)

#### Fee Distribution

**Source**: HIP-1.md:40-42

- **Base token fees**:
  - Deployer receives configurable share [0-100%]
  - Share can only decrease over time
  - Remainder is burned
- **Quote token fees** (non-USDC): Assistance Fund
- **USDC fees**: Standard protocol handling

### Main DEX Perpetuals

**No specific constraints beyond universal rules**

- Cross or isolated margin supported
- Standard fee tiers (0.045% taker, 0.015% maker at Tier 0)
- Full leverage tiers and asset configurations available

---

## Slippage Configuration

### Slippage Recommendations

**Note**: MetaMask applies 1% default to all markets. Adjust manually based on observed liquidity.

**⚠️ User guidance only** - not code-enforced:

| Market Type         | Recommended Slippage | Rationale                       |
| ------------------- | -------------------- | ------------------------------- |
| Main DEX (BTC, ETH) | 0.5-1%               | High liquidity                  |
| HIP-3 (xyz, abc)    | 5-10%                | Lower liquidity, wider spreads  |
| Spot (varies)       | 1-5%                 | Depends on token liquidity      |
| Take Profit         | Exact trigger price  | MetaMask: Limit execution       |
| Stop Loss           | 10% tolerance        | HyperLiquid platform protection |
| TWAP suborders      | 3% max               | Hyperliquid built-in constraint |

**Trade-offs**:

- Tight cap = Better price, higher cancel risk
- Loose cap = Higher fill probability, worse price

### Built-in Venue Safeguards

1. **MetaMask TP/SL Implementation**:
   - Take Profit: Limit order execution (precise price control)
   - Stop Loss: Market order execution (HyperLiquid's 10% protection applies)
2. **TWAP Execution**: 3% max per suborder
   - Use for large orders to smooth impact

---

## Account Funding

### Transfer Between Perp DEXs

Each HIP-3 DEX has **separate USDC balance** from main DEX. Manual transfer required:

```typescript
// Transfer from main DEX → xyz DEX
await exchangeClient.usdClassTransfer({
  sourceDex: '', // Empty string = main DEX
  destinationDex: 'xyz', // Target HIP-3 DEX name
  amount: '100', // USDC amount (string)
});

// Check balance before placing orders
const state = await infoClient.clearinghouseState({
  user: walletAddress,
  dex: 'xyz', // Specify DEX
});
const availableBalance = state.marginSummary.accountValue;
```

**Key points**:

- Only collateral token (USDC) transfers between perp DEXs
- Spot markets use separate spot wallet
- Transfers are instant (on-chain)
- HIP-3 orders auto-transfer from main DEX (optional manual transfer)

---

## Price Formatting

**Universal requirement** for all markets:

```typescript
import { formatHyperLiquidPrice } from '../utils/hyperLiquidAdapter';

const formattedPrice = formatHyperLiquidPrice({
  price: rawPrice,
  szDecimals: asset.szDecimals,
});
```

### Formatting Rules

1. Max 5 significant figures
2. Max `(6 - szDecimals)` decimal places
3. Must be divisible by tick size

### Failure Symptoms

- Error: `"Price must be divisible by tick size"`
- Order rejected at exchange level
- Silent order cancellation

---

## Error Handling

### Common Errors

| Error                                     | Cause                         | Fix                            |
| ----------------------------------------- | ----------------------------- | ------------------------------ |
| `"Order must have minimum value of $10."` | Notional < $10 at mid price   | Increase order size            |
| `"Order could not immediately match"`     | FrontendMarket, no liquidity  | Increase slippage cap          |
| `"Price must be divisible by tick size"`  | Raw price not formatted       | Use `formatHyperLiquidPrice()` |
| `"Insufficient balance"`                  | Account not funded            | Transfer USDC to DEX first     |
| Partial fill                              | Market order + tight slippage | Increase slippage tolerance    |

### Market-Specific Errors

**HIP-3**:

- `"Open interest cap exceeded"`: DEX or asset OI limit reached
- `"Isolated margin required"`: Cross margin not yet supported

**Spot**:

- Dust conversion failures: Check $1 notional minimum
- Token ID mismatch: Verify 34-char hex format

---

## Performance Considerations

### Fetching Prices

| Method      | Speed  | Use Case                         |
| ----------- | ------ | -------------------------------- |
| `allMids()` | Fast   | Mid prices, quick checks         |
| `l2Book()`  | Slower | Full order book, precise bid/ask |

### Best Practices

- Cache `meta`/`universe` data per session (changes infrequently)
- Reuse WebSocket transport connections
- Use price feeds from subscriptions (avoid polling)
- Subscribe to relevant DEX for HIP-3 (specify `dex` parameter)

---

## References

**Official Documentation**:

- [HyperLiquid Exchange API](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint)
- [HyperLiquid Info Endpoint - Perpetuals](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals)
- [HyperLiquid Info Endpoint - Spot](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/spot)

**HIP Standards**:

- [HIP-1: Native Token Standard](./HIP-1.md)
- [HIP-2: Hyperliquidity](./HIP-2.md)
- [HIP-3: Builder-Deployed Perpetuals](./HIP-3.md)

**Implementation Guides**:

- [Order Types Reference](./order-types-reference.md) - Comprehensive TIF and order type documentation
- [Asset ID Calculation](./asset-ids.md) - Detailed asset ID formulas with examples

---

## Document Metadata

**Created**: 2025-10-16
**Last Updated**: 2025-10-16
**Supersedes**: HIP-3-TRADING-GUIDE.md
**Verification Standard**: All claims traced to official HyperLiquid docs, HIP standards, or SDK source with citations
