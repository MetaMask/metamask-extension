import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { AccountGroupId } from '@metamask/account-api';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { MultichainAccountAddressListPage } from './multichain-account-address-list-page';

const mockHistoryGoBack = jest.fn();
const mockUseParams = jest.fn();
const mockUseLocation = jest.fn();
const addressRowsListSearchTestId = 'multichain-address-rows-list-search';
const addressRowsListTestId = 'multichain-address-rows-list';
const backButtonTestId = 'multichain-account-address-list-page-back-button';

// Use actual group IDs from mock-state.json
const MOCK_GROUP_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as AccountGroupId;
const MOCK_GROUP_NAME = 'Account 1';

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

  it('renders the page with correct components', () => {
    mockUseParams.mockReturnValue({
      accountGroupId: MOCK_GROUP_ID,
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<MultichainAccountAddressListPage />, store);

    // Check header shows group name from mock state (Account 1)
    expect(
      screen.getByText(`${MOCK_GROUP_NAME} / Addresses`),
    ).toBeInTheDocument();

    // Check back button is present
    expect(screen.getByTestId(backButtonTestId)).toBeInTheDocument();

    // Check address list component is rendered
    expect(screen.getByTestId(addressRowsListTestId)).toBeInTheDocument();

    // Verify search field is rendered
    expect(screen.getByTestId(addressRowsListSearchTestId)).toBeInTheDocument();
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

    renderWithProvider(<MultichainAccountAddressListPage />, store);

    const backButton = screen.getByTestId(backButtonTestId);
    fireEvent.click(backButton);

    expect(mockHistoryGoBack).toHaveBeenCalledTimes(1);
  });

  it('handles non-existent account group gracefully', () => {
    mockUseParams.mockReturnValue({
      accountGroupId: 'non-existent-group',
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<MultichainAccountAddressListPage />, store);

    // Should show fallback text when group doesn't exist
    expect(screen.getByText('Account / Addresses')).toBeInTheDocument();

    // Should still render the address list component (even if empty)
    expect(screen.getByTestId(addressRowsListTestId)).toBeInTheDocument();
  });

  it('handles encoded account group ID', () => {
    const encodedGroupId = encodeURIComponent(MOCK_GROUP_ID);

    mockUseParams.mockReturnValue({
      accountGroupId: encodedGroupId,
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<MultichainAccountAddressListPage />, store);

    // Should still render correctly with encoded ID
    expect(
      screen.getByText(`${MOCK_GROUP_NAME} / Addresses`),
    ).toBeInTheDocument();

    // Check address list component is rendered
    expect(screen.getByTestId(addressRowsListTestId)).toBeInTheDocument();
  });

  it('shows receiving address title in receive mode', () => {
    mockUseLocation.mockReturnValue({ search: '?source=receive' });
    mockUseParams.mockReturnValue({
      accountGroupId: MOCK_GROUP_ID,
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<MultichainAccountAddressListPage />, store);

    // Should show "Receiving address" instead of "Account 1 / Addresses"
    expect(screen.getByText('Receiving address')).toBeInTheDocument();
    expect(
      screen.queryByText(`${MOCK_GROUP_NAME} / Addresses`),
    ).not.toBeInTheDocument();
  });

  it('renders correctly with multiple accounts in group', () => {
    // The mock state already has two accounts in the group
    mockUseParams.mockReturnValue({
      accountGroupId: MOCK_GROUP_ID,
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<MultichainAccountAddressListPage />, store);

    // Check that the page renders correctly
    expect(
      screen.getByText(`${MOCK_GROUP_NAME} / Addresses`),
    ).toBeInTheDocument();

    // The MultichainAddressRowsList component should receive the accounts
    expect(screen.getByTestId(addressRowsListTestId)).toBeInTheDocument();
  });

  it('handles special characters in group ID', () => {
    const specialGroupId =
      'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0' as AccountGroupId;
    const encodedSpecialGroupId = encodeURIComponent(specialGroupId);

    mockUseParams.mockReturnValue({
      accountGroupId: encodedSpecialGroupId,
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<MultichainAccountAddressListPage />, store);

    // Should decode and handle the special characters correctly
    expect(
      screen.getByText(`${MOCK_GROUP_NAME} / Addresses`),
    ).toBeInTheDocument();
  });

  it('renders with different query parameters correctly', () => {
    mockUseLocation.mockReturnValue({ search: '?source=other' });
    mockUseParams.mockReturnValue({
      accountGroupId: MOCK_GROUP_ID,
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<MultichainAccountAddressListPage />, store);

    // Should show normal title (not receiving address)
    expect(
      screen.getByText(`${MOCK_GROUP_NAME} / Addresses`),
    ).toBeInTheDocument();
    expect(screen.queryByText('Receiving address')).not.toBeInTheDocument();
  });

  it('handles null account group ID', () => {
    mockUseParams.mockReturnValue({
      accountGroupId: null,
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<MultichainAccountAddressListPage />, store);

    // Should show fallback text
    expect(screen.getByText('Account / Addresses')).toBeInTheDocument();
  });

  it('handles undefined account group ID', () => {
    mockUseParams.mockReturnValue({
      accountGroupId: undefined,
    });

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    renderWithProvider(<MultichainAccountAddressListPage />, store);

    // Should show fallback text
    expect(screen.getByText('Account / Addresses')).toBeInTheDocument();
  });
});
