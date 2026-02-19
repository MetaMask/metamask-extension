import mockState from '../../../test/data/mock-state.json';
import {
  getSelectedInternalAccount,
  type SelectedInternalAccountState,
} from './accounts';

describe('Shared Accounts Selectors', () => {
  it('returns the selected internal account', () => {
    const state = mockState as unknown as SelectedInternalAccountState;
    const selectedAccount =
      state.metamask.internalAccounts.accounts[
        state.metamask.internalAccounts.selectedAccount
      ];

    expect(getSelectedInternalAccount(state)).toStrictEqual(selectedAccount);
  });

  it('returns undefined when selected account is missing', () => {
    const state = {
      metamask: {
        internalAccounts: {
          accounts: {},
          selectedAccount: '',
        },
      },
    } as unknown as SelectedInternalAccountState;

    expect(getSelectedInternalAccount(state)).toBeUndefined();
  });
});
