# Subscriptions

### Subscription messages

To subscribe to specific data feeds, you need to send a subscription message. The subscription message format is as follows:

```json
{
  "method": "subscribe",
  "subscription": { ... }
}
```

The subscription ack provides a snapshot of previous data for time series data (e.g. user fills). These snapshot messages are tagged with `isSnapshot: true` and can be ignored if the previous messages were already processed.

The subscription object contains the details of the specific feed you want to subscribe to. Choose from the following subscription types and provide the corresponding properties:

1. `allMids`:
   - Subscription message: `{ "type": "allMids", "dex": "<dex>" }`
   - Data format: `AllMids`&#x20;
   - The `dex` field represents the perp dex to source mids from.
   - Note that the `dex` field is optional. If not provided, then the first perp dex is used. Spot mids are only included with the first perp dex.
2. `notification`:
   - Subscription message: `{ "type": "notification", "user": "<address>" }`
   - Data format: `Notification`
3. `webData3` :
   - Subscription message: `{ "type": "webData3", "user": "<address>" }`
   - Data format: `WebData3`&#x20;
4. `twapStates` :
   - Subscription message: `{ "type": "twapStates", "user": "<address>" }`
   - Data format: `TwapStates`&#x20;
5. `clearinghouseState:`
   - Subscription message: `{ "type": "clearinghouseState", "user": "<address>" }`
   - Data format: `ClearinghouseState`&#x20;
6. `openOrders`:
   - Subscription message: `{ "type": "openOrders", "user": "<address>" }`
   - Data format: `OpenOrders`&#x20;
7. `candle`:
   - Subscription message: `{ "type": "candle", "coin": "<coin_symbol>", "interval": "<candle_interval>" }`
   - &#x20;Supported intervals: "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "8h", "12h", "1d", "3d", "1w", "1M"
   - Data format: `Candle[]`
8. `l2Book`:
   - Subscription message: `{ "type": "l2Book", "coin": "<coin_symbol>" }`
   - Optional parameters: nSigFigs: int, mantissa: int
   - Data format: `WsBook`
9. `trades`:
   - Subscription message: `{ "type": "trades", "coin": "<coin_symbol>" }`
   - Data format: `WsTrade[]`
10. `orderUpdates`:
    - Subscription message: `{ "type": "orderUpdates", "user": "<address>" }`
    - Data format: `WsOrder[]`
11. `userEvents`:&#x20;
    - Subscription message: `{ "type": "userEvents", "user": "<address>" }`
    - Data format: `WsUserEvent`
12. `userFills`:&#x20;
    - Subscription message: `{ "type": "userFills", "user": "<address>" }`
    - Optional parameter: `aggregateByTime: bool`&#x20;
    - Data format: `WsUserFills`
13. `userFundings`:&#x20;
    - Subscription message: `{ "type": "userFundings", "user": "<address>" }`
    - Data format: `WsUserFundings`
14. `userNonFundingLedgerUpdates`:&#x20;
    - Subscription message: `{ "type": "userNonFundingLedgerUpdates", "user": "<address>" }`
    - Data format: `WsUserNonFundingLedgerUpdates`
15. `activeAssetCtx`:&#x20;
    - Subscription message: `{ "type": "activeAssetCtx", "coin": "<coin_symbol>" }`
    - Data format: `WsActiveAssetCtx` or `WsActiveSpotAssetCtx`&#x20;
16. `activeAssetData`: (only supports Perps)
    - Subscription message: `{ "type": "activeAssetData", "user": "<address>", "coin": "<coin_symbol>" }`
    - Data format: `WsActiveAssetData`
17. `userTwapSliceFills`:&#x20;
    - Subscription message: `{ "type": "userTwapSliceFills", "user": "<address>" }`
    - Data format: `WsUserTwapSliceFills`
18. `userTwapHistory`:&#x20;
    - Subscription message: `{ "type": "userTwapHistory", "user": "<address>" }`
    - Data format: `WsUserTwapHistory`
