import React from 'react';
import { renderWithProvider, fireEvent } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import * as actions from '../../../store/actions';
import { AccountDetailsMenuItem } from '.';

const render = () => {
  const store = configureStore(mockState);
  return renderWithProvider(
    <AccountDetailsMenuItem
      metricsLocation="Global Menu"
      accountId={mockState.metamask.internalAccounts.selectedAccount}
      closeMenu={jest.fn()}
    />,
    store,
  );
};

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions.ts'),
  setAccountDetailsAccountId: jest.fn().mockReturnValue({ type: 'TYPE' }),
}));

describe('AccountDetailsMenuItem', () => {
  it('opens the Account Details modal with the correct address', () => {
    global.platform = { openTab: jest.fn() };

    const { getByText, getByTestId } = render();
    expect(getByText('Account details')).toBeInTheDocument();

    fireEvent.click(getByTestId('account-list-menu-details'));

    expect(actions.setAccountDetailsAccountId).toHaveBeenCalledWith(
      mockState.metamask.internalAccounts.selectedAccount,
    );
  });
});
