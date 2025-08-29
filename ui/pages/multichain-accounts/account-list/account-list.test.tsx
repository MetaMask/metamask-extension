import React from 'react';
import { screen, fireEvent } from '@testing-library/react';

import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { AccountList } from './account-list';

const mockHistoryGoBack = jest.fn();
const mockHistoryPush = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    goBack: mockHistoryGoBack,
    push: mockHistoryPush,
  }),
}));

describe('AccountList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Disable reselect dev mode checks for testing
    process.env.NODE_ENV = 'production';
  });

  const renderComponent = () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        accountTree: {
          selectedAccountGroup: '01JKAF3DSGM3AB87EM9N0K41AJ:default',
          wallets: {
            '01JKAF3DSGM3AB87EM9N0K41AJ': {
              id: '01JKAF3DSGM3AB87EM9N0K41AJ',
              metadata: {
                name: 'Wallet 1',
              },
              groups: {
                '01JKAF3DSGM3AB87EM9N0K41AJ:default': {
                  id: '01JKAF3DSGM3AB87EM9N0K41AJ:default',
                  metadata: {
                    name: 'Account 1 from wallet 1',
                  },
                  accounts: [
                    'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
                    '07c2cfec-36c9-46c4-8115-3836d3ac9047',
                  ],
                },
              },
            },
            '01JKAF3PJ247KAM6C03G5Q0NP8': {
              id: '01JKAF3PJ247KAM6C03G5Q0NP8',
              metadata: {
                name: 'Wallet 2',
              },
              groups: {
                '01JKAF3PJ247KAM6C03G5Q0NP8:default': {
                  id: '01JKAF3PJ247KAM6C03G5Q0NP8:default',
                  metadata: {
                    name: 'Account 1 from wallet 2',
                  },
                  accounts: ['784225f4-d30b-4e77-a900-c8bbce735b88'],
                },
              },
            },
          },
        },
      },
      localeMessages: {
        currentLocale: 'en',
        current: {
          back: 'Back',
          accounts: 'Accounts',
          addWallet: 'Add wallet',
          importAWallet: 'Import a wallet',
          importAnAccount: 'Import an account',
          addAHardwareWallet: 'Add a hardware wallet',
        },
      },
    });

    return renderWithProvider(<AccountList />, store);
  };

  it('renders the page with correct components and elements', () => {
    renderComponent();

    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByLabelText('Back')).toBeInTheDocument();

    const walletHeaders = screen.getAllByTestId(
      'multichain-account-tree-wallet-header',
    );

    expect(walletHeaders.length).toBe(2);
    expect(screen.getByText('Wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Wallet 2')).toBeInTheDocument();
    expect(screen.getByText('Account 1 from wallet 1')).toBeInTheDocument();
    expect(screen.getByText('Account 1 from wallet 2')).toBeInTheDocument();
  });

  it('calls history.goBack when back button is clicked', () => {
    renderComponent();

    const backButton = screen.getByLabelText('Back');
    fireEvent.click(backButton);

    expect(mockHistoryGoBack).toHaveBeenCalledTimes(1);
  });

  it('opens the add wallet modal when the add wallet button is clicked', () => {
    renderComponent();

    // First, let's verify the button is rendered by looking for it with role
    const addWalletButton = screen.getByRole('button', { name: 'Add wallet' });
    expect(addWalletButton).toBeInTheDocument();

    fireEvent.click(addWalletButton);

    // The modal renders with portal, so we need to look for modal content
    expect(screen.getByText('Import a wallet')).toBeInTheDocument();
    expect(screen.getByText('Import an account')).toBeInTheDocument();
    expect(screen.getByText('Add a hardware wallet')).toBeInTheDocument();
  });
});
