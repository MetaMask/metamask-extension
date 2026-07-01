import { merge } from 'lodash';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_CONVERSION_RATE,
} from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { CHAIN_IDS } from '../../../../shared/constants/network';

export const BTC_CHAIN_CAIP_ID = 'bip122:000000000019d6689c085ae165831e93';
export const BTC_CAIP_ASSET_ID = `${BTC_CHAIN_CAIP_ID}/slip44:0`;

/** Matches default-fixture entropy for Account 1 (same group as EVM + Solana). */
const DEFAULT_FIXTURE_ENTROPY_ID = '01KGPGYE2JJGMXDJPEVXKPJ1JG';

/**
 * Stable internal account id for the pre-seeded Bitcoin account (same pattern as
 * Solana swap E2E using `688e01b8-…`).
 */
export const BTC_FIXTURE_ACCOUNT_ID = 'b8c3e4f5-6a7d-4e8f-9a0b-1c2d3e4f5a6b7';

const BTC_FIXTURE_ACCOUNT = {
  id: BTC_FIXTURE_ACCOUNT_ID,
  address: DEFAULT_BTC_ADDRESS,
  type: 'bip122:p2wpkh',
  scopes: [BTC_CHAIN_CAIP_ID],
  methods: [
    'signPsbt',
    'computeFee',
    'fillPsbt',
    'broadcastPsbt',
    'sendTransfer',
    'getUtxo',
    'listUtxos',
    'publicDescriptor',
    'signMessage',
  ],
  options: {
    derivationPath: "m/84'/0'/0'/0/0",
    entropySource: DEFAULT_FIXTURE_ENTROPY_ID,
    index: 0,
    entropy: {
      type: 'mnemonic',
      id: DEFAULT_FIXTURE_ENTROPY_ID,
      derivationPath: "m/84'/0'/0'/0/0",
      groupIndex: 0,
    },
  },
  metadata: {
    name: '',
    importTime: 1770282512702,
    lastSelected: 0,
    keyring: {
      type: 'Snap Keyring',
    },
    snap: {
      enabled: true,
      id: 'npm:@metamask/bitcoin-wallet-snap',
      name: 'Bitcoin',
    },
  },
};

/**
 * Pre-seeds unified-assets balance for the Bitcoin account. With `assetsUnifyState`
 * enabled the token list reads `AssetsController.assetsBalance`, not esplora/snap
 * balances (esplora still runs for send/bridge, but the homepage list ignores it).
 */
export const BTC_UNIFIED_ASSETS_CONTROLLER_FIXTURE = {
  customAssets: {
    [BTC_FIXTURE_ACCOUNT_ID]: [BTC_CAIP_ASSET_ID],
  },
  assetsBalance: {
    [BTC_FIXTURE_ACCOUNT_ID]: {
      [BTC_CAIP_ASSET_ID]: { amount: String(DEFAULT_BTC_BALANCE) },
    },
  },
  assetsInfo: {
    [BTC_CAIP_ASSET_ID]: {
      decimals: 8,
      image:
        'https://static.cx.metamask.io/api/v1/tokenIcons/bip122/000000000019d6689c085ae165831e93/slip44/0.png',
      name: 'Bitcoin',
      symbol: 'BTC',
      type: 'native',
    },
  },
  assetsPrice: {
    [BTC_CAIP_ASSET_ID]: {
      assetPriceType: 'fungible' as const,
      id: 'bitcoin',
      lastUpdated: 0,
      price: DEFAULT_BTC_CONVERSION_RATE,
      usdPrice: DEFAULT_BTC_CONVERSION_RATE,
    },
  },
};

/**
 * Builds fixtures for BTC E2E tests under unified assets (`assetsUnifyState`).
 */
export function buildBtcUnifiedAssetsFixtures() {
  const fixture = new FixtureBuilderV2()
    .withEnabledNetworks({
      eip155: {
        [CHAIN_IDS.MAINNET]: true,
      },
      bip122: {
        [BTC_CHAIN_CAIP_ID]: true,
      },
    })
    .withAccountsController({
      internalAccounts: {
        accounts: {
          [BTC_FIXTURE_ACCOUNT_ID]: BTC_FIXTURE_ACCOUNT,
        },
      },
    })
    .withAssetsController(BTC_UNIFIED_ASSETS_CONTROLLER_FIXTURE)
    .build();

  merge(fixture.data, {
    ProfileMetricsController: {
      syncQueue: {
        [DEFAULT_FIXTURE_ENTROPY_ID]: [
          {
            address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            scopes: ['eip155:0'],
          },
          {
            address: '4tE76eixEgyJDrdykdWJR1XBkzUk4cLMvqjR2xVJUxer',
            scopes: [
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
              'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
              'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
            ],
          },
          {
            address: DEFAULT_BTC_ADDRESS,
            scopes: [BTC_CHAIN_CAIP_ID],
          },
        ],
      },
    },
  });

  return fixture;
}
