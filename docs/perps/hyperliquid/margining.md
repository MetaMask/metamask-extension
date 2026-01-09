# Margining

Margin computations follow similar formulas to major centralized derivatives exchanges.

### Margin Mode

When opening a position, a margin mode is selected. _Cross margin_ is the default, which allows for maximal capital efficiency by sharing collateral between all other cross margin positions. _Isolated margin_ is also supported, which allows an asset's collateral to be constrained to that asset. Liquidations in that asset do not affect other isolated positions or cross positions. Similarly, cross liquidations or other isolated liquidations do not affect the original isolated position.&#x20;

Some assets are _isolated-only_, which functions the same as isolated margin with the additional constraint that margin cannot be removed. Margin is proportionally removed as the position is closed.&#x20;

### Initial Margin and Leverage

Leverage can be set by a user to any integer between 1 and the max leverage. Max leverage depends on the asset.&#x20;

The margin required to open a position is `position_size * mark_price / leverage`. The initial margin is used by the position and cannot be withdrawn for cross margin positions. Isolated positions support adding and removing margin after opening the position. Unrealized pnl for cross margin positions will automatically be available as initial margin for new positions, while isolated positions will apply unrealized pnl as additional margin for the open position.\
\
The leverage of an existing position can be increased without closing the position. Leverage is only checked upon opening a position. Afterwards, the user is responsible for monitoring the leverage usage to avoid liquidation. Possible actions to take on positions with negative unrealized pnl include partially or fully closing the position, adding margin (if isolated), and depositing USDC (if cross).

### Unrealized PNL and transfer margin requirements

Unrealized pnl can be withdrawn from isolated positions or cross account, but only if the remaining margin is at least 10% of the total notional position value of all open positions. The margin remaining must also meet the initial margin requirement, i.e. `transfer_margin_required = max(initial_margin_required, 0.1 * total_position_value)`&#x20;

Here, "transferring" includes any action that removes margin from a position, other than trading. Examples include withdrawals, transfer to spot wallet, and isolated margin transfers.

### Maintenance Margin and Liquidations

Cross positions are liquidated when the account value (including unrealized pnl) is less than the _maintenance margin_ times the total open notional position. The maintenance margin is currently set to half of the initial margin at max leverage.&#x20;

Isolated positions are liquidated by the same maintenance margin logic, but the only inputs to the computation are the isolated margin and the notional value of the isolated position.
