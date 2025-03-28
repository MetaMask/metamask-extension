import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { NOTIFICATION_SOLANA_ON_METAMASK } from '../../../../shared/notifications';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/jest';
import { useMultichainWalletSnapClient } from '../../../hooks/accounts/useMultichainWalletSnapClient';
import { hasCreatedSolanaAccount } from '../../../selectors/accounts';
import configureStore from '../../../store/store';
import WhatsNewModal from './whats-new-modal';

jest.mock('../../../hooks/accounts/useMultichainWalletSnapClient', () => ({
  useMultichainWalletSnapClient: jest.fn(),
  WalletClientType: {
    Solana: 'solana',
  },
}));

jest.mock('../../../selectors', () => ({
  ...jest.requireActual('../../../selectors'),
  hasSolanaAccounts: jest.fn(),
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

    describe('when user does not have a Solana account', () => {
      beforeEach(() => {
        (hasCreatedSolanaAccount as jest.Mock).mockReturnValue(false);
      });

      it('shows "Create Solana account" button and creates account when clicked', async () => {
        const createButton = screen.getByTestId('create-solana-account-button');
        expect(createButton).toBeInTheDocument();
        expect(createButton).toHaveTextContent(/create solana account/iu);

        fireEvent.click(createButton);

        expect(mockCreateAccount).toHaveBeenCalledWith(
          MultichainNetworks.SOLANA,
          KEYRING_ID,
        );
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    describe('when user has a Solana account', () => {
      beforeEach(() => {
        (hasCreatedSolanaAccount as jest.Mock).mockReturnValue(true);
      });

      it('shows "Got it" button and closes modal when clicked', () => {
        const gotItButton = screen.getByTestId('got-it-button');
        expect(gotItButton).toBeInTheDocument();
        expect(gotItButton).toHaveTextContent(/got it/iu);

        fireEvent.click(gotItButton);

        expect(mockCreateAccount).not.toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('closes the modal when clicking "Not Now"', () => {
      const notNowButton = screen.getByTestId('not-now-button');
      fireEvent.click(notNowButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