19. `bbo` :
    - Subscription message: `{ "type": "bbo", "coin": "<coin>" }`
    - Data format: `WsBbo`

### Data formats

The server will respond to successful subscriptions with a message containing the `channel` property set to `"subscriptionResponse"`, along with the `data` field providing the original subscription. The server will then start sending messages with the `channel` property set to the corresponding subscription type e.g. `"allMids"` and the `data` field providing the subscribed data.

The `data` field format depends on the subscription type:

- `AllMids`: All mid prices.
  - Format: `AllMids { mids: Record<string, string> }`
- `Notification`: A notification message.
  - Format: `Notification { notification: string }`
- `WebData2`: Aggregate information about a user, used primarily for the frontend.
  - Format: `WebData2`
- `WsTrade[]`: An array of trade updates.
  - Format: `WsTrade[]`
- `WsBook`: Order book snapshot updates.
  - Format: `WsBook { coin: string; levels: [Array<WsLevel>, Array<WsLevel>]; time: number; }`
- `WsOrder`: User order updates.
  - Format: `WsOrder[]`
- `WsUserEvent`: User events that are not order updates
  - Format: `WsUserEvent { "fills": [WsFill] | "funding": WsUserFunding | "liquidation": WsLiquidation | "nonUserCancel": [WsNonUserCancel] }`
- `WsUserFills` : Fills snapshot followed by streaming fills
- `WsUserFundings` : Funding payments snapshot followed by funding payments on the hour
- `WsUserNonFundingLedgerUpdates`: Ledger updates not including funding payments: withdrawals, deposits, transfers, and liquidations
- `WsBbo` : Bbo updates that are sent only if the bbo changes on a block

For the streaming user endpoints such as `WsUserFills`,`WsUserFundings` the first message has `isSnapshot: true` and the following streaming updates have `isSnapshot: false`.&#x20;

### Data type definitions

Here are the definitions of the data types used in the WebSocket API:

