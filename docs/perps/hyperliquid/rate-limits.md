# Rate limits and user limits

The following rate limits apply per IP address:

- REST requests share an aggregated weight limit of 1200 per minute.&#x20;
  - All documented `exchange` API requests have a weight of `1 + floor(batch_length / 40)`. For example, unbatched actions have weight `1` and a batched order request of length 79 has weight `2`. Here, `batch_length`is the length of the array in the action, e.g. the number of orders in a batched order action.
  - The following `info` requests have weight 2: `l2Book, allMids, clearinghouseState, orderStatus, spotClearinghouseState, exchangeStatus.`
  - The following `info` requests have weight 60: `userRole` .
  - All other documented `info` requests have weight 20.&#x20;
  - The following `info` endpoints have an additional rate limit weight per 20 items returned in the response: `recentTrades`, `historicalOrders`, `userFills`, `userFillsByTime`, `fundingHistory`, `userFunding`, `nonUserFundingUpdates`, `twapHistory`, `userTwapSliceFills`, `userTwapSliceFillsByTime`, `delegatorHistory`, `delegatorRewards`, `validatorStats` .
  - The `candleSnapshot` info endpoint has an additional rate limit weight per 60 items returned in the response.
  - All `explorer` API requests have a weight of 40. `blockList` has an additional rate limit of 1 per block. Note that older blocks which have not been recently queried may be weighted more heavily. For large batch requests, use the S3 bucket instead.
- Maximum of 100 websocket connections
- Maximum of 1000 websocket subscriptions
- Maximum of 10 unique users across user-specific websocket subscriptions
- Maximum of 2000 messages sent to Hyperliquid per minute across all websocket connections
- Maximum of 100 simultaneous inflight post messages across all websocket connections
- Maximum of 100 EVM JSON-RPC requests per minute for `rpc.hyperliquid.xyz/evm`. Note that other JSON-RPC providers have more sophisticated rate limiting logic and archive node functionality.&#x20;

Use websockets for lowest latency realtime data. See the python SDK for a full-featured example.

### Address-based limits

Address-based limits apply per user, with sub-accounts treated as separate users.

The rate limiting logic allows 1 request per 1 USDC traded cumulatively since address inception. For example, with an order value of 100 USDC, this requires a fill rate of 1%. Each address starts with an initial buffer of 10000 requests. When rate limited, an address is allowed one request every 10 seconds. Cancels have cumulative limit `min(limit + 100000, limit * 2)` where `limit` is the default limit for other actions. This way, hitting the address-based rate limit still allows open orders to be canceled. Note that this rate limit only applies to actions, not info requests.&#x20;

Each user has a default open order limit of 1000 plus one additional order for every 5M USDC of volume, capped at a total of 5000 open orders. When an order is placed with at least 1000 other open orders by the same user, it will be rejected if it is reduce-only or a trigger order.&#x20;

During high congestion, addresses are limited to use 2x their maker share percentage of the block space. During high traffic, it can therefore be helpful to not resend cancels whose results have already been returned via the API.&#x20;

### Batched Requests

A batched request with `n` orders (or cancels) is treated as one request for IP based rate limiting, but as `n` requests for address-based rate limiting. &#x20;
