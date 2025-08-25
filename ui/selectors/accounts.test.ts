import {
  EthAccountType,
  EthScope,
  BtcScope,
  SolScope,
  CaipChainId,
} from '@metamask/keyring-api';
import { ETH_EOA_METHODS } from '../../shared/constants/eth-methods';
import {
  MOCK_ACCOUNTS,
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_ERC4337,
  MOCK_ACCOUNT_BIP122_P2WPKH,
} from '../../test/data/mock-accounts';
import mockState from '../../test/data/mock-state.json';
import {
  AccountsState,
  isSelectedInternalAccountEth,
  getSelectedInternalAccount,
  getInternalAccounts,
  getInternalAccountsObject,
  getInternalAccountsByScope,
} from './accounts';

const MOCK_STATE: AccountsState = {
  metamask: {
    internalAccounts: {
      selectedAccount: MOCK_ACCOUNT_EOA.id,
      accounts: MOCK_ACCOUNTS,
    },
  },
};

describe('Accounts Selectors', () => {
  describe('#getInternalAccounts', () => {
    it('returns a list of internal accounts', () => {
      expect(getInternalAccounts(mockState as AccountsState)).toStrictEqual(
        Object.values(mockState.metamask.internalAccounts.accounts),
      );
    });

    it('returns the same object', () => {
      const result1 = getInternalAccounts(mockState as AccountsState);
      const result2 = getInternalAccounts(mockState as AccountsState);
      expect(result1 === result2).toBe(true);
    });
  });

  describe('#getSelectedInternalAccount', () => {
    it('returns selected internalAccount', () => {
      expect(
        getSelectedInternalAccount(mockState as AccountsState),
      ).toStrictEqual({
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          importTime: 0,
          name: 'Test Account',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {
          entropySource: '01JKAF3DSGM3AB87EM9N0K41AJ',
        },
        methods: [
          'personal_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: EthAccountType.Eoa,
        scopes: [EthScope.Eoa],
      });
    });

    it('returns undefined if selectedAccount is undefined', () => {
      expect(
        getSelectedInternalAccount({
          metamask: {
            internalAccounts: {
              accounts: {},
              selectedAccount: '',
            },
          },
        }),
      ).toBeUndefined();
    });

    it('returns selectedAccount', () => {
      const mockInternalAccount = {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          importTime: 0,
          name: 'Test Account',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        methods: ETH_EOA_METHODS,
        scopes: [EthScope.Eoa],
        type: EthAccountType.Eoa,
      };
      expect(
        getSelectedInternalAccount({
          metamask: {
            internalAccounts: {
              accounts: {
                [mockInternalAccount.id]: mockInternalAccount,
              },
              selectedAccount: mockInternalAccount.id,
            },
          },
        }),
      ).toStrictEqual(mockInternalAccount);
    });
  });

  describe('isSelectedInternalAccountEth', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      { type: MOCK_ACCOUNT_EOA.type, id: MOCK_ACCOUNT_EOA.id, isEth: true },
      {
        type: MOCK_ACCOUNT_ERC4337.type,
        id: MOCK_ACCOUNT_ERC4337.id,
        isEth: true,
      },
      {
        type: MOCK_ACCOUNT_BIP122_P2WPKH.type,
        id: MOCK_ACCOUNT_BIP122_P2WPKH.id,
        isEth: false,
      },
    ])(
      'returns $isEth if the account is: $type',
      ({ id, isEth }: { id: string; isEth: boolean }) => {
        const state = MOCK_STATE;

        state.metamask.internalAccounts.selectedAccount = id;
        expect(isSelectedInternalAccountEth(state)).toBe(isEth);
      },
    );

    it('returns false if no account is selected', () => {
      const state = MOCK_STATE;

      state.metamask.internalAccounts.selectedAccount = '';
      expect(isSelectedInternalAccountEth(MOCK_STATE)).toBe(false);
    });
  });

  describe('getInternalAccountsObject', () => {
    it('returns the internal accounts object', () => {
      expect(
        getInternalAccountsObject(mockState as AccountsState),
      ).toStrictEqual(mockState.metamask.internalAccounts.accounts);
    });
  });

  describe('getInternalAccountsByScope', () => {
    it('returns all accounts that have any EVM scope when eip155:0 (wildcard) is requested', () => {
      const accountWithEthScope = {
        ...MOCK_ACCOUNT_EOA,
        id: `${MOCK_ACCOUNT_EOA.id}-evm1`,
        scopes: ['eip155:1'],
      };
      const accountWithPolygonScope = {
        ...MOCK_ACCOUNT_ERC4337,
        id: `${MOCK_ACCOUNT_ERC4337.id}-evm137`,
        scopes: ['eip155:137'],
      };
      const nonEvmAccount = {
        ...MOCK_ACCOUNT_BIP122_P2WPKH,
        id: `${MOCK_ACCOUNT_BIP122_P2WPKH.id}-btc`,
      };

      const state: AccountsState = {
        metamask: {
          internalAccounts: {
            selectedAccount: accountWithEthScope.id,
            accounts: {
              [accountWithEthScope.id]: accountWithEthScope,
              [accountWithPolygonScope.id]: accountWithPolygonScope,
              [nonEvmAccount.id]: nonEvmAccount,
            },
          },
        },
      } as unknown as AccountsState;

      const result = getInternalAccountsByScope(
        state,
        'eip155:0' as CaipChainId,
      );
      expect(result).toEqual(
        expect.arrayContaining([accountWithEthScope, accountWithPolygonScope]),
      );
      expect(result).toHaveLength(2);
    });

    it('returns EVM accounts for both EOA and SCA (erc4337) when EVM wildcard scope is requested', () => {
      const eoaAccount = {
        ...MOCK_ACCOUNT_EOA,
        id: `${MOCK_ACCOUNT_EOA.id}-eoa`,
        scopes: ['eip155:1'],
      };
      const scaAccount = {
        ...MOCK_ACCOUNT_ERC4337,
        id: `${MOCK_ACCOUNT_ERC4337.id}-sca`,
        scopes: ['eip155:137'],
      };
      const solAccount = {
        ...MOCK_ACCOUNT_EOA,
        id: `${MOCK_ACCOUNT_EOA.id}-sol`,
        scopes: [SolScope.Mainnet],
      };

      const state: AccountsState = {
        metamask: {
          internalAccounts: {
            selectedAccount: eoaAccount.id,
            accounts: {
              [eoaAccount.id]: eoaAccount,
              [scaAccount.id]: scaAccount,
              [solAccount.id]: solAccount,
            },
          },
        },
      } as unknown as AccountsState;

      const result = getInternalAccountsByScope(
        state,
        'eip155:0' as CaipChainId,
      );
      expect(result).toEqual(expect.arrayContaining([eoaAccount, scaAccount]));
      expect(result).toHaveLength(2);
    });

    it('includes accounts with wildcard scope eip155:0 when a specific EVM scope is requested', () => {
      const wildcardAccount = {
        ...MOCK_ACCOUNT_EOA,
        id: `${MOCK_ACCOUNT_EOA.id}-wildcard`,
        scopes: ['eip155:0'],
      };
      const specificChainAccount = {
        ...MOCK_ACCOUNT_ERC4337,
        id: `${MOCK_ACCOUNT_ERC4337.id}-evm1`,
        scopes: ['eip155:1'],
      };

      const state: AccountsState = {
        metamask: {
          internalAccounts: {
            selectedAccount: wildcardAccount.id,
            accounts: {
              [wildcardAccount.id]: wildcardAccount,
              [specificChainAccount.id]: specificChainAccount,
            },
          },
        },
      } as unknown as AccountsState;

      const result = getInternalAccountsByScope(
        state,
        'eip155:1' as CaipChainId,
      );
      expect(result).toEqual(
        expect.arrayContaining([wildcardAccount, specificChainAccount]),
      );
      expect(result).toHaveLength(2);
    });

    it('excludes accounts with a different specific EVM chain when requesting eip155:1 (no wildcard)', () => {
      const eoaAccount = {
        ...MOCK_ACCOUNT_EOA,
        id: `${MOCK_ACCOUNT_EOA.id}-eoa-specific`,
        scopes: ['eip155:1'],
      };
      const scaDifferentChain = {
        ...MOCK_ACCOUNT_ERC4337,
        id: `${MOCK_ACCOUNT_ERC4337.id}-sca-diff`,
        scopes: ['eip155:137'],
      };

      const state: AccountsState = {
        metamask: {
          internalAccounts: {
            selectedAccount: eoaAccount.id,
            accounts: {
              [eoaAccount.id]: eoaAccount,
              [scaDifferentChain.id]: scaDifferentChain,
            },
          },
        },
      } as unknown as AccountsState;

      const result = getInternalAccountsByScope(
        state,
        'eip155:1' as CaipChainId,
      );
      expect(result).toEqual([eoaAccount]);
    });

    it('returns only accounts with the exact non-EVM scope', () => {
      const solanaAccount = {
        ...MOCK_ACCOUNT_EOA,
        id: `${MOCK_ACCOUNT_EOA.id}-sol1`,
        scopes: [SolScope.Mainnet],
      };
      const anotherSolanaAccount = {
        ...MOCK_ACCOUNT_ERC4337,
        id: `${MOCK_ACCOUNT_ERC4337.id}-sol2`,
        scopes: [SolScope.Mainnet],
      };
      const btcAccount = {
        ...MOCK_ACCOUNT_BIP122_P2WPKH,
      };

      const state: AccountsState = {
        metamask: {
          internalAccounts: {
            selectedAccount: solanaAccount.id,
            accounts: {
              [solanaAccount.id]: solanaAccount,
              [anotherSolanaAccount.id]: anotherSolanaAccount,
              [btcAccount.id]: btcAccount,
            },
          },
        },
      } as unknown as AccountsState;

      const result = getInternalAccountsByScope(
        state,
        SolScope.Mainnet as CaipChainId,
      );
      expect(result).toEqual(
        expect.arrayContaining([solanaAccount, anotherSolanaAccount]),
      );
      expect(result).toHaveLength(2);
    });

    it('returns an empty array when no accounts match the requested scope', () => {
      const emptyState = {
        metamask: { internalAccounts: { selectedAccount: '', accounts: {} } },
      } as unknown as AccountsState;

      const result = getInternalAccountsByScope(
        emptyState,
        BtcScope.Mainnet as CaipChainId,
      );
      expect(result).toEqual([]);
    });
  });
});
