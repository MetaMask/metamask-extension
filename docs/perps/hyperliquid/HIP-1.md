# HIP-1: Native token standard

HIP-1 is a capped supply fungible token standard. It also features onchain spot order books between pairs of HIP-1 tokens.

The sender of the token genesis transaction will specify the following:

1. `name`: human readable, maximum 6 characters, no uniqueness constraints.
2. `weiDecimals`: the conversion rate from the minimal integer unit of the token to a human-interpretable float. For example, ETH on EVM networks has `weiDecimals = 18` and BTC on Bitcoin network has `weiDecimals = 8`.
3. `szDecimals`: the minimum tradable number of decimals on spot order books. In other words, the lot size of the token on all spot order books will be `10 ** (weiDecimals - szDecimals)`. It is required that `szDecimals + 5 <= weiDecimals`.
4. `maxSupply`: the maximum and initial supply. The supply may decrease over time due to spot order book fees or future burn mechanisms.
5. `initialWei`: optional genesis balances specified by the sender of the transaction. This could include a multisig treasury, an initial bridge mint, etc.
6. `anchorTokenWei` the sender of the transaction can specify existing HIP-1 tokens to proportionally receieve genesis balances.
7. `hyperliquidityInit`: parameters for initializing the Hyperliquidity for the USDC spot pair. See HIP-2 section for more details.

The deployment transaction of the token will generate a globally unique hash by which the execution logic will index the token.

### Gas cost for deployment

Like all transactions, gas costs will ultimately be paid in the native Hyperliquid token. Currently, the following gas cost is in HYPE.

1. The gas cost of deployment is decided through a dutch auction with duration 31 hours. In this period, the deployment gas decreases linearly from `initial_price` to `500 HYPE` . The initial price is `500 HYPE` if the last auction failed to complete, otherwise 2 times the last gas price.
2. Genesis to existing anchor tokens holders are proportional to `balance - 1e-6 * anchorTokenMaxSupply`at the time of the deployed token's genesis. If this value is negative, no genesis tokens are received. In particular, this means genesis holders must hold at least 0.0001% of the anchor token's max supply at genesis to be included in the deployed token's genesis.
3. Potential workaround for constraint (2): a small initial USDC gas fee (value TBD) for the initial state update of each `(address, token)` pair, either through trading or transfer. Further trades and transfers to initialized ledgers are gas free within the standard Hyperliquid fill rate conditions.

### IMPORTANT GAS DETAILS:

The only time-sensitive step of the process is the very first step of deploying the token, where the deployer specifies name, szDecimals, and weiDecimals. This step is when the gas is charged and the token is locked in. It is recommended to take all the necessary time after this step to reduce errors. There is no time limit once the gas is paid.

Deployment is a complex multi-stage process, and it is possible to get in a state where your deployment is stuck. For example, Hyperliquidity and total supply may be incompatible. It is the deployer's responsibility to try the exact deployment on testnet first: <https://app.hyperliquid-testnet.xyz/deploySpot>. Gas cannot be refunded if the deployment is stuck.

### Deploying existing assets

One common deployment pattern is to use HyperCore's onchain spot order books for trading an asset that exists externally. For example, this includes assets bridged from other chains or tokenized RWAs like stablecoins. These deployers often use the HyperEVM for minting in order to leverage battle-tested multichain bridging, including the following options:

- LayerZero: <https://docs.layerzero.network/v2/developers/hyperliquid/hyperliquid-concepts>
- Axelar: <https://axelarscan.io/resources/chains>
- Chainlink: <https://docs.chain.link/ccip/tools-resources/network-specific/hyperliquid-integration-guide>
- Debridge: <https://docs.debridge.com/dmp-details/dmp/protocol-overview>
- Wormhole: <https://wormhole.com/docs/products/messaging/get-started/>

To deploy a HyperEVM minted ERC-20 token for trading on HyperCore, the deployer should first purchase a ticker in the permissionless HIP-1 Dutch auction on HyperCore detailed above. For the simplest setup, during the genesis step, the deployer can put the max supply (or `2^64-1` for maximum flexibility) in the system address. See [here](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm/hypercore-less-than-greater-than-hyperevm-transfers#system-addresses) for how system address is determined based on the HyperCore token index. Usually deployers of bridged assets elect not to use Hyperliquidity, which can be configured with the `noHyperliquidity` field.

Once the HyperCore token and HyperEVM ERC-20 address are linked, transfers to the system address on the HyperEVM will reflect in the sender's HyperCore balance, and vice versa. It's highly recommended to test the exact setup on testnet.&#x20;

### USDC&#x20;

USDC is currently used for all perps margining. With HIP-1, USDC also becomes a spot token with an atomic transfer between perps and spot wallet USDC. Spot USDC has `szDecimals = weiDecimals = 8` to allow for a wide range of HIP-1 token prices.

### Spot trading&#x20;

HIP-1 tokens trade on order books parametrized by `base` and `quote` tokens, where limit orders are commitments to exchange `sz * 10 ** (weiDecimalsBase - szDecimalsBase)` units of the base token for `px * sz * 10 ** (weiDecimalsQuote - szDecimalsQuote)` units of the quote token. Any HIP-1 token will be initialized with a native spot order book where the quote token is Spot USDC. Trading of arbitrary pairs of native tokens can be enabled in the future.

### Trading fees&#x20;

Native spot and perps order books share the same volume-based fee schedule for each address. Fees collected in non-USDC HIP-1 native tokens are sent to the deployer, i.e. the deployer's fee share defaults to 100%. The base token deployer can set this percentage in the range of \[0, 100%] but only lower than the previous value afterwards. The portion of base token fees that is not redirected to the deployer is burned. For other quote tokens besides USDC, the fees are sent to the Assistance Fund. Quote token deployers cannot configure a trading fee share.

For legacy tokens that were deployed before the deployer fee share was implemented, deployers can increase the fee share once from zero to a positive value. After this one-time change, the fee share can only decrease. The deployer fee share for legacy tokens cannot be set back to exactly zero after being set to a positive value.

### Spot dust conversion

Spot dusting occurs once a day at 00:00 UTC. All spot balances that are less than 1 lot size with notional value <= 1 USD will be dusted. Here, the notional value is computed as the prevailing mid price of the token against USDC, times the token balance. All users’ dust across a token is aggregated, and a market sell order is automatically submitted to the book. If the aggregate dust is smaller than one lot size, then that dust is burned. Otherwise, the USDC from the successfully converted dust will be allocated back to all dusted users on a weighted basis, where the weighting is equal to the user’s fraction of the aggregate dust.&#x20;

Dusting will not occur if 1) the book is one-sided or 2) the amount of notional dust is too high such that the book would be impacted by this operation. For PURR, this is 10000 USDC; for all other tokens, this is 3000 USDC. Note: the amount of USDC received may be less than the notional amount computed from the mid because of slippage incurred while dusting or if there was insufficient liquidity to convert the total dust across all users.&#x20;
