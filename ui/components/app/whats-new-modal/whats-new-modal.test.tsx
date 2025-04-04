import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { NOTIFICATION_SOLANA_ON_METAMASK } from '../../../../shared/notifications';
import { useMultichainWalletSnapClient } from '../../../hooks/accounts/useMultichainWalletSnapClient';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
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

  const renderModalWithNotification = (notificationId: number) => {
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
            metadata: {
              id: KEYRING_ID,
            },
          },
        ],
      },
    });
    return renderWithProvider(<WhatsNewModal onClose={mockOnClose} />, store);
  };

  describe('Whats new notification modal', () => {
    beforeEach(() => {
      renderModalWithNotification(NOTIFICATION_SOLANA_ON_METAMASK);
    });

    it('calls onClose when the modal is closed', () => {
      const closeButton = screen.getByRole('button', { name: /close/iu });
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('renders Solana notification content correctly', () => {
      expect(screen.getByTestId('solana-modal-body')).toBeInTheDocument();
      expect(
        screen.getByText(/Send, receive, and swap tokens/iu),
      ).toBeInTheDocument();
      expect(screen.getByText(/Import Solana accounts/iu)).toBeInTheDocument();
      expect(
        screen.getByText(/More features coming soon/iu),
      ).toBeInTheDocument();
    });

    it('calls createAccount when clicking the create account button', async () => {
      const createButton = screen.getByTestId('create-solana-account-button');
      fireEvent.click(createButton);

      expect(mockCreateAccount).toHaveBeenCalledWith({
        scope: MultichainNetworks.SOLANA,
        entropySource: KEYRING_ID,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes the modal when clicking "Not Now"', () => {
      const notNowButton = screen.getByTestId('not-now-button');
      fireEvent.click(notNowButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
