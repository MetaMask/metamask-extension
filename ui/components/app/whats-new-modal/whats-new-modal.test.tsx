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

    it('opens the create solana account modal and handles account creation', async () => {
      const createButton = screen.getByTestId('create-solana-account-button');
      fireEvent.click(createButton);

      expect(screen.queryByTestId('whats-new-modal')).not.toBeInTheDocument();

      expect(
        screen.getByTestId('create-solana-account-modal'),
      ).toBeInTheDocument();

      const accountNameInput = screen.getByLabelText(/account name/iu);
      fireEvent.change(accountNameInput, { target: { value: 'Test Account' } });

      const submitButton = screen.getByTestId('submit-add-account-with-name');
      fireEvent.click(submitButton);

      await expect(mockCreateAccount).toHaveBeenCalledWith({
        scope: MultichainNetworks.SOLANA,
        entropySource: KEYRING_ID,
        accountNameSuggestion: 'Test Account',
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
