import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  DEFAULT_BTC_ADDRESS,
  DEFAULT_BTC_BALANCE,
  DEFAULT_BTC_CONVERSION_RATE,
} from '../../constants';

export const BTC_CHAIN_CAIP_ID = 'bip122:000000000019d6689c085ae165831e93';
export const BTC_CAIP_ASSET_ID = `${BTC_CHAIN_CAIP_ID}/slip44:0`;

/** Deterministic account id for the default E2E SRP Bitcoin account (BIP84). */
export const BTC_ACCOUNT_ID = '9f5d2e59-bf02-4366-b7d8-bff76ee991be';

const BTC_ENTROPY_SOURCE = '01KGPGYE2JJGMXDJPEVXKPJ1JG';
const BTC_DERIVATION_PATH = "m/84'/0'/0'";
const BITCOIN_SNAP_ID = 'npm:@metamask/bitcoin-wallet-snap';

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

const bitcoinSnapState = JSON.stringify({
  keyringAccounts: {
    [BTC_ACCOUNT_ID]: {
      id: BTC_ACCOUNT_ID,
      entropySource: BTC_ENTROPY_SOURCE,
      derivationPath: BTC_DERIVATION_PATH,
      type: 'bip122:p2wpkh',
      address: DEFAULT_BTC_ADDRESS,
      scopes: [BTC_CHAIN_CAIP_ID],
      options: {
        entropy: {
          derivationPath: BTC_DERIVATION_PATH,
          groupIndex: 0,
          id: BTC_ENTROPY_SOURCE,
          type: 'mnemonic',
        },
        entropySource: BTC_ENTROPY_SOURCE,
        exportable: false,
      },
      methods: BTC_ACCOUNT_METHODS,
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

/**
 * Pre-seeds unified AssetsController state plus the default E2E Bitcoin account
 * so non-EVM balance selectors can render BTC without waiting on Snap fetches.
 */
export const BTC_ASSETS_CONTROLLER_FIXTURE = {
  assetsBalance: {
    [BTC_ACCOUNT_ID]: {
      [BTC_CAIP_ASSET_ID]: {
        amount: String(DEFAULT_BTC_BALANCE),
      },
    },
  },
  assetsInfo: {
    [BTC_CAIP_ASSET_ID]: {
      decimals: 8,
      image:
        'https://static.cx.metamask.io/api/v1/tokenIcons/bip122/000000000019d6689c085ae165831e93/slip44/0.png',
      name: 'Bitcoin',
      symbol: 'BTC',
      type: 'native' as const,
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

const DEFAULT_ACCOUNT_GROUP_ID = 'entropy:01KMMTZZ3ZEF3008S2RXXR2CXS/0';
const DEFAULT_ENTROPY_WALLET_ID = 'entropy:01KMMTZZ3ZEF3008S2RXXR2CXS';
const DEFAULT_EVM_ACCOUNT_ID = 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4';
const DEFAULT_SOLANA_ACCOUNT_ID = '688e01b8-3134-4ef4-80e6-8772bab38ef7';

export function buildBtcUnifiedAssetsFixtures() {
  return new FixtureBuilderV2()
    .withEnabledNetworks({
      eip155: {
        '0x539': true,
      },
      bip122: {
        [MultichainNetworks.BITCOIN]: true,
      },
    })
    .withAccountTreeController({
      selectedAccountGroup: DEFAULT_ACCOUNT_GROUP_ID,
      accountTree: {
        wallets: {
          [DEFAULT_ENTROPY_WALLET_ID]: {
            id: DEFAULT_ENTROPY_WALLET_ID,
            type: 'entropy',
            status: 'ready',
            groups: {
              [DEFAULT_ACCOUNT_GROUP_ID]: {
                id: DEFAULT_ACCOUNT_GROUP_ID,
                type: 'multichain-account',
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
                enabled: true,
                id: BITCOIN_SNAP_ID,
                name: 'Bitcoin',
              },
            },
            methods: [...BTC_ACCOUNT_METHODS],
            options: {
              entropy: {
                derivationPath: BTC_DERIVATION_PATH,
                groupIndex: 0,
                id: BTC_ENTROPY_SOURCE,
                type: 'mnemonic',
              },
              entropySource: BTC_ENTROPY_SOURCE,
              exportable: false,
            },
            scopes: [BTC_CHAIN_CAIP_ID],
            type: 'bip122:p2wpkh',
          },
        },
      },
    })
    .withSnapController({
      unencryptedSnapStates: {
        [BITCOIN_SNAP_ID]: bitcoinSnapState,
      },
    })
    .withAssetsController(BTC_ASSETS_CONTROLLER_FIXTURE)
    .build();
}
