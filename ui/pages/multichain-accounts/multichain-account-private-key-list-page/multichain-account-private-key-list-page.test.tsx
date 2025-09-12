import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { AccountGroupId } from '@metamask/account-api';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { MultichainAccountPrivateKeyListPage } from './multichain-account-private-key-list-page';

const mockHistoryGoBack = jest.fn();
const mockUseParams = jest.fn();
const mockUseLocation = jest.fn();
const backButtonTestId = 'multichain-account-address-list-page-back-button';

// Use actual group IDs from mock-state.json
const MOCK_GROUP_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as AccountGroupId;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    goBack: mockHistoryGoBack,
  }),
  useParams: () => mockUseParams(),
  useLocation: () => mockUseLocation(),
}));

describe('MultichainAccountAddressListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ search: '' });
  });

  it('handles back button click', () => {
    mockUseParams.mockReturnValue({
      accountGroupId: MOCK_GROUP_ID,
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<MultichainAccountPrivateKeyListPage />, store);

    const backButton = screen.getByTestId(backButtonTestId);
    fireEvent.click(backButton);

    expect(mockHistoryGoBack).toHaveBeenCalledTimes(1);
  });

  it('displays the proper account group name', () => {
    mockUseParams.mockReturnValue({
      accountGroupId: MOCK_GROUP_ID,
    });
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });
    renderWithProvider(<MultichainAccountPrivateKeyListPage />, store);
    expect(screen.getByText(/Account 1 \/ Private Keys/iu)).toBeInTheDocument();
  });

  it('renders fallback account name when no account is found', () => {
    mockUseParams.mockReturnValue({
      accountGroupId: 'invalid-group-id',
    });
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        accountGroups: {}, // Make sure no account group matches
      },
    });
    renderWithProvider(<MultichainAccountPrivateKeyListPage />, store);
    expect(screen.getByText(/Account \/ Private Keys/iu)).toBeInTheDocument();
  });

  it('renders warning banner', () => {
    mockUseParams.mockReturnValue({
      accountGroupId: MOCK_GROUP_ID,
    });
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });
    renderWithProvider(<MultichainAccountPrivateKeyListPage />, store);
    expect(screen.getByTestId('backup-state-banner-alert')).toBeInTheDocument();
  });
});
