import {
  MOCK_ACCOUNTS,
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_ERC4337,
  MOCK_ACCOUNT_BIP122_P2WPKH,
} from '../../test/data/mock-accounts';
import {
  AccountsState,
  isSelectedInternalAccountEth,
  isSelectedInternalAccountBtc,
  hasCreatedBtcMainnetAccount,
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
            accounts: [MOCK_ACCOUNT_EOA],
          },
        },
      };

      expect(isSelectedInternalAccountBtc(state)).toBe(false);
    });
  });
});
