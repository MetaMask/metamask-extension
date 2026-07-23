import { StatusTypes } from '@metamask/bridge-controller';
import type { Transaction } from '@metamask/keyring-api';
import { TransactionStatus, TransactionType } from '@metamask/keyring-api';
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import { MultichainNetworks } from '../../shared/constants/multichain/networks';
import type { MetaMaskReduxState } from '../store/store';
import { generateTokenCacheKey } from '../helpers/utils/token-scan';
import mockState from '../../test/data/mock-state.json';
import { MOCK_ACCOUNT_SOLANA_MAINNET } from '../../test/data/mock-accounts';
import type { MultichainAccountsState } from './multichain-accounts/account-tree.types';
import {
  selectNonEvmActivityItems,
  selectNonEvmTransactionsForActivity,
  selectEvmAddress,
} from './activity';

const typedMockState = mockState as unknown as MultichainAccountsState;

type NonEvmTransactionsMap =
  MultichainTransactionsControllerState['nonEvmTransactions'];

function buildState(
  nonEvmTransactions: NonEvmTransactionsMap,
  tokenScanCache?: Record<
    string,
    {
      data?: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_type?: string;
      };
    }
  >,
): MetaMaskReduxState {
  const baseState = structuredClone(mockState);

  return {
    ...baseState,
    metamask: {
      ...baseState.metamask,
      nonEvmTransactions,
      enabledNetworkMap: {
        solana: { [MultichainNetworks.SOLANA]: true },
      },
      tokenScanCache: tokenScanCache ?? {},
    },
  } as unknown as MetaMaskReduxState;
}

describe('selectNonEvmTransactionsForActivity', () => {
  it('filters malicious non-EVM token transactions', () => {
    const maliciousTx = {
      id: 'bad-tx',
      chain: MultichainNetworks.SOLANA,
      from: [
        {
          asset: {
            fungible: true,
            type: `${MultichainNetworks.SOLANA}/token:BadMint111`,
          },
        },
      ],
      to: [],
    } as unknown as Transaction;
    const benignTx = {
      id: 'good-tx',
      chain: MultichainNetworks.SOLANA,
      from: [
        {
          asset: {
            fungible: true,
            type: `${MultichainNetworks.SOLANA}/token:GoodMint222`,
          },
        },
      ],
      to: [],
    } as unknown as Transaction;

    const state = buildState(
      {
        [mockState.metamask.internalAccounts.selectedAccount]: {
          [MultichainNetworks.SOLANA]: {
            transactions: [maliciousTx, benignTx],
            next: null,
            lastUpdated: 0,
          },
        },
      },
      {
        [generateTokenCacheKey(MultichainNetworks.SOLANA, 'BadMint111')]: {
          data: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: 'Malicious',
          },
        },
      },
    ) as unknown as MetaMaskReduxState & MultichainAccountsState;

    expect(selectNonEvmTransactionsForActivity(state)).toEqual([benignTx]);
  });
});

