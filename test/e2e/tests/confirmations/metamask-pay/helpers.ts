import type { Hex, Json } from '@metamask/utils';
import type { Mockttp } from 'mockttp';
import { keccak256, pad, toHex } from 'viem';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  ACCOUNT_2,
  DEFAULT_FIXTURE_ACCOUNT_ID,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  NETWORK_CLIENT_ID,
} from '../../../constants';
import type { Anvil } from '../../../seeder/anvil';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { mockMoneyAccountDeposit } from '../mocks/metamask-pay';
import {
  ACCOUNT_2_FIXTURE_ID,
  ANVIL_USDC_BALANCES_SLOT,
  DEFAULT_FIXTURE_ETH_NATIVE_ASSET_IDS,
  ETH_BALANCE_HUMAN,
  ETH_USD_PRICE,
  MAINNET_NATIVE_ASSET_ID,
  MAINNET_USDC_ADDRESS,
  MAINNET_USDC_ASSET_ID,
  MAINNET_USDC_ASSET_ID_LOWERCASE,
  MON_USD_PRICE,
  MONAD_NATIVE_ASSET_ID,
  MONEY_ACCOUNT_DEPOSIT_REMOTE_FLAGS,
  MUSD_MONAD_ASSET_ID,
  MUSD_USD_PRICE,
  USDC_BALANCE_HUMAN,
  USDC_BALANCE_RAW,
} from './constants';

/**
 * Fungible price entry whose `assetPriceType` stays a literal.
 * `Object.fromEntries` otherwise widens it to `string`, which is not an
 * `AssetPrice` under assets-controller 17.
 *
 * @param id - CoinGecko id stored on the price entry.
 * @param usdPrice - USD price seeded for the asset.
 */
function fungibleAssetPrice(id: string, usdPrice: number) {
  return {
    assetPriceType: 'fungible' as const,
    id,
    lastUpdated: 0,
    price: usdPrice,
    usdPrice,
  };
}

const DEFAULT_FIXTURE_ETH_NATIVE_PRICES = Object.fromEntries(
  DEFAULT_FIXTURE_ETH_NATIVE_ASSET_IDS.map((assetId) => [
    assetId,
    fungibleAssetPrice('ethereum', ETH_USD_PRICE),
  ]),
) as {
  [AssetId in (typeof DEFAULT_FIXTURE_ETH_NATIVE_ASSET_IDS)[number]]: ReturnType<
    typeof fungibleAssetPrice
  >;
};

function buildAssetsBalance(accountIds: string[]) {
  return Object.fromEntries(
    accountIds.map((accountId) => [
      accountId,
      {
        [MAINNET_NATIVE_ASSET_ID]: { amount: String(ETH_BALANCE_HUMAN) },
        [MAINNET_USDC_ASSET_ID]: { amount: USDC_BALANCE_RAW.toString(10) },
      },
    ]),
  );
}

/**
 * Builds the Money Account deposit fixture: Mainnet selected against the
 * local Anvil node (chain 1) with USDC + ETH held by the given accounts, the
 * Money Account flags seeded, and USDC/ETH metadata + rates pre-populated so
 * the pay-token picker does not depend on async token discovery.
 *
 * @param options - Fixture options.
 * @param options.withAccount2 - Also restore the second HD account so the
 * deposit can be funded from another account.
 * @param options.remoteFlagOverrides - Extra remote flags seeded into
 * `RemoteFeatureFlagController` state (must also be served by the HTTP mock).
 * @returns The built fixture state.
 */
