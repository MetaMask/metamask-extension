import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { NOTIFICATION_SOLANA_ON_METAMASK } from '../../../../shared/notifications';
import { MOCK_ACCOUNT_SOLANA_MAINNET } from '../../../../test/data/mock-accounts';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';
import { useMultichainWalletSnapClient } from '../../../hooks/accounts/useMultichainWalletSnapClient';
import configureStore from '../../../store/store';
import WhatsNewModal from './whats-new-modal';

jest.mock('../../../hooks/accounts/useMultichainWalletSnapClient', () => ({
  useMultichainWalletSnapClient: jest.fn(),
  WalletClientType: {
    Solana: 'solana',
  },
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  getNextAvailableAccountName: () => 'Test Account',
}));

describe('WhatsNewModal', () => {
  const mockOnClose = jest.fn();
  const mockCreateAccount = jest.fn();
  const KEYRING_ID = '01JKAF3DSGM3AB87EM9N0K41AJ';
  const MOCK_ADDRESS = '0x1234567890123456789012345678901234567891';

  beforeEach(() => {
    jest.clearAllMocks();

    (useMultichainWalletSnapClient as jest.Mock).mockReturnValue({
      createAccount: mockCreateAccount,
    });
  });

  const renderModalWithNotification = ({
    notificationId,
  }: {
    notificationId: number;
  }) => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        announcements: {
          [notificationId]: {
            date: '2025-03-03',
            id: notificationId,
            isShown: false,
          },
        },
        keyrings: [
          {
            accounts: [MOCK_ADDRESS],
            metadata: {
              id: KEYRING_ID,
            },
          },
        ],
        internalAccounts: {
          accounts: {
            [KEYRING_ID]: {
              address: MOCK_ADDRESS,
              id: KEYRING_ID,
              metadata: {
                name: 'Account 1',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: [
                'personal_sign',
                'eth_sign',
                'eth_signTransaction',
                'eth_signTypedData_v1',
                'eth_signTypedData_v3',
                'eth_signTypedData_v4',
              ],
              type: 'eip155:eoa',
            },
          },
          selectedAccount: KEYRING_ID,
        },
        accounts: {
          [MOCK_ADDRESS]: {
            address: MOCK_ADDRESS,
            balance: '0x0',
            nonce: '0x0',
            code: '0x',
          },
        },
        accountsByChainId: {
          '0x5': {
            [MOCK_ADDRESS]: {
              address: MOCK_ADDRESS,
              balance: '0x0',
              nonce: '0x0',
              code: '0x',
            },
          },
        },
      },
    });
    return renderWithProvider(<WhatsNewModal onClose={mockOnClose} />, store);
  };

  describe('Whats new notification modal', () => {
    describe('Content agnostic functionality', () => {
      beforeEach(() => {
        renderModalWithNotification({
          notificationId: NOTIFICATION_SOLANA_ON_METAMASK,
        });
      });

      it('calls onClose when the modal is closed', async () => {
        const closeButton = screen.getByRole('button', { name: /close/iu });
        fireEvent.click(closeButton);

        await waitFor(() => {
          expect(mockOnClose).toHaveBeenCalled();
        });
      });
    });

    describe('Solana notification content', () => {
      describe('when the user does not have a Solana account', () => {
        beforeEach(() => {
          renderModalWithNotification({
            notificationId: NOTIFICATION_SOLANA_ON_METAMASK,
          });
        });

        it('renders Solana notification when the user does not have a Solana account', () => {
          expect(screen.getByTestId('solana-modal-body')).toBeInTheDocument();
          expect(
            screen.getByText(/Send, receive, and swap tokens/iu),
          ).toBeInTheDocument();
          expect(
            screen.getByText(/Import Solana accounts/iu),
          ).toBeInTheDocument();
          expect(
            screen.getByText(/More features coming soon/iu),
          ).toBeInTheDocument();
          expect(
            screen.getByTestId('create-solana-account-button'),
          ).toBeInTheDocument();
          expect(screen.getByTestId('not-now-button')).toBeInTheDocument();
        });

        it('opens the "Create account" modal when clicking the "Create account" button', async () => {
          const createButton = screen.getByTestId(
            'create-solana-account-button',
          );
          fireEvent.click(createButton);

          expect(
            screen.queryByTestId('whats-new-modal'),
          ).not.toBeInTheDocument();

          expect(
            screen.getByTestId('create-solana-account-modal'),
          ).toBeInTheDocument();

          // TODO: The next code should be tested in the CreateSolanaAccountModal component

          const accountNameInput = screen.getByLabelText(/account name/iu);
          fireEvent.change(accountNameInput, {
            target: { value: 'Test Account' },
          });

          const submitButton = screen.getByTestId(
            'submit-add-account-with-name',
          );
          fireEvent.click(submitButton);

          await expect(mockCreateAccount).toHaveBeenCalledWith({
            scope: MultichainNetworks.SOLANA,
            entropySource: KEYRING_ID,
            accountNameSuggestion: 'Test Account',
          });
        });

        it('closes the modal when clicking "Not Now"', async () => {
          const notNowButton = screen.getByTestId('not-now-button');
          fireEvent.click(notNowButton);

          await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalled();
          });
        });
      });

      describe('when the user has a Solana account', () => {
        beforeEach(() => {
          const store = configureStore({
            metamask: {
              ...mockState.metamask,
              announcements: {
                [NOTIFICATION_SOLANA_ON_METAMASK]: {
                  date: '2025-03-03',
                  id: NOTIFICATION_SOLANA_ON_METAMASK,
                  isShown: false,
                },
              },
              keyrings: [
                {
                  metadata: {
                    id: KEYRING_ID,
                  },
                },
              ],
              internalAccounts: {
                accounts: {
                  [MOCK_ACCOUNT_SOLANA_MAINNET.id]: MOCK_ACCOUNT_SOLANA_MAINNET,
                },
              },
            },
            activeTab: {
              origin: 'metamask',
            },
          });
          renderWithProvider(<WhatsNewModal onClose={mockOnClose} />, store);
        });

        it('renders Solana notification correctly', () => {
          expect(screen.getByTestId('solana-modal-body')).toBeInTheDocument();
          expect(
            screen.getByText(/Send, receive, and swap tokens/iu),
          ).toBeInTheDocument();
          expect(
            screen.getByText(/Import Solana accounts/iu),
          ).toBeInTheDocument();
          expect(
            screen.getByText(/More features coming soon/iu),
          ).toBeInTheDocument();
          expect(
            screen.getByTestId('view-solana-account-button'),
          ).toBeInTheDocument();
          expect(screen.getByTestId('not-now-button')).toBeInTheDocument();
        });

        it('closes the modal when clicking "View Solana account"', async () => {
          const viewSolanaAccountButton = screen.getByTestId(
            'view-solana-account-button',
          );
          fireEvent.click(viewSolanaAccountButton);

          await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalled();
          });
        });

        it('closes the modal when clicking "Not Now"', async () => {
          const notNowButton = screen.getByTestId('not-now-button');
          fireEvent.click(notNowButton);

          await waitFor(() => {
            expect(mockOnClose).toHaveBeenCalled();
          });
        });
      });
    });
  });
});
