import React from 'react';
import { fireEvent } from '../../../../test/jest';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE } from '../../../helpers/constants/routes';
import { getSelectedInternalAccountFromMockState } from '../../../../test/jest/mocks';
import { AccountDetailsMenuItem } from '.';

const mockInternalAccount = getSelectedInternalAccountFromMockState(mockState);

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  ...jest.requireActual(
    '../../../selectors/multichain-accounts/account-tree.ts',
  ),
  getSelectedAccountGroup: () => mockInternalAccount.address,
}));

const render = () => {
  const store = configureStore(mockState);
  return renderWithProvider(
    <AccountDetailsMenuItem
      metricsLocation="Global Menu"
      address={mockInternalAccount.address}
      closeMenu={jest.fn()}
    />,
    store,
  );
};

describe('AccountDetailsMenuItem', () => {
  it('navigates to the multichain account details page with selected account group', () => {
    global.platform = { openTab: jest.fn() };

    const { getByText, getByTestId } = render();
    expect(getByText('Account details')).toBeInTheDocument();

    fireEvent.click(getByTestId('account-list-menu-details'));

    expect(mockNavigate).toHaveBeenCalledWith(
      `${MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE}/${encodeURIComponent(
        mockInternalAccount.address,
      )}`,
    );
  });
});