describe('selectNonEvmActivityItems', () => {
  const solanaAddress = '8FnX3xo2yYw3EUE6w3nQA4GfXGS9wpK6oj3veJpbFzLo';
  const solanaTxId =
    '3r2jec1giywQcMg1rLx48QPF2JDkr7i916j2eTcBEGoHmf7jhYugBRRkWTe5gBKJ4yMHHqZSLA6DSMv7uDGv7ra9';

  const solanaSendTransaction = {
    id: solanaTxId,
    chain: MultichainNetworks.SOLANA,
    account: MOCK_ACCOUNT_SOLANA_MAINNET.id,
    status: TransactionStatus.Confirmed,
    timestamp: 1784777693,
    type: TransactionType.Send,
    from: [
      {
        address: solanaAddress,
        asset: {
          fungible: true,
          type: `${MultichainNetworks.SOLANA}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`,
          unit: 'USDC',
          amount: '0.038467',
        },
      },
    ],
    to: [{ address: 'to-address', asset: null }],
    fees: [],
    events: [],
  } as unknown as Transaction;

  it('reclassifies cross-chain non-EVM sends matched in bridge history as bridges', () => {
    const state = structuredClone(
      typedMockState,
    ) as unknown as MetaMaskReduxState & MultichainAccountsState;

    state.metamask.internalAccounts.selectedAccount =
      MOCK_ACCOUNT_SOLANA_MAINNET.id;
    state.metamask.internalAccounts.accounts = {
      ...state.metamask.internalAccounts.accounts,
      [MOCK_ACCOUNT_SOLANA_MAINNET.id]: {
        ...MOCK_ACCOUNT_SOLANA_MAINNET,
        address: solanaAddress,
      },
    };
    state.metamask.accountTree.wallets[
      'entropy:01JKAF3DSGM3AB87EM9N0K41AJ'
    ].groups['entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0'].accounts.push(
      MOCK_ACCOUNT_SOLANA_MAINNET.id,
    );
    state.metamask.nonEvmTransactions = {
      [MOCK_ACCOUNT_SOLANA_MAINNET.id]: {
        [MultichainNetworks.SOLANA]: {
          transactions: [solanaSendTransaction],
          next: null,
          lastUpdated: 0,
        },
      },
    };
    state.metamask.enabledNetworkMap = {
      solana: { [MultichainNetworks.SOLANA]: true },
    };
    (
      state.metamask as MetaMaskReduxState['metamask'] & {
        txHistory: Record<string, unknown>;
      }
    ).txHistory = {
      [solanaTxId]: {
        account: solanaAddress,
        quote: {
          srcChainId: MultichainNetworks.SOLANA,
          destChainId: 8453,
          srcTokenAmount: '4912640',
          destTokenAmount: '38467',
          srcAsset: {
            assetId: `${MultichainNetworks.SOLANA}/slip44:501`,
            decimals: 9,
            symbol: 'SOL',
          },
          destAsset: {
            assetId:
              'eip155:8453/token:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
            decimals: 6,
            symbol: 'USDC',
          },
        },
        status: {
          status: StatusTypes.COMPLETE,
          srcChain: { txHash: solanaTxId },
          destChain: { amount: '38467' },
        },
      },
    };

    const [activity] = selectNonEvmActivityItems(state);

    expect(activity.type).toBe('bridge');
    expect(activity.data).toMatchObject({
      sourceToken: {
        symbol: 'SOL',
        direction: 'out',
        assetId: `${MultichainNetworks.SOLANA}/slip44:501`,
      },
      destinationToken: {
        symbol: 'USDC',
        direction: 'in',
        assetId: 'eip155:8453/token:0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
      },
    });
  });

  it('keeps unmatched non-EVM sends classified as sends', () => {
    const accountId = mockState.metamask.internalAccounts.selectedAccount;

    const state = buildState({
      [accountId]: {
        [MultichainNetworks.SOLANA]: {
          transactions: [
            {
              ...solanaSendTransaction,
              account: accountId,
            },
          ],
          next: null,
          lastUpdated: 0,
        },
      },
    }) as unknown as MetaMaskReduxState & MultichainAccountsState;

    const [activity] = selectNonEvmActivityItems(state);

    expect(activity.type).toBe('send');
    expect(activity.data).toMatchObject({
      token: {
        symbol: 'USDC',
        direction: 'out',
      },
    });
  });
});

describe('selectEvmAddress', () => {
  const { internalAccounts } = typedMockState.metamask;
  const evmAddressInGroup =
    internalAccounts.accounts[internalAccounts.selectedAccount].address;

  it('returns the EVM address from the selected account group when an EVM account is globally selected', () => {
    expect(selectEvmAddress(typedMockState)).toBe(evmAddressInGroup);
  });

  it('returns the EVM address from the selected account group when a non-EVM account is globally selected', () => {
    const state = structuredClone(typedMockState);

    state.metamask.internalAccounts.selectedAccount =
      MOCK_ACCOUNT_SOLANA_MAINNET.id;
    state.metamask.internalAccounts.accounts = {
      ...state.metamask.internalAccounts.accounts,
      [MOCK_ACCOUNT_SOLANA_MAINNET.id]: MOCK_ACCOUNT_SOLANA_MAINNET,
    };
    state.metamask.accountTree.wallets[
      'entropy:01JKAF3DSGM3AB87EM9N0K41AJ'
    ].groups['entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0'].accounts.push(
      MOCK_ACCOUNT_SOLANA_MAINNET.id,
    );

    expect(selectEvmAddress(state)).toBe(evmAddressInGroup);
  });

  it('returns undefined when the selected account group has no EVM account', () => {
    const state = structuredClone(typedMockState);

    state.metamask.selectedAccountGroup =
      'entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0';
    state.metamask.internalAccounts.selectedAccount =
      MOCK_ACCOUNT_SOLANA_MAINNET.id;
    state.metamask.internalAccounts.accounts = {
      [MOCK_ACCOUNT_SOLANA_MAINNET.id]: MOCK_ACCOUNT_SOLANA_MAINNET,
    } as typeof state.metamask.internalAccounts.accounts;
    state.metamask.accountTree.wallets[
      'entropy:01JKAF3PJ247KAM6C03G5Q0NP8'
    ].groups['entropy:01JKAF3PJ247KAM6C03G5Q0NP8/0'].accounts = [
      MOCK_ACCOUNT_SOLANA_MAINNET.id,
    ];

    expect(selectEvmAddress(state)).toBeUndefined();
  });
});
