import type { Transaction } from '@metamask/keyring-api';
import type { MultichainTransactionsControllerState } from '@metamask/multichain-transactions-controller';
import { MultichainNetworks } from '../../shared/constants/multichain/networks';
import type { MetaMaskReduxState } from '../store/store';
import { generateTokenCacheKey } from '../helpers/utils/token-scan';
import mockState from '../../test/data/mock-state.json';
import { MOCK_ACCOUNT_SOLANA_MAINNET } from '../../test/data/mock-accounts';
import type { MultichainAccountsState } from './multichain-accounts/account-tree.types';
import {
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
