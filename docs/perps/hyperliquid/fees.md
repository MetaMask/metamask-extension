# Fees

Fees are based on your rolling 14 day volume and are assessed at the end of each day in UTC. Sub-account volume counts toward the master account and all sub-accounts share the same fee tier. Vault volume is treated separately from the master account. Referral rewards apply for a user's first $1B in volume and referral discounts apply for a user's first $25M in volume.

Maker rebates are paid out continuously on each trade directly to the trading wallet. Users can claim referral rewards from the Referrals page.&#x20;

There are separate fee schedules for perps vs spot. Perps and spot volume will be counted together to determine your fee tier, and spot volume will count double toward your fee tier. i.e., `(14d weighted volume) = (14d perps volume) + 2 * (14d spot volume)`.

For each user, there is one fee tier across all assets, including perps, HIP-3 perps, and spot. When growth mode is activated for an HIP-3 perp, protocol fees, rebates, and volume contributions are reduced by 90%. HIP-3 deployers can configure an additional fee share between 0-300% (0-100% for growth mode). If the share is above 100%, the protocol fee is also increased to be equal to the deployer fee.

Spot pairs between two spot quote assets have 80% lower taker fees, maker rebates, and user volume contribution.

[aligned-quote-assets](https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/aligned-quote-assets 'mention') benefit from 20% lower taker fees, 50% better maker rebates, and 20% more volume contribution toward fee tiers.

### Perps fee tiers

|      |                         | Base rate |        | Diamond |         | Platinum |         | Gold    |         | Silver  |         | Bronze  |         | Wood    |         |
| ---- | ----------------------- | --------- | ------ | ------- | ------- | -------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- |
| Tier | 14d weighted volume ($) | Taker     | Maker  | Taker   | Maker   | Taker    | Maker   | Taker   | Maker   | Taker   | Maker   | Taker   | Maker   | Taker   | Maker   |
| 0    |                         | 0.045%    | 0.015% | 0.0270% | 0.0090% | 0.0315%  | 0.0105% | 0.0360% | 0.0120% | 0.0383% | 0.0128% | 0.0405% | 0.0135% | 0.0428% | 0.0143% |
| 1    | >5M                     | 0.040%    | 0.012% | 0.0240% | 0.0072% | 0.0280%  | 0.0084% | 0.0320% | 0.0096% | 0.0340% | 0.0102% | 0.0360% | 0.0108% | 0.0380% | 0.0114% |
| 2    | >25M                    | 0.035%    | 0.008% | 0.0210% | 0.0048% | 0.0245%  | 0.0056% | 0.0280% | 0.0064% | 0.0298% | 0.0068% | 0.0315% | 0.0072% | 0.0333% | 0.0076% |
| 3    | >100M                   | 0.030%    | 0.004% | 0.0180% | 0.0024% | 0.0210%  | 0.0028% | 0.0240% | 0.0032% | 0.0255% | 0.0034% | 0.0270% | 0.0036% | 0.0285% | 0.0038% |
| 4    | >500M                   | 0.028%    | 0.000% | 0.0168% | 0.0000% | 0.0196%  | 0.0000% | 0.0224% | 0.0000% | 0.0238% | 0.0000% | 0.0252% | 0.0000% | 0.0266% | 0.0000% |
| 5    | >2B                     | 0.026%    | 0.000% | 0.0156% | 0.0000% | 0.0182%  | 0.0000% | 0.0208% | 0.0000% | 0.0221% | 0.0000% | 0.0234% | 0.0000% | 0.0247% | 0.0000% |
| 6    | >7B                     | 0.024%    | 0.000% | 0.0144% | 0.0000% | 0.0168%  | 0.0000% | 0.0192% | 0.0000% | 0.0204% | 0.0000% | 0.0216% | 0.0000% | 0.0228% | 0.0000% |

### Spot fee tiers

| Spot |                         | Base rate |        | Diamond |         | Platinum |         | Gold    |         | Silver  |         | Bronze  |         | Wood    |         |
| ---- | ----------------------- | --------- | ------ | ------- | ------- | -------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- | ------- |
| Tier | 14d weighted volume ($) | Taker     | Maker  | Taker   | Maker   | Taker    | Maker   | Taker   | Maker   | Taker   | Maker   | Taker   | Maker   | Taker   | Maker   |
| 0    |                         | 0.070%    | 0.040% | 0.0420% | 0.0240% | 0.0490%  | 0.0280% | 0.0560% | 0.0320% | 0.0595% | 0.0340% | 0.0630% | 0.0360% | 0.0665% | 0.0380% |
| 1    | >5M                     | 0.060%    | 0.030% | 0.0360% | 0.0180% | 0.0420%  | 0.0210% | 0.0480% | 0.0240% | 0.0510% | 0.0255% | 0.0540% | 0.0270% | 0.0570% | 0.0285% |
| 2    | >25M                    | 0.050%    | 0.020% | 0.0300% | 0.0120% | 0.0350%  | 0.0140% | 0.0400% | 0.0160% | 0.0425% | 0.0170% | 0.0450% | 0.0180% | 0.0475% | 0.0190% |
| 3    | >100M                   | 0.040%    | 0.010% | 0.0240% | 0.0060% | 0.0280%  | 0.0070% | 0.0320% | 0.0080% | 0.0340% | 0.0085% | 0.0360% | 0.0090% | 0.0380% | 0.0095% |
| 4    | >500M                   | 0.035%    | 0.000% | 0.0210% | 0.0000% | 0.0245%  | 0.0000% | 0.0280% | 0.0000% | 0.0298% | 0.0000% | 0.0315% | 0.0000% | 0.0333% | 0.0000% |
| 5    | >2B                     | 0.030%    | 0.000% | 0.0180% | 0.0000% | 0.0210%  | 0.0000% | 0.0240% | 0.0000% | 0.0255% | 0.0000% | 0.0270% | 0.0000% | 0.0285% | 0.0000% |
| 6    | >7B                     | 0.025%    | 0.000% | 0.0150% | 0.0000% | 0.0175%  | 0.0000% | 0.0200% | 0.0000% | 0.0213% | 0.0000% | 0.0225% | 0.0000% | 0.0238% | 0.0000% |

