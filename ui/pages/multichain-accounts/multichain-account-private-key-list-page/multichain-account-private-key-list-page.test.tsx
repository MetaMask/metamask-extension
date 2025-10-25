import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { AccountGroupId } from '@metamask/account-api';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { MultichainAccountPrivateKeyListPage } from './multichain-account-private-key-list-page';

// Use actual group IDs from mock-state.json
const MOCK_GROUP_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as AccountGroupId;
const backButtonTestId = 'multichain-account-address-list-page-back-button';

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation(),
  };
});

describe('MultichainAccountAddressListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ search: '' });
  });

  it('handles back button click', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(
      <MultichainAccountPrivateKeyListPage accountGroupId={MOCK_GROUP_ID} />,
      store,
    );

    const backButton = screen.getByTestId(backButtonTestId);
    fireEvent.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith(-1);
  });

  it('displays the proper account group name', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });
    renderWithProvider(
      <MultichainAccountPrivateKeyListPage accountGroupId={MOCK_GROUP_ID} />,
      store,
    );
    expect(screen.getByText(/Account 1 \/ Private Keys/iu)).toBeInTheDocument();
  });

  it('renders fallback account name when no account is found', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        accountGroups: {}, // Make sure no account group matches
      },
    });
    renderWithProvider(
      <MultichainAccountPrivateKeyListPage accountGroupId="invalid-group-id" />,
      store,
    );
    expect(screen.getByText(/Account \/ Private Keys/iu)).toBeInTheDocument();
  });

  it('renders warning banner', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });
    renderWithProvider(
      <MultichainAccountPrivateKeyListPage accountGroupId={MOCK_GROUP_ID} />,
      store,
    );
    expect(screen.getByTestId('backup-state-banner-alert')).toBeInTheDocument();
  });
});
