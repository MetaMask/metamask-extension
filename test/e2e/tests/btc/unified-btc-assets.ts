import { merge } from 'lodash';
import { AccountGroupType, AccountWalletType } from '@metamask/account-api';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_CONVERSION_RATE,
} from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { BITCOIN_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/bitcoin-wallet-snap';
import { BTC_CHAIN_ID } from './mocks/bridge';

/** Deterministic Bitcoin snap account id for the default E2E SRP (BIP84 /0). */
export const BTC_ACCOUNT_ID = '75ad4470-156b-4f7f-b0a5-ffe6cd114ac9';

const BTC_ENTROPY_SOURCE = '01KGPGYE2JJGMXDJPEVXKPJ1JG';
const BTC_DERIVATION_PATH = "m/84'/0'/0'/0/0";

const BTC_NATIVE_CAIP_ASSET_ID = `${BTC_CHAIN_ID}/slip44:0`;

const BTC_ACCOUNT_METHODS = [
  'signPsbt',
  'computeFee',
  'fillPsbt',
  'broadcastPsbt',
  'sendTransfer',
  'getUtxo',
  'listUtxos',
  'publicDescriptor',
  'signMessage',
] as const;

const BTC_SCOPES = [
  BTC_CHAIN_ID,
  'bip122:000000000933ea01ad0ee984209779ba',
  'bip122:00000000da84f2bafbbc53dee25a72ae',
  'bip122:00000008819873e925422c1ff0f99f7c',
  'bip122:regtest',
] as const;

const BTC_ASSETS_CONTROLLER_FIXTURE = {
  assetsBalance: {
    [BTC_ACCOUNT_ID]: {
      [BTC_NATIVE_CAIP_ASSET_ID]: {
        amount: String(DEFAULT_BTC_BALANCE),
      },
    },
  },
  assetsInfo: {
    [BTC_NATIVE_CAIP_ASSET_ID]: {
      decimals: 8,
      image:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/bip122/000000000019d6689c085ae165831e93/slip44/0.png',
      name: 'Bitcoin',
      symbol: 'BTC',
      type: 'native',
    },
  },
  assetsPrice: {
    [BTC_NATIVE_CAIP_ASSET_ID]: {
      assetPriceType: 'fungible' as const,
      id: 'bitcoin',
      lastUpdated: 0,
      price: DEFAULT_BTC_CONVERSION_RATE,
      usdPrice: DEFAULT_BTC_CONVERSION_RATE,
    },
  },
};

const BTC_MULTICHAIN_ASSETS_PATCH = {
  MultichainAssetsController: {
    accountsAssets: {
      [BTC_ACCOUNT_ID]: [BTC_NATIVE_CAIP_ASSET_ID],
    },
  },
  MultichainRatesController: {
    conversionRates: {
      [BTC_NATIVE_CAIP_ASSET_ID]: {
        conversionTime: 0,
        rate: String(DEFAULT_BTC_CONVERSION_RATE),
      },
    },
  },
};

const bitcoinSnapState = JSON.stringify({
  keyringAccounts: {
    [BTC_ACCOUNT_ID]: {
      id: BTC_ACCOUNT_ID,
      entropySource: BTC_ENTROPY_SOURCE,
      derivationPath: BTC_DERIVATION_PATH,
      index: 0,
      type: 'bip122:p2wpkh',
      address: DEFAULT_BTC_ADDRESS,
      scopes: [...BTC_SCOPES],
      options: {
        entropySource: BTC_ENTROPY_SOURCE,
        derivationPath: BTC_DERIVATION_PATH,
        index: 0,
        exportable: false,
      },
      methods: [...BTC_ACCOUNT_METHODS],
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

/**
 * Unified-assets fixture for Bitcoin snap flows. Keeps the default EVM account
 * selected so `login()` still validates localhost 25 ETH before switching networks.
 *
 * @param configure - Optional callback to further customize the fixture builder.
 */
export function buildBtcSwapFixtures(
  configure?: (builder: FixtureBuilderV2) => FixtureBuilderV2,
) {
  let builder = new FixtureBuilderV2()
    .withEnabledNetworks({
      eip155: {
        '0x539': true,
      },
      bip122: {
        [BTC_CHAIN_ID]: true,
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
                  BTC_ACCOUNT_ID,
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
              entropy: { id: BTC_ENTROPY_SOURCE },
            },
          },
        },
      },
    })
    .withAccountsController({
      internalAccounts: {
        selectedAccount: DEFAULT_EVM_ACCOUNT_ID,
        accounts: {
          [BTC_ACCOUNT_ID]: {
            address: DEFAULT_BTC_ADDRESS,
            id: BTC_ACCOUNT_ID,
            metadata: {
              importTime: 0,
              keyring: {
                type: 'Snap Keyring',
              },
              lastSelected: 0,
              name: '',
              snap: {
                id: BITCOIN_WALLET_SNAP_ID,
              },
            },
            methods: [...BTC_ACCOUNT_METHODS],
            options: {
              derivationPath: BTC_DERIVATION_PATH,
              synchronize: true,
              index: 0,
              exportable: false,
              entropy: {
                derivationPath: BTC_DERIVATION_PATH,
                groupIndex: 0,
                id: BTC_ENTROPY_SOURCE,
                type: 'mnemonic',
              },
              entropySource: BTC_ENTROPY_SOURCE,
            },
            scopes: [...BTC_SCOPES],
            type: 'bip122:p2wpkh',
          },
        },
      },
    })
    .withSnapController({
      unencryptedSnapStates: {
        [BITCOIN_WALLET_SNAP_ID]: bitcoinSnapState,
      },
    })
    .withAssetsController(BTC_ASSETS_CONTROLLER_FIXTURE);

  if (configure) {
    builder = configure(builder);
  }

  const fixture = builder.build();
  merge(fixture.data, BTC_MULTICHAIN_ASSETS_PATCH);
  return fixture;
}