export function buildMoneyAccountDepositFixture({
  withAccount2 = false,
  remoteFlagOverrides = {},
}: {
  withAccount2?: boolean;
  remoteFlagOverrides?: Record<string, Json>;
} = {}) {
  const accountAddresses = [
    DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
    ...(withAccount2 ? [ACCOUNT_2.toLowerCase()] : []),
  ];
  const accountIds = [
    DEFAULT_FIXTURE_ACCOUNT_ID,
    ...(withAccount2 ? [ACCOUNT_2_FIXTURE_ID] : []),
  ];
  const usdcToken = {
    address: MAINNET_USDC_ADDRESS,
    symbol: 'USDC',
    decimals: 6,
    isERC721: false,
    aggregators: [],
    name: 'USD Coin',
  };

  let builder = new FixtureBuilderV2();
  if (withAccount2) {
    builder = builder
      .withKeyringControllerAdditionalAccountVault()
      .withAccountsControllerAdditionalAccountVault();
  }

  return builder
    .withRemoteFeatureFlagController({
      remoteFeatureFlags: {
        ...MONEY_ACCOUNT_DEPOSIT_REMOTE_FLAGS,
        ...remoteFlagOverrides,
      },
    })
    .withSelectedNetwork(NETWORK_CLIENT_ID.MAINNET)
    .withEnabledNetworks({ eip155: { [CHAIN_IDS.MAINNET]: true } })
    .withTokensController({
      allTokens: {
        [CHAIN_IDS.MAINNET]: Object.fromEntries(
          accountAddresses.map((address) => [address, [usdcToken]]),
        ),
      },
    })
    .withCurrencyController({
      currencyRates: {
        ETH: {
          conversionDate: 0,
          conversionRate: ETH_USD_PRICE,
          usdConversionRate: ETH_USD_PRICE,
        },
      },
    })
    .withAssetsController({
      customAssets: Object.fromEntries(
        accountIds.map((accountId) => [accountId, [MAINNET_USDC_ASSET_ID]]),
      ),
      assetsBalance: buildAssetsBalance(accountIds),
      assetsInfo: {
        [MAINNET_NATIVE_ASSET_ID]: {
          type: 'native',
          symbol: 'ETH',
          name: 'Ether',
          decimals: 18,
        },
        [MAINNET_USDC_ASSET_ID]: {
          type: 'erc20',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
        // Pay resolves the deposit's required token (mUSD on Monad) from
        // AssetsController state: it needs the token metadata plus a fiat
        // rate for both mUSD and the chain's native asset, otherwise the
        // amount screen never leaves its skeleton.
        [MONAD_NATIVE_ASSET_ID]: {
          type: 'native',
          symbol: 'MON',
          name: 'Monad',
          decimals: 18,
        },
        [MUSD_MONAD_ASSET_ID]: {
          type: 'erc20',
          symbol: 'mUSD',
          name: 'MetaMask USD',
          decimals: 6,
        },
      },
      assetsPrice: {
        // Pay's `currencyRates` are keyed by ticker, so every chain whose
        // native asset is "ETH" in the default fixture must agree on the ETH
        // price or the USDC → USD conversion mixes rates from two chains.
        ...DEFAULT_FIXTURE_ETH_NATIVE_PRICES,
        [MONAD_NATIVE_ASSET_ID]: fungibleAssetPrice('monad', MON_USD_PRICE),
        [MUSD_MONAD_ASSET_ID]: fungibleAssetPrice(
          'metamask-usd',
          MUSD_USD_PRICE,
        ),
        [MAINNET_NATIVE_ASSET_ID]: fungibleAssetPrice(
          'ethereum',
          ETH_USD_PRICE,
        ),
        [MAINNET_USDC_ASSET_ID]: fungibleAssetPrice('usd-coin', USDC_USD_PRICE),
      },
    })
    .build();
}

/**
 * Seeds `amountHuman` USDC for `address` on the local Anvil node by writing the
 * ERC-20 balance slot directly, matching how `with100Usdc100Usdt.json` funds
 * the default account.
 *
 * @param localNode - The running Anvil node (chain 1).
 * @param address - Account to fund.
 * @param amountHuman - USDC amount in whole tokens.
 */
export async function seedAnvilUsdcBalance(
  localNode: Anvil,
  address: Hex,
  amountHuman: number,
): Promise<void> {
  const { testClient } = localNode.getProvider();
  const slotKey = keccak256(
    `0x${pad(address, { size: 32 }).slice(2)}${pad(
      toHex(ANVIL_USDC_BALANCES_SLOT),
      { size: 32 },
    ).slice(2)}`,
  );
  await testClient.setStorageAt({
    address: MAINNET_USDC_ADDRESS,
    index: slotKey,
    value: pad(toHex(BigInt(amountHuman) * 10n ** 6n), { size: 32 }),
  });
}

/**
 * `withFixtures` options shared by the Money Account deposit specs.
 *
 * @param options - Config options.
 * @param options.title - Test title for debugging.
 * @param options.withAccount2 - Restore the second HD account and fund it with
 * USDC on Anvil.
 * @param options.remoteFlagOverrides - Extra remote flags applied to both the
 * seeded controller state and the `/v1/flags` mock.
 * @returns Partial `withFixtures` config.
 */
export function getMoneyAccountDepositConfig({
  title,
  withAccount2 = false,
  remoteFlagOverrides = {},
}: {
  title?: string;
  withAccount2?: boolean;
  remoteFlagOverrides?: Record<string, Json>;
}) {
  return {
    fixtures: buildMoneyAccountDepositFixture({
      withAccount2,
      remoteFlagOverrides,
    }),
    title,
    localNodeOptions: [
      {
        type: 'anvil',
        options: {
          chainId: 1,
          loadState: './test/e2e/seeder/network-states/with100Usdc100Usdt.json',
        },
      },
    ],
    ethConversionInUsd: ETH_USD_PRICE,
    // The Money Account upgrade pipeline (CHOMP association, delegations,
    // intents) runs in the background and is not mocked here; its retries log
    // step errors that are unrelated to the deposit under test.
    ignoredConsoleErrors: ['MoneyAccountUpgradeStepError'],
    unifiedEvmAccountsApiBalances: {
      mainnetAdditionalBalances: [
        {
          assetId: MAINNET_USDC_ASSET_ID_LOWERCASE,
          balance: USDC_BALANCE_RAW.toString(10),
        },
      ],
    },
    afterLocalNodesStart: async ({ localNodes }: { localNodes: Anvil[] }) => {
      if (withAccount2) {
        await seedAnvilUsdcBalance(
          localNodes[0],
          ACCOUNT_2 as Hex,
          USDC_BALANCE_HUMAN,
        );
      }
    },
    testSpecificMock: (server: Mockttp) =>
      mockMoneyAccountDeposit(server, { remoteFlagOverrides }),
  };
}