```typescript
interface WsTrade {
  coin: string;
  side: string;
  px: string;
  sz: string;
  hash: string;
  time: number;
  // tid is 50-bit hash of (buyer_oid, seller_oid).
  // For a globally unique trade id, use (block_time, coin, tid)
  tid: number;
  users: [string, string]; // [buyer, seller]
}

// Snapshot feed, pushed on each block that is at least 0.5 since last push
interface WsBook {
  coin: string;
  levels: [Array<WsLevel>, Array<WsLevel>];
  time: number;
}

interface WsBbo {
  coin: string;
  time: number;
  bbo: [WsLevel | null, WsLevel | null];
}

interface WsLevel {
  px: string; // price
  sz: string; // size
  n: number; // number of orders
}

interface Notification {
  notification: string;
}

interface AllMids {
  mids: Record<string, string>;
}

interface Candle {
  t: number; // open millis
  T: number; // close millis
  s: string; // coin
  i: string; // interval
  o: number; // open price
  c: number; // close price
  h: number; // high price
  l: number; // low price
  v: number; // volume (base unit)
  n: number; // number of trades
}

type WsUserEvent =
  | { fills: WsFill[] }
  | { funding: WsUserFunding }
  | { liquidation: WsLiquidation }
  | { nonUserCancel: WsNonUserCancel[] };

interface WsUserFills {
  isSnapshot?: boolean;
  user: string;
  fills: Array<WsFill>;
}

interface WsFill {
  coin: string;
  px: string; // price
  sz: string; // size
  side: string;
  time: number;
  startPosition: string;
  dir: string; // used for frontend display
  closedPnl: string;
  hash: string; // L1 transaction hash
  oid: number; // order id
  crossed: boolean; // whether order crossed the spread (was taker)
  fee: string; // negative means rebate
  tid: number; // unique trade id
  liquidation?: FillLiquidation;
  feeToken: string; // the token the fee was paid in
  builderFee?: string; // amount paid to builder, also included in fee
}

interface FillLiquidation {
  liquidatedUser?: string;
  markPx: number;
  method: 'market' | 'backstop';
}

interface WsUserFunding {
  time: number;
  coin: string;
  usdc: string;
  szi: string;
  fundingRate: string;
}

interface WsLiquidation {
  lid: number;
  liquidator: string;
  liquidated_user: string;
  liquidated_ntl_pos: string;
  liquidated_account_value: string;
}

interface WsNonUserCancel {
  coin: String;
  oid: number;
}

interface WsOrder {
  order: WsBasicOrder;
  status: string; // See https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint#query-order-status-by-oid-or-cloid for a list of possible values
  statusTimestamp: number;
}

interface WsBasicOrder {
  coin: string;
  side: string;
  limitPx: string;
  sz: string;
  oid: number;
  timestamp: number;
  origSz: string;
  cloid: string | undefined;
}

interface WsActiveAssetCtx {
  coin: string;
  ctx: PerpsAssetCtx;
}

interface WsActiveSpotAssetCtx {
  coin: string;
  ctx: SpotAssetCtx;
}

type SharedAssetCtx = {
  dayNtlVlm: number;
  prevDayPx: number;
  markPx: number;
  midPx?: number;
};

type PerpsAssetCtx = SharedAssetCtx & {
  funding: number;
  openInterest: number;
  oraclePx: number;
};

type SpotAssetCtx = SharedAssetCtx & {
  circulatingSupply: number;
};

interface WsActiveAssetData {
  user: string;
  coin: string;
  leverage: Leverage;
  maxTradeSzs: [number, number];
  availableToTrade: [number, number];
}

interface WsTwapSliceFill {
  fill: WsFill;
  twapId: number;
}

interface WsUserTwapSliceFills {
  isSnapshot?: boolean;
  user: string;
  twapSliceFills: Array<WsTwapSliceFill>;
}

interface TwapState {
  coin: string;
  user: string;
  side: string;
  sz: number;
  executedSz: number;
  executedNtl: number;
  minutes: number;
  reduceOnly: boolean;
  randomize: boolean;
  timestamp: number;
}

type TwapStatus = 'activated' | 'terminated' | 'finished' | 'error';
interface WsTwapHistory {
  state: TwapState;
  status: {
    status: TwapStatus;
    description: string;
  };
  time: number;
}

interface WsUserTwapHistory {
  isSnapshot?: boolean;
  user: string;
  history: Array<WsTwapHistory>;
}

// Additional undocumented fields in WebData3 will be removed on a future update
interface WebData3 {
  userState: {
    agentAddress: string | null;
    agentValidUntil: number | null;
    serverTime: number;
    cumLedger: number;
    isVault: boolean;
    user: string;
    optOutOfSpotDusting?: boolean;
    dexAbstractionEnabled?: boolean;
  };
  perpDexStates: Array<PerpDexState>;
}

interface PerpDexState {
  totalVaultEquity: number;
  perpsAtOpenInterestCap?: Array<string>;
  leadingVaults?: Array<LeadingVault>;
}

interface LeadingVault {
  address: string;
  name: string;
}

interface ClearinghouseState {
  assetPositions: Array<AssetPosition>;
  marginSummary: MarginSummary;
  crossMarginSummary: MarginSummary;
  crossMaintenanceMarginUsed: number;
  withdrawable: number;
}

interface MarginSummary {
  accountValue: number;
  totalNtlPos: number;
  totalRawUsd: number;
  totalMarginUsed: number;
}

interface AssetPosition {
  type: 'oneWay';
  position: Position;
}

interface OpenOrders {
  dex: string;
  user: string;
  orders: Array<Order>;
}

interface TwapStates {
  dex: string;
  user: string;
  states: Array<[number, TwapState]>;
}
```

<details>

<summary>WsUserNonFundingLedgerUpdates</summary>