### Staking tiers

| Tier     | HYPE staked | Trading fee discount |
| -------- | ----------- | -------------------- |
| Wood     | >10         | 5%                   |
| Bronze   | >100        | 10%                  |
| Silver   | >1,000      | 15%                  |
| Gold     | >10,000     | 20%                  |
| Platinum | >100,000    | 30%                  |
| Diamond  | >500,000    | 40%                  |

### Maker rebates

| Tier | 14d weighted maker volume | Maker fee |
| ---- | ------------------------- | --------- |
| 1    | >0.5%                     | -0.001%   |
| 2    | >1.5%                     | -0.002%   |
| 3    | >3.0%                     | -0.003%   |

On most other protocols, the team or insiders are the main beneficiaries of fees. On Hyperliquid, fees are entirely directed to the community (HLP, the assistance fund, and spot deployers). Spot deployers may choose to keep up to 50% of trading fees generated by their token. For security, the assistance fund holds a majority of its assets in HYPE, which is the most liquid native asset on the Hyperliquid L1. The assistance fund uses the system address `0xfefefefefefefefefefefefefefefefefefefefe` which operates entirely onchain as part of the L1 execution. The assistance fund requires validator quorum to use in special situations.

### Staking linking

A "staking user" and a "trading user" can be linked so that the staking user's HYPE staked can be attributed to the trading user's fees. A few important points to note:

- The staking user will be able to unilaterally control the trading user. In particular, linking to a specific staking user essentially gives them full control of funds in the trading account.
- Linking is permanent. Unlinking is not supported.
- The staking user will not receive any staking-related fee discount after being linked.
- Linking requires the trading user to send an action first, and then the staking user to finalize the link. See "Link Staking" at app.hyperliquid.xyz/portfolio for details.&#x20;
- No action is required if you plan to trade and stake from the same address.&#x20;

### Fee formula for developers

```typescript
type Args =
  | {
      type: 'spot';
      isStablePair: boolean;
    }
  | {
      type: 'perp';
      deployerFeeScale: number;
      growthMode: boolean;
    };

function feeRates(
  fees: { makerRate: number; takerRate: number }, // fees from userFees info endpoint
  activeReferralDiscount: number, // number from userFees info endpoint
  isAlignedQuoteToken: boolean,
  args: Args,
) {
  const scaleIfStablePair = args.type === 'spot' && args.isStablePair ? 0.2 : 1;
  let scaleIfHip3 = 1;
  let growthModeScale = 1;
  let deployerShare = 0;
  if (args.type === 'perp') {
    scaleIfHip3 =
      args.deployerFeeScale < 1
        ? args.deployerFeeScale + 1
        : args.deployerFeeScale * 2;
    deployerShare =
      args.deployerFeeScale < 1
        ? args.deployerFeeScale / (1 + args.deployerFeeScale)
        : 0.5;
    growthModeScale = args.growthMode ? 0.1 : 1;
  }

  let makerPercentage =
    fees.makerRate * 100 * scaleIfStablePair * growthModeScale;
  if (makerPercentage > 0) {
    makerPercentage *= scaleIfHip3 * (1 - activeReferralDiscount);
  } else {
    const makerRebateScaleIfAlignedQuoteToken = isAlignedQuoteToken
      ? (1 - deployerShare) * 1.5 + deployerShare
      : 1;
    makerPercentage *= makerRebateScaleIfAlignedQuoteToken;
  }

  let takerPercentage =
    fees.takerRate *
    100 *
    scaleIfStablePair *
    scaleIfHip3 *
    growthModeScale *
    (1 - activeReferralDiscount);
  if (isAlignedQuoteToken) {
    const takerScaleIfAlignedQuoteToken = isAlignedQuoteToken
      ? (1 - deployerShare) * 0.8 + deployerShare
      : 1;
    takerPercentage *= takerScaleIfAlignedQuoteToken;
  }

  return { makerPercentage, takerPercentage };
}
```
