import { EthAccountType } from '@metamask/keyring-api';
import { cloneDeep } from 'lodash';
import {
  MOCK_ACCOUNTS,
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_ERC4337,
  MOCK_ACCOUNT_BIP122_P2WPKH,
  MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET,
} from '../../test/data/mock-accounts';
import { ETH_EOA_METHODS } from '../../shared/constants/eth-methods';
import { createMockInternalAccount } from '../../test/jest/mocks';
import mockState from '../../test/data/mock-state.json';
import {
  AccountsState,
  isSelectedInternalAccountEth,
  isSelectedInternalAccountBtc,
  hasCreatedBtcMainnetAccount,
  hasCreatedBtcTestnetAccount,
  getSelectedAddress,
  getSelectedInternalAccount,
  getInternalAccounts,
  getInternalAccount,
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
        const state = cloneDeep(MOCK_STATE); // Needed since selectors are memoized

        state.metamask.internalAccounts.selectedAccount = id;
        expect(isSelectedInternalAccountEth(state)).toBe(isEth);
      },
    );

    it('returns false if no account is selected', () => {
      const state = cloneDeep(MOCK_STATE); // Needed since selectors are memoized

      state.metamask.internalAccounts.selectedAccount = '';
      expect(isSelectedInternalAccountEth(state)).toBe(false);
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
        const state = cloneDeep(MOCK_STATE);

        state.metamask.internalAccounts.selectedAccount = id;
        expect(isSelectedInternalAccountBtc(state)).toBe(isBtc);
      },
    );

    it('returns false if none account is selected', () => {
      const state = cloneDeep(MOCK_STATE);

      state.metamask.internalAccounts.selectedAccount = '';
      expect(isSelectedInternalAccountBtc(state)).toBe(false);
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
            accounts: [MOCK_ACCOUNT_EOA],
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
            accounts: [
              MOCK_ACCOUNT_BIP122_P2WPKH,
              MOCK_ACCOUNT_BIP122_P2WPKH_TESTNET,
            ],
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
            accounts: [MOCK_ACCOUNT_BIP122_P2WPKH],
          },
        },
      };

      expect(isSelectedInternalAccountBtc(state)).toBe(false);
    });
  });
  describe('getSelectedAddress', () => {
    it('returns undefined if selectedAddress is undefined', () => {
      expect(
        getSelectedAddress({
          metamask: { internalAccounts: { accounts: {}, selectedAccount: '' } },
        }),
      ).toBeUndefined();
    });

    it('returns selectedAddress', () => {
      const mockInternalAccount = createMockInternalAccount();
      const internalAccounts = {
        accounts: {
          [mockInternalAccount.id]: mockInternalAccount,
        },
        selectedAccount: mockInternalAccount.id,
      };

      expect(
        getSelectedAddress({ metamask: { internalAccounts } }),
      ).toStrictEqual(mockInternalAccount.address);
    });
  });
  describe('getSelectedInternalAccount', () => {
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
          name: 'Test Account',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        methods: ETH_EOA_METHODS,
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
  describe('getInternalAccounts', () => {
    it('returns a list of internal accounts', () => {
      expect(getInternalAccounts(mockState)).toStrictEqual(
        Object.values(mockState.metamask.internalAccounts.accounts),
      );
    });
  });
  describe('getInternalAccount', () => {
    it("returns undefined if the account doesn't exist", () => {
      expect(getInternalAccount(mockState, 'unknown')).toBeUndefined();
    });

    it('returns the account', () => {
      expect(
        getInternalAccount(mockState, 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'),
      ).toStrictEqual(
        mockState.metamask.internalAccounts.accounts[
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3'
        ],
      );
    });
  });
});
