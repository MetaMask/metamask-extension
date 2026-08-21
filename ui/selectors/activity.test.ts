import { StatusTypes } from '@metamask/bridge-controller';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import type { Transaction } from '@metamask/keyring-api';
import { TransactionStatus, TransactionType } from '@metamask/keyring-api';
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import {
  TransactionStatus as EvmTransactionStatus,
  TransactionType as EvmTransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { MultichainNetworks } from '../../shared/constants/multichain/networks';
import type { MetaMaskReduxState } from '../store/store';
import { generateTokenCacheKey } from '../helpers/utils/token-scan';
import mockState from '../../test/data/mock-state.json';
import { MOCK_ACCOUNT_SOLANA_MAINNET } from '../../test/data/mock-accounts';
import type { MultichainAccountsState } from './multichain-accounts/account-tree.types';
import {
  selectLocalTransactions,
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
        txHistory: Record<string, BridgeHistoryItem>;
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
      } as unknown as BridgeHistoryItem,
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

describe('selectLocalTransactions', () => {
  const MONEY_ACCOUNT_ADDRESS = '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2';
  const PRIMARY_HD_KEYRING_ID = '01JKAF3DSGM3AB87EM9N0K41AJ';

  function buildMoneyAccountTransaction(
    overrides: Partial<TransactionMeta> = {},
  ): TransactionMeta {
    return {
      id: 'money-account-tx',
      chainId: '0x1',
      networkClientId: 'mainnet',
      status: EvmTransactionStatus.confirmed,
      time: 1,
      type: EvmTransactionType.batch,
      txParams: {
        from: MONEY_ACCOUNT_ADDRESS,
        to: MONEY_ACCOUNT_ADDRESS,
        nonce: '0x77',
        value: '0x0',
      },
      nestedTransactions: [
        { type: EvmTransactionType.tokenMethodApprove },
        { type: EvmTransactionType.moneyAccountDeposit },
      ],
      ...overrides,
    } as TransactionMeta;
  }

  function buildStateWithMoneyAccount(transaction: TransactionMeta) {
    const state = structuredClone(typedMockState) as MultichainAccountsState & {
      metamask: {
        transactions?: TransactionMeta[];
        moneyAccounts?: Record<
          string,
          { address: string; options: { entropy: { id: string } } }
        >;
      };
    };

    state.metamask.transactions = [transaction];
    state.metamask.moneyAccounts = {
      'money-account-1': {
        address: MONEY_ACCOUNT_ADDRESS,
        options: { entropy: { id: PRIMARY_HD_KEYRING_ID } },
      },
    };

    return state as Parameters<typeof selectLocalTransactions>[0];
  }

  it('includes money-account transactions sent from the money account', () => {
    const state = buildStateWithMoneyAccount(buildMoneyAccountTransaction());

    const groups = selectLocalTransactions(state);

    expect(
      groups.some(
        (group) => group.initialTransaction.id === 'money-account-tx',
      ),
    ).toBe(true);
  });

  it('excludes non-money transactions sent from the money account', () => {
    const state = buildStateWithMoneyAccount(
      buildMoneyAccountTransaction({
        type: EvmTransactionType.simpleSend,
        nestedTransactions: undefined,
      }),
    );

    const groups = selectLocalTransactions(state);

    expect(
      groups.some(
        (group) => group.initialTransaction.id === 'money-account-tx',
      ),
    ).toBe(false);
  });
});
