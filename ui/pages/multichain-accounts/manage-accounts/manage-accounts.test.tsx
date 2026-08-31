import React from 'react';
import { fireEvent, screen } from '@testing-library/react';

import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { setBackgroundConnection } from '../../../store/background-connection';
import mockState from '../../../../test/data/mock-state.json';
import { ManageAccounts } from './manage-accounts';

const backgroundConnectionMock = new Proxy(
  {},
  {
    get: () => jest.fn().mockResolvedValue(undefined),
  },
);

const mockUseNavigate = jest.fn();
let mockLocationKey = 'default';
let mockLocationState: Record<string, unknown> | null = null;
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => ({
      key: mockLocationKey,
      pathname: '/manage-accounts',
      search: '',
      hash: '',
      state: mockLocationState,
    }),
  };
});

describe('ManageAccounts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationKey = 'default';
    mockLocationState = null;
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  const renderComponent = (
    customState?: Parameters<typeof configureStore>[0],
  ) => {
    const store = configureStore(customState || mockState);
    return renderWithProvider(<ManageAccounts />, store);
  };

  it('renders the page with the header title', () => {
    renderComponent();

    expect(screen.getByTestId('manage-accounts-page')).toBeInTheDocument();
    expect(
      screen.getByText(messages.manageAccounts.message),
    ).toBeInTheDocument();
  });

  it('renders the back button', () => {
    renderComponent();

    expect(
      screen.getByLabelText(messages.back.message),
    ).toBeInTheDocument();
  });

  it('navigates back when arrived via in-app navigation', () => {
    mockLocationKey = 'abc123';

    renderComponent();

    const backButton = screen.getByLabelText(messages.back.message);
    fireEvent.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to home when location.key is default', () => {
    renderComponent();

    const backButton = screen.getByLabelText(messages.back.message);
    fireEvent.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('navigates to home when arrived from fresh tab via state', () => {
    mockLocationKey = 'abc123';
    mockLocationState = { fromFreshTab: true };

    renderComponent();

    const backButton = screen.getByLabelText(messages.back.message);
    fireEvent.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('renders search input and allows filtering accounts', () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(
      messages.searchYourAccounts.message,
    );
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, {
      target: { value: 'NonexistentAccountName123' },
    });

    expect(
      screen.getByTestId('manage-accounts-no-results'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.noAccountsFound.message),
    ).toBeInTheDocument();
  });

  it('navigates to choose new wallet type when clicking Add Wallet button', () => {
    renderComponent();

    const addWalletButton = screen.getByTestId(
      'manage-accounts-add-wallet-button',
    );
    expect(addWalletButton).toBeInTheDocument();

    fireEvent.click(addWalletButton);

    expect(mockUseNavigate).toHaveBeenCalledWith('/choose-new-wallet-type');
  });
});
