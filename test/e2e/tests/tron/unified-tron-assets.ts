import { merge } from 'lodash';
import { AccountGroupType, AccountWalletType } from '@metamask/account-api';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { TRON_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/tron-wallet-snap';
import {
  TRON_ACCOUNT_ADDRESS,
  TRON_CHAIN_ID,
  TRX_BALANCE,
  TRX_TO_USD_RATE,
} from './mocks/common-tron';

/** Deterministic Tron snap account id for the default E2E SRP (BIP44 /195). */
export const TRON_ACCOUNT_ID = 'c8f3a2e1-4d5b-6c7a-8e9f-0a1b2c3d4e5f';

const TRON_ENTROPY_SOURCE = '01KGPGYE2JJGMXDJPEVXKPJ1JG';
const TRON_DERIVATION_PATH = "m/44'/195'/0'/0/0";

const TRON_NATIVE_CAIP_ASSET_ID = `${TRON_CHAIN_ID}/slip44:195`;
const TRON_HTX_CAIP_ASSET_ID =
  'tron:728126428/trc20:TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6';
const TRON_USDT_CAIP_ASSET_ID =
  'tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const TRON_USDD_CAIP_ASSET_ID =
  'tron:728126428/trc20:TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz';

const TRON_ACCOUNT_METHODS = [
  'signTransaction',
  'signMessage',
  'getAccount',
  'getBalance',
] as const;

const TRON_ASSETS_INFO = {
  [TRON_NATIVE_CAIP_ASSET_ID]: {
    decimals: 6,
    image:
      'https://static.cx.metamask.io/api/v2/tokenIcons/assets/tron/728126428/slip44/195.png',
    name: 'Tron',
    symbol: 'TRX',
    type: 'native',
  },
  [TRON_HTX_CAIP_ASSET_ID]: {
    decimals: 18,
    name: 'HTX',
    symbol: 'HTX',
    type: 'erc20',
  },
  [TRON_USDT_CAIP_ASSET_ID]: {
    decimals: 6,
    name: 'Tether USD',
    symbol: 'USDT',
    type: 'erc20',
  },
  [TRON_USDD_CAIP_ASSET_ID]: {
    decimals: 18,
    name: 'Decentralized USD',
    symbol: 'USDD',
    type: 'erc20',
  },
};

const TRON_TRX_BALANCE_HUMAN = String(TRX_BALANCE / 1_000_000);

const TRON_NON_ZERO_ASSETS_BALANCE = {
  [TRON_NATIVE_CAIP_ASSET_ID]: {
    amount: TRON_TRX_BALANCE_HUMAN,
  },
  [TRON_HTX_CAIP_ASSET_ID]: {
    amount: '3156454.956836360132407885',
  },
  [TRON_USDT_CAIP_ASSET_ID]: {
    amount: '2.804595',
  },
  [TRON_USDD_CAIP_ASSET_ID]: {
    amount: '0.289757448699320931',
  },
};

const TRON_ZERO_ASSETS_BALANCE = {
  [TRON_NATIVE_CAIP_ASSET_ID]: {
    amount: '0',
  },
};

const tronSnapState = JSON.stringify({
  keyringAccounts: {
    [TRON_ACCOUNT_ID]: {
      id: TRON_ACCOUNT_ID,
      entropySource: TRON_ENTROPY_SOURCE,
      derivationPath: TRON_DERIVATION_PATH,
      type: 'tron:eoa',
      address: TRON_ACCOUNT_ADDRESS,
      scopes: [TRON_CHAIN_ID],
      options: {
        entropy: {
          derivationPath: TRON_DERIVATION_PATH,
          groupIndex: 0,
          id: TRON_ENTROPY_SOURCE,
          type: 'mnemonic',
        },
        entropySource: TRON_ENTROPY_SOURCE,
        exportable: false,
      },
      methods: [...TRON_ACCOUNT_METHODS],
    },
  },
  mapInterfaceNameToId: {},
  transactions: {},
  signatures: {},
  assetEntities: {},
  tokenPrices: {},
  subscriptions: {},
  webSocketConnections: {
    closeWebSocketConnectionsBackgroundEventId: null,
  },
});

const DEFAULT_ACCOUNT_GROUP_ID = 'entropy:01KMMTZZ3ZEF3008S2RXXR2CXS/0';
const DEFAULT_ENTROPY_WALLET_ID = 'entropy:01KMMTZZ3ZEF3008S2RXXR2CXS';
const DEFAULT_EVM_ACCOUNT_ID = 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4';
const DEFAULT_SOLANA_ACCOUNT_ID = '688e01b8-3134-4ef4-80e6-8772bab38ef7';

const TRON_MULTICHAIN_ASSETS_PATCH = {
  MultichainAssetsController: {
    accountsAssets: {
      [TRON_ACCOUNT_ID]: Object.keys(TRON_NON_ZERO_ASSETS_BALANCE),
    },
  },
  MultichainRatesController: {
    conversionRates: {
      [TRON_NATIVE_CAIP_ASSET_ID]: {
        conversionTime: 0,
        rate: String(TRX_TO_USD_RATE),
      },
      [TRON_HTX_CAIP_ASSET_ID]: {
        conversionTime: 0,
        rate: '0.00000168',
      },
      [TRON_USDT_CAIP_ASSET_ID]: {
        conversionTime: 0,
        rate: '0.999176',
      },
      [TRON_USDD_CAIP_ASSET_ID]: {
        conversionTime: 0,
        rate: '0.999959',
      },
    },
  },
};

const TRON_ASSETS_CONTROLLER_FIXTURE = {
  assetsInfo: TRON_ASSETS_INFO,
  assetsPrice: {
    [TRON_NATIVE_CAIP_ASSET_ID]: {
      assetPriceType: 'fungible' as const,
      id: 'tron',
      lastUpdated: 0,
      price: TRX_TO_USD_RATE,
      usdPrice: TRX_TO_USD_RATE,
    },
    [TRON_HTX_CAIP_ASSET_ID]: {
      assetPriceType: 'fungible' as const,
      id: 'htx-dao',
      lastUpdated: 0,
      price: 0.00000168,
      usdPrice: 0.00000168,
    },
    [TRON_USDT_CAIP_ASSET_ID]: {
      assetPriceType: 'fungible' as const,
      id: 'tether',
      lastUpdated: 0,
      price: 0.999176,
      usdPrice: 0.999176,
    },
    [TRON_USDD_CAIP_ASSET_ID]: {
      assetPriceType: 'fungible' as const,
      id: 'usdd',
      lastUpdated: 0,
      price: 0.999959,
      usdPrice: 0.999959,
    },
  },
};

type BuildTronFixturesOptions = {
  showNativeTokenAsMainBalanceDisabled?: boolean;
  zeroBalance?: boolean;
};

function buildTronAssetsControllerFixture(zeroBalance = false) {
  return {
    ...TRON_ASSETS_CONTROLLER_FIXTURE,
    assetsBalance: {
      [TRON_ACCOUNT_ID]: zeroBalance
        ? TRON_ZERO_ASSETS_BALANCE
        : TRON_NON_ZERO_ASSETS_BALANCE,
    },
  };
}

/**
 * Unified-assets fixture for Tron snap flows. Keeps the default EVM account
 * selected so `login()` still validates localhost 25 ETH before switching networks.
 *
 * @param configure
 * @param options
 * @param options.showNativeTokenAsMainBalanceDisabled
 * @param options.zeroBalance
 */
export function buildTronFixtures(
  configure?: (builder: FixtureBuilderV2) => FixtureBuilderV2,
  {
    showNativeTokenAsMainBalanceDisabled = false,
    zeroBalance = false,
  }: BuildTronFixturesOptions = {},
) {
  let builder = new FixtureBuilderV2()
    .withEnabledNetworks({
      eip155: {
        '0x539': true,
      },
      tron: {
        [TRON_CHAIN_ID]: true,
      },
    })
    .withAccountTreeController({
      selectedAccountGroup: DEFAULT_ACCOUNT_GROUP_ID,
      accountTree: {
        wallets: {
          [DEFAULT_ENTROPY_WALLET_ID]: {
            id: DEFAULT_ENTROPY_WALLET_ID,
            type: AccountWalletType.Entropy,
            status: 'ready',
            groups: {
              [DEFAULT_ACCOUNT_GROUP_ID]: {
                id: DEFAULT_ACCOUNT_GROUP_ID,
                type: AccountGroupType.MultichainAccount,
                accounts: [
                  DEFAULT_EVM_ACCOUNT_ID,
                  DEFAULT_SOLANA_ACCOUNT_ID,
                  TRON_ACCOUNT_ID,
                ],
                metadata: {
                  name: 'Account 1',
                  entropy: { groupIndex: 0 },
                  hidden: false,
                  pinned: false,
                  lastSelected: 1665507600000,
                },
              },
            },
            metadata: {
              name: 'SRP 1',
              entropy: { id: TRON_ENTROPY_SOURCE },
            },
          },
        },
      },
    })
    .withAccountsController({
      internalAccounts: {
        selectedAccount: DEFAULT_EVM_ACCOUNT_ID,
        accounts: {
          [TRON_ACCOUNT_ID]: {
            address: TRON_ACCOUNT_ADDRESS,
            id: TRON_ACCOUNT_ID,
            metadata: {
              importTime: 0,
              keyring: {
                type: 'Snap Keyring',
              },
              lastSelected: 0,
              name: '',
              snap: {
                id: TRON_WALLET_SNAP_ID,
              },
            },
            methods: [...TRON_ACCOUNT_METHODS],
            options: {
              entropy: {
                derivationPath: TRON_DERIVATION_PATH,
                groupIndex: 0,
                id: TRON_ENTROPY_SOURCE,
                type: 'mnemonic',
              },
              entropySource: TRON_ENTROPY_SOURCE,
              exportable: false,
            },
            scopes: [TRON_CHAIN_ID],
            type: 'tron:eoa',
          },
        },
      },
    })
    .withSnapController({
      unencryptedSnapStates: {
        [TRON_WALLET_SNAP_ID]: tronSnapState,
      },
    })
    .withAssetsController(buildTronAssetsControllerFixture(zeroBalance));

  if (showNativeTokenAsMainBalanceDisabled) {
    builder = builder.withShowNativeTokenAsMainBalanceDisabled();
  }

  if (configure) {
    builder = configure(builder);
  }

  const fixture = builder.build();
  const multichainPatch = zeroBalance
    ? {
        MultichainAssetsController: {
          accountsAssets: {
            [TRON_ACCOUNT_ID]: [TRON_NATIVE_CAIP_ASSET_ID],
          },
        },
        MultichainRatesController: {
          conversionRates: {
            [TRON_NATIVE_CAIP_ASSET_ID]: {
              conversionTime: 0,
              rate: String(TRX_TO_USD_RATE),
            },
          },
        },
      }
    : TRON_MULTICHAIN_ASSETS_PATCH;
  merge(fixture.data, multichainPatch);
  return fixture;
}
