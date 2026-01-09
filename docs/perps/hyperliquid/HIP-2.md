# HIP-3: Builder-deployed perpetuals

The Hyperliquid protocol supports permissionless builder-deployed perps (HIP-3), a key milestone toward fully decentralizing the perp listing process.&#x20;

The deployer of a perp market is responsible for

1. Market definition, including the oracle definition and contract specifications
2. Market operation, including setting oracle prices, leverage limits, and settling the market if needed

HIP-3 inherits the HyperCore stack including its high performance margining and order books. For example, the API to trade HIP-3 perps is unified with other HyperCore actions. To trade HIP-3 assets, the asset ID simply needs to be set using the schema [here](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/asset-ids).

## Spec

1. The staking requirement for mainnet will be 500k HYPE. This requirement is expected to decrease over time as the infrastructure matures. Any amount staked above the most recent requirement can be unstaked. The staking requirement is maintained for 30 days even after all of the deployer's perps have been halted.
2. Any deployer that meets the staking requirement can deploy one perp dex. As a reminder, each perp dex features independent margining, order books, and deployer settings. A future upgrade may support multiple dex deployments sharing the same deployer and staking requirement.
3. Any quote asset can be used as the collateral asset for a dex. As a reminder, assets that fail to meet the permissionless quote asset requirements will lose quote asset status based on onchain validator vote. Such a vote would also disable perp dexs that use this asset as collateral.
4. HIP-3 deployers are not subject to slashing related to quote assets. On a future upgrade, dexs with disabled quote assets would support migration to a new collateral token. This is not expected to happen on mainnet, as quote token deployers have their separate staking and slashing conditions. In summary, the quote asset choice is important for trading fee and product considerations, but is not an existential risk for HIP-3 deployers.
5. The first 3 assets deployed in any perp dex do not require auction participation. Additional assets go through a Dutch auction with the same hyperparameters (including frequency and minimum price) as the HIP-1 auction. The HIP-3 auction for additional perps is shared across all perp dexs. Future upgrades will support improved ergonomics around reserving assets for time-sensitive future deployments.
6. Isolated-only margin mode is required. Cross margin will be supported in a future upgrade.
7. HIP-3 markets incorporate the usual sources of trading fee discounts, including staking discounts, referral rewards, and aligned collateral discount. From the deployer perspective, the fee share is fixed at 50%. From the user perspective, fees are 2x the usual fees on validator-operated perp markets. The net effect is that the protocol collects the same fee regardless of whether the trade is on an HIP-3 or a validator-operated perp. User rebates are unaffected, and do not interact with the deployer. Deployer configurability of fees will be supported in a future upgrade.
8. Aligned stablecoin collateral will automatically receive reduced fees once the alignment condition (which is being updated based on user and deployer feedback) is implemented.

## Settlement

The deployer may settle an asset using the `haltTrading` action. This cancels all orders and settles positions to the current mark price. The same action can be used to resume trading, effectively recycling the asset. This could be used to list dated contracts without participating in the deployment auction for each new contract.

Once all assets are settled, a deployer's required stake is free to be unstaked.

## Oracle

While the oracle is completely general at the protocol level, perps make the most mathematical sense when there is a well-defined underlying asset or data feed which is difficult to manipulate and has underlying economic significance. Most price indices are not amenable as perp oracle sources. Deployers should consider edge cases carefully before listing markets, as they are subject to slashing for all listed markets on their DEX.

## **Slashing**&#x20;

Note: in all usages below, "slashing" is only in the context of HIP-3.&#x20;

To ensure high quality markets and protect users, deployers must maintain 500k staked HYPE. In the event of malicious market operation, validators have the authority to slash the deployer’s stake by conducting a stake-weighted vote. Even if the deployer has unstaked and initiated a staking withdrawal, the stake is still slashable during the 7-day unstaking queue.&#x20;

While slashing is ultimately by validator quorum, the protocol guidelines have been distilled from careful testnet analysis, user feedback, and deployer feedback. The guiding principle is that slashing is to prevent behavior that jeopardizes protocol correctness, uptime, or performance. A useful rule of thumb is that any slashable behavior should be accompanied by a bug fix in the protocol implementation. Therefore, HIP-3 should not require slashing in its final state. However, slashing is an important safety mechanism for a practical rollout of this large feature set.&#x20;

Slashing is technical and does not distinguish between malicious and incompetent behavior. Relatedly, slashing does not distinguish between

1. A deployer that deviates from a well-designed contract spec
2. A deployer that faithfully follows a poorly designed contract spec
3. A deployer whose private keys are compromised

The key factor is the effect of the deployer's actions on the protocol. Note that any bugs discovered are generously covered by the bug bounty program, provided such discoveries meet the terms of that program, including being responsibly disclosed without being exploited. These reports are greatly appreciated.&#x20;

Even attempted malicious deployer inputs that do not cause protocol issues are slashable. Similarly, inputs that do cause protocol issues but that are not irregular are not slashable. In particular, bugs under normal operation that are unrelated to the deployer inputs are not within scope of slashing. The interpretation of "irregular" inputs is to be determined by validator vote, and includes inputs that exploit edge cases or loopholes that circumvent system limits. All deployer transactions are onchain, and can be independently analyzed by any interested parties.&#x20;

Some malicious behavior is valid by protocol definition, but incorrect by certain subjective interpretations. The slashing principle provides that the protocol should not intervene in subjective matters. The motivation is that while proof-of-stake blockchains could hard fork on undesirable state transitions, they very rarely do. Neutrality of the platform is an incredibly important feature to preserve. Relatedly, the slashed stake by the deployer is burned instead of being distributed to affected users. This is again based on proof-of-stake principles and prevents some forms of misaligned incentives between users and deployers. While the protocol layer does not enforce subjective irregularities, the downstream application and social layers can. Ultimately, the deployer's reputation and future success is always at stake.&#x20;

The amount slashed in a given instance is ultimately a stake-weighted median of validator votes. However, as a general guideline, irregular inputs that cause invalid state transitions or prolonged network downtime can be slashed up to 100%. Irregular inputs causing brief network downtime can be partially slashed up to 50%. Invalid inputs that cause network degradation or performance issues can be partially slashed up to 20%.&#x20;

Lastly, the slashing conditions are independent of the staker composition. Therefore, LST operators should carefully diligence deployers. LST operators should also carefully and clearly communicate slashing risks to their users. A self-bonding requirement for deployers could make sense.&#x20;

In the most likely outcome, slashing never happens on mainnet. A large amount of technical work has gone into making HIP-3 a self-contained and technically robust system. Barring implementation issues, HIP-3 inherits Hyperliquid's carefully designed mathematical solvency guarantees.
