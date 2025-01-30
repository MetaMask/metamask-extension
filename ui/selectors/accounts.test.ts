import { EthAccountType, EthScopes } from '@metamask/keyring-api';
import { ETH_EOA_METHODS } from '../../shared/constants/eth-methods';
import {
  MOCK_ACCOUNTS,
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_ERC4337,
  MOCK_ACCOUNT_BIP122_P2WPKH,
  MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET,
} from '../../test/data/mock-accounts';
import mockState from '../../test/data/mock-state.json';
import {
  AccountsState,
  isSelectedInternalAccountEth,
  isSelectedInternalAccountBtc,
  hasCreatedBtcMainnetAccount,
  hasCreatedBtcTestnetAccount,
  getSelectedInternalAccount,
  getInternalAccounts,
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
        options: {},
        methods: [
          'personal_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: EthAccountType.Eoa,
        scopes: [EthScopes.Namespace],
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
        scopes: [EthScopes.Namespace],
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

  describe('isSelectedInternalAccountBtc', () => {
    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      { type: MOCK_ACCOUNT_EOA.type, id: MOCK_ACCOUNT_EOA.id, isBtc: false },
      {
        type: MOCK_ACCOUNT_ERC4337.type,
        id: MOCK_ACCOUNT_ERC4337.id,
        isBtc: false,
      },
      {
        type: MOCK_ACCOUNT_BIP122_P2WPKH.type,
        id: MOCK_ACCOUNT_BIP122_P2WPKH.id,
        isBtc: true,
      },
    ])(
      'returns $isBtc if the account is: $type',
      ({ id, isBtc }: { id: string; isBtc: boolean }) => {
        const state = MOCK_STATE;

        state.metamask.internalAccounts.selectedAccount = id;
        expect(isSelectedInternalAccountBtc(state)).toBe(isBtc);
      },
    );

    it('returns false if none account is selected', () => {
      const state = MOCK_STATE;

      state.metamask.internalAccounts.selectedAccount = '';
      expect(isSelectedInternalAccountBtc(MOCK_STATE)).toBe(false);
    });
  });

  describe('hasCreatedBtcMainnetAccount', () => {
    it('returns true if the BTC mainnet account has been created', () => {
      const state = MOCK_STATE;

      expect(hasCreatedBtcMainnetAccount(state)).toBe(true);
    });

    it('returns false if the BTC mainnet account has not been created yet', () => {
      const state: AccountsState = {
        metamask: {
          // No-op for this test, but might be required in the future:
          ...MOCK_STATE.metamask,
          internalAccounts: {
            selectedAccount: MOCK_ACCOUNT_EOA.id,
            accounts: { mock_account_eoa: MOCK_ACCOUNT_EOA },
          },
        },
      };

      expect(isSelectedInternalAccountBtc(state)).toBe(false);
    });
  });

  describe('hasCreatedBtcTestnetAccount', () => {
    it('returns true if the BTC testnet account has been created', () => {
      const state: AccountsState = {
        metamask: {
          // No-op for this test, but might be required in the future:
          ...MOCK_STATE.metamask,
          internalAccounts: {
            selectedAccount: MOCK_ACCOUNT_BIP122_P2WPKH.id,
            accounts: {
              mock_account_bip122_pwpkh: MOCK_ACCOUNT_BIP122_P2WPKH,
              mock_account_bip122_p2wpkh_testnet:
                MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET,
            },
          },
        },
      };

      expect(hasCreatedBtcTestnetAccount(state)).toBe(true);
    });

    it('returns false if the BTC testnet account has not been created yet', () => {
      const state: AccountsState = {
        metamask: {
          // No-op for this test, but might be required in the future:
          ...MOCK_STATE.metamask,
          internalAccounts: {
            selectedAccount: MOCK_ACCOUNT_BIP122_P2WPKH.id,
            accounts: {
              mock_account_bip122_p2wpkh: MOCK_ACCOUNT_BIP122_P2WPKH,
            },
          },
        },
      };

      expect(isSelectedInternalAccountBtc(state)).toBe(false);
    });
  });
});
