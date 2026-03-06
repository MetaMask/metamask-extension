import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { ManageInstitutionalWalletItem } from './manage-institutional-wallet-item';

const mockSetManageInstitutionalWallets = jest.fn();

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setManageInstitutionalWallets: (val: boolean) => {
    mockSetManageInstitutionalWallets(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('ManageInstitutionalWalletItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    renderWithProvider(<ManageInstitutionalWalletItem />, mockStore);

    expect(
      screen.getByText(messages.manageInstitutionalWallets.message),
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    renderWithProvider(<ManageInstitutionalWalletItem />, mockStore);

    expect(
      screen.getByText(messages.manageInstitutionalWalletsDescription.message),
    ).toBeInTheDocument();
  });

  it('renders toggle in enabled state', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        manageInstitutionalWallets: true,
      },
    });
    renderWithProvider(<ManageInstitutionalWalletItem />, storeEnabled);

    expect(screen.getByTestId('manage-institutional-wallets')).toHaveAttribute(
      'value',
      'true',
    );
  });

  it('renders toggle in disabled state', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        manageInstitutionalWallets: false,
      },
    });
    renderWithProvider(<ManageInstitutionalWalletItem />, storeDisabled);

    expect(screen.getByTestId('manage-institutional-wallets')).toHaveAttribute(
      'value',
      'false',
    );
  });

  it('calls action with false when toggled off', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        manageInstitutionalWallets: true,
      },
    });
    renderWithProvider(<ManageInstitutionalWalletItem />, storeEnabled);

    fireEvent.click(screen.getByTestId('manage-institutional-wallets'));

    expect(mockSetManageInstitutionalWallets).toHaveBeenCalledWith(false);
  });

  it('calls action with true when toggled on', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        manageInstitutionalWallets: false,
      },
    });
    renderWithProvider(<ManageInstitutionalWalletItem />, storeDisabled);

    fireEvent.click(screen.getByTestId('manage-institutional-wallets'));

    expect(mockSetManageInstitutionalWallets).toHaveBeenCalledWith(true);
  });
});
