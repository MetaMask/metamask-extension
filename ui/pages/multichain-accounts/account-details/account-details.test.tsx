import React from 'react';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/jest';
import {
  MOCK_ACCOUNT_EOA,
  MOCK_ACCOUNT_ERC4337,
  MOCK_ACCOUNT_SOLANA_MAINNET,
} from '../../../../test/data/mock-accounts';
import { AccountDetails } from './account-details';

const middleware = [thunk];
const mockStore = configureMockStore(middleware);

// Mock the useHistory hook
const mockPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockPush,
  }),
}));

// Mock the useI18nContext hook
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

const createMockState = (address: string, account = MOCK_ACCOUNT_EOA) => ({
  appState: {
    accountDetailsAddress: address,
  },
  metamask: {
    internalAccounts: {
      accounts: {
        [account.id]: {
          ...account,
          address,
        },
      },
      selectedAccount: account.id,
    },
  },
});

describe('AccountDetails', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('Account Type Detection', () => {
    it('should render EVM account details for EOA accounts', () => {
      const state = createMockState(MOCK_ACCOUNT_EOA.address, MOCK_ACCOUNT_EOA);
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <AccountDetails />
        </MemoryRouter>,
        store,
      );

      // Should render the base account details (which includes account name)
      expect(screen.getByText('Account 1')).toBeInTheDocument();
    });

    it('should render EVM account details for ERC-4337 accounts', () => {
      const state = createMockState(
        MOCK_ACCOUNT_ERC4337.address,
        MOCK_ACCOUNT_ERC4337,
      );
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <AccountDetails />
        </MemoryRouter>,
        store,
      );

      // Should render the base account details (which includes account name)
      expect(screen.getByText('Account 2')).toBeInTheDocument();
    });

    it('should render account details for Solana accounts', () => {
      const state = createMockState(
        MOCK_ACCOUNT_SOLANA_MAINNET.address,
        MOCK_ACCOUNT_SOLANA_MAINNET,
      );
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <AccountDetails />
        </MemoryRouter>,
        store,
      );

      // Should render the base account details (which includes account name)
      expect(screen.getByText('Solana Account')).toBeInTheDocument();
    });

    it('should navigate to default route when no address is provided', () => {
      const state = createMockState('', MOCK_ACCOUNT_EOA);
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <AccountDetails />
        </MemoryRouter>,
        store,
      );

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});