```typescript
interface WsUserNonFundingLedgerUpdate {
  time: number;
  hash: string;
  delta: WsLedgerUpdate;
}

type WsLedgerUpdate =
  | WsDeposit
  | WsWithdraw
  | WsInternalTransfer
  | WsSubAccountTransfer
  | WsLedgerLiquidation
  | WsVaultDelta
  | WsVaultWithdrawal
  | WsVaultLeaderCommission
  | WsSpotTransfer
  | WsAccountClassTransfer
  | WsSpotGenesis
  | WsRewardsClaim;

interface WsDeposit {
  type: "deposit";
  usdc: number;
}

interface WsWithdraw {
  type: "withdraw";
  usdc: number;
  nonce: number;
  fee: number;
}

interface WsInternalTransfer {
  type: "internalTransfer";
  usdc: number;
  user: string;
  destination: string;
  fee: number;
}

interface WsSubAccountTransfer {
  type: "subAccountTransfer";
  usdc: number;
  user: string;
  destination: string;
}

interface WsLedgerLiquidation {
  type: "liquidation";
  // NOTE: for isolated positions this is the isolated account value
  accountValue: number;
  leverageType: "Cross" | "Isolated";
  liquidatedPositions: Array<LiquidatedPosition>;
}

interface LiquidatedPosition {
  coin: string;
  szi: number;
}

interface WsVaultDelta {
  type: "vaultCreate" | "vaultDeposit" | "vaultDistribution";
  vault: string;
  usdc: number;
}

interface WsVaultWithdrawal {
  type: "vaultWithdraw";
  vault: string;
  user: string;
  requestedUsd: number;
  commission: number;
  closingCost: number;
  basis: number;
  netWithdrawnUsd: number;
}

interface WsVaultLeaderCommission {
  type: "vaultLeaderCommission";
  user: string;
  usdc: number;
}

interface WsSpotTransfer = {
  type: "spotTransfer";
  token: string;
  amount: number;
  usdcValue: number;
  user: string;
  destination: string;
  fee: number;
}

interface WsAccountClassTransfer = {
  type: "accountClassTransfer";
  usdc: number;
  toPerp: boolean;
}

interface WsSpotGenesis = {
  type: "spotGenesis";
  token: string;
  amount: number;
}

interface WsRewardsClaim = {
  type: "rewardsClaim";
  amount: number;
}
```

</details>

Please note that the above data types are in TypeScript format, and their usage corresponds to the respective subscription types.

### Examples

Here are a few examples of subscribing to different feeds using the subscription messages:

1. Subscribe to all mid prices:

   ```json
   { "method": "subscribe", "subscription": { "type": "allMids" } }
   ```

2. Subscribe to notifications for a specific user:

   ```json
   {
     "method": "subscribe",
     "subscription": { "type": "notification", "user": "<address>" }
   }
   ```

3. Subscribe to web data for a specific user:

   ```json
   {
     "method": "subscribe",
     "subscription": { "type": "webData", "user": "<address>" }
   }
   ```

4. Subscribe to candle updates for a specific coin and interval:

   ```json
   {
     "method": "subscribe",
     "subscription": {
       "type": "candle",
       "coin": "<coin_symbol>",
       "interval": "<candle_interval>"
     }
   }
   ```

5. Subscribe to order book updates for a specific coin:

   ```json
   {
     "method": "subscribe",
     "subscription": { "type": "l2Book", "coin": "<coin_symbol>" }
   }
   ```

6. Subscribe to trades for a specific coin:

   ```json
   {
     "method": "subscribe",
     "subscription": { "type": "trades", "coin": "<coin_symbol>" }
   }
   ```

### Unsubscribing from WebSocket feeds

To unsubscribe from a specific data feed on the Hyperliquid WebSocket API, you need to send an unsubscribe message with the following format:

```json
{
  "method": "unsubscribe",
  "subscription": { ... }
}
```

The `subscription` object should match the original subscription message that was sent when subscribing to the feed. This allows the server to identify the specific feed you want to unsubscribe from. By sending this unsubscribe message, you inform the server to stop sending further updates for the specified feed.

Please note that unsubscribing from a specific feed does not affect other subscriptions you may have active at that time. To unsubscribe from multiple feeds, you can send multiple unsubscribe messages, each with the appropriate subscription details.
