import { fireEvent, screen } from '@testing-library/react';
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

describe('WhatsNewModal', () => {
  const mockOnClose = jest.fn();
  const mockCreateAccount = jest.fn();
  const KEYRING_ID = '01JKAF3DSGM3AB87EM9N0K41AJ';

  beforeEach(() => {
    jest.clearAllMocks();

    (useMultichainWalletSnapClient as jest.Mock).mockReturnValue({
      createAccount: mockCreateAccount,
    });
  });

  const renderModalWithNotification = ({
    notificationId,
    stateOverrides,
  }: {
    notificationId: number;
    stateOverrides?: Record<string, unknown>;
  }) => {
    const store = configureStore({
      ...stateOverrides,
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
            metadata: {
              id: KEYRING_ID,
            },
          },
        ],
      },
    });
    return renderWithProvider(<WhatsNewModal onClose={mockOnClose} />, store);
  };

  describe("What's New notification modal", () => {
    describe('Content agnostic functionality', () => {
      beforeEach(() => {
        renderModalWithNotification({
          notificationId: NOTIFICATION_SOLANA_ON_METAMASK,
        });
      });

      it('calls onClose when the modal is closed', () => {
        const closeButton = screen.getByRole('button', { name: /close/iu });
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    describe('Solana notification content', () => {
      describe('when the user does not have a Solana account', () => {
        beforeEach(() => {
          renderModalWithNotification({
            notificationId: NOTIFICATION_SOLANA_ON_METAMASK,
          });
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
            screen.getByTestId('create-solana-account-button'),
          ).toBeInTheDocument();
          expect(screen.getByTestId('not-now-button')).toBeInTheDocument();
        });

        it('calls createAccount when clicking the create account button', async () => {
          const createButton = screen.getByTestId(
            'create-solana-account-button',
          );
          fireEvent.click(createButton);

          await new Promise((resolve) => setTimeout(resolve, 500));

          expect(mockCreateAccount).toHaveBeenCalledWith({
            scope: MultichainNetworks.SOLANA,
            entropySource: KEYRING_ID,
          });
          expect(mockOnClose).toHaveBeenCalled();
        });

        it('closes the modal when clicking "Not Now"', async () => {
          const notNowButton = screen.getByTestId('not-now-button');
          fireEvent.click(notNowButton);

          await new Promise((resolve) => setTimeout(resolve, 500));

          expect(mockOnClose).toHaveBeenCalled();
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
          expect(screen.getByTestId('got-it-button')).toBeInTheDocument();
          expect(screen.getByTestId('not-now-button')).toBeInTheDocument();
        });

        it('closes the modal when clicking "Got it"', async () => {
          const gotItButton = screen.getByTestId('got-it-button');
          fireEvent.click(gotItButton);

          await new Promise((resolve) => setTimeout(resolve, 500));

          expect(mockCreateAccount).not.toHaveBeenCalled();
          expect(mockOnClose).toHaveBeenCalled();
        });

        it('closes the modal when clicking "Not Now"', async () => {
          const notNowButton = screen.getByTestId('not-now-button');
          fireEvent.click(notNowButton);

          await new Promise((resolve) => setTimeout(resolve, 500));

          expect(mockOnClose).toHaveBeenCalled();
        });
      });
    });
  });
});
