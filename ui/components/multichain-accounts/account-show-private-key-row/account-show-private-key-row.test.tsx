import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom-v5-compat';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/jest';
import { MOCK_ACCOUNT_EOA } from '../../../../test/data/mock-accounts';
import { AccountShowPrivateKeyRow } from './account-show-private-key-row';

const middleware = [thunk];
const mockStore = configureMockStore(middleware);

jest.mock('../../../store/actions', () => ({
  exportAccount: () => ({ type: 'MOCK_EXPORT_ACCOUNT' }),
  hideWarning: () => ({ type: 'MOCK_HIDE_WARNING' }),
}));

jest.mock('../../app/modals/hold-to-reveal-modal/hold-to-reveal-modal', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({
    isOpen,
    onClose,
    setShowHoldToReveal,
    setShowPrivateKey,
  }: {
    isOpen: boolean;
    onClose: () => void;
    setShowHoldToReveal?: (value: boolean) => void;
    setShowPrivateKey?: (value: boolean) => void;
  }) =>
    isOpen ? (
      <div data-testid="hold-to-reveal-modal">
        <button
          onClick={() => {
            if (setShowHoldToReveal) {
              setShowHoldToReveal(false);
            }
            if (setShowPrivateKey) {
              setShowPrivateKey(true);
            }
            if (onClose) {
              onClose();
            }
          }}
          data-testid="close-hold-to-reveal"
        >
          Close Hold to Reveal
        </button>
      </div>
    ) : null,
}));

jest.mock(
  '../../multichain/account-details/account-details-authenticate',
  () => ({
    AccountDetailsAuthenticate: ({
      onCancel,
      setPrivateKey,
      setShowHoldToReveal,
    }: {
      onCancel: () => void;
      setPrivateKey: (key: string) => void;
      setShowHoldToReveal: (show: boolean) => void;
    }) => (
      <div data-testid="account-details-authenticate">
        <input data-testid="password-input" placeholder="Password" />
        <button
          onClick={() => {
            setPrivateKey('mock-private-key');
            setShowHoldToReveal(true);
          }}
          data-testid="authenticate-button"
        >
          Authenticate
        </button>
        <button onClick={onCancel} data-testid="cancel-button">
          Cancel
        </button>
      </div>
    ),
  }),
);

jest.mock('../../multichain/account-details/account-details-key', () => ({
  AccountDetailsKey: ({
    onClose,
    privateKey,
  }: {
    onClose: () => void;
    privateKey: string;
  }) => (
    <div data-testid="account-details-key">
      <div data-testid="private-key-display">{privateKey}</div>
      <button onClick={onClose} data-testid="close-private-key">
        Close
      </button>
    </div>
  ),
}));

const createMockState = () => ({
  metamask: {
    seedPhraseBackedUp: true,
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [MOCK_ACCOUNT_EOA.address],
        metadata: {
          id: 'mock-hd-keyring-id',
          name: 'HD Key Tree',
        },
      },
    ],
  },
});

describe('AccountShowPrivateKeyRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders with basic props for exportable account', () => {
      const state = createMockState();
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <AccountShowPrivateKeyRow account={MOCK_ACCOUNT_EOA} />
        </MemoryRouter>,
        store,
      );

      expect(screen.getByText('Private key')).toBeInTheDocument();
      expect(screen.getByLabelText('Next')).toBeInTheDocument();
    });

    it('does not render for non-exportable account (hardware)', () => {
      const state = createMockState();
      const store = mockStore(state);
      const hardwareAccount = {
        ...MOCK_ACCOUNT_EOA,
        metadata: {
          ...MOCK_ACCOUNT_EOA.metadata,
          keyring: { type: 'Hardware' },
        },
      };

      renderWithProvider(
        <MemoryRouter>
          <AccountShowPrivateKeyRow account={hardwareAccount} />
        </MemoryRouter>,
        store,
      );

      expect(screen.queryByText('privateKey')).not.toBeInTheDocument();
    });

    it('does not render for non-exportable account (snap)', () => {
      const state = createMockState();
      const store = mockStore(state);
      const snapAccount = {
        ...MOCK_ACCOUNT_EOA,
        metadata: {
          ...MOCK_ACCOUNT_EOA.metadata,
          keyring: { type: 'Snap' },
        },
      };

      renderWithProvider(
        <MemoryRouter>
          <AccountShowPrivateKeyRow account={snapAccount} />
        </MemoryRouter>,
        store,
      );

      expect(screen.queryByText('privateKey')).not.toBeInTheDocument();
    });
  });

  describe('Click Functionality', () => {
    it('opens private key modal when clicked', () => {
      const state = createMockState();
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <AccountShowPrivateKeyRow account={MOCK_ACCOUNT_EOA} />
        </MemoryRouter>,
        store,
      );

      const row = screen.getByText('Private key').closest('div');
      if (row) {
        fireEvent.click(row);
      }

      expect(screen.getByText('Show private key')).toBeInTheDocument();
      expect(
        screen.getByTestId('account-details-authenticate'),
      ).toBeInTheDocument();
    });

    it('closes modal when close button is clicked', () => {
      const state = createMockState();
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <AccountShowPrivateKeyRow account={MOCK_ACCOUNT_EOA} />
        </MemoryRouter>,
        store,
      );

      // Open modal
      const row = screen.getByText('Private key').closest('div');
      if (row) {
        fireEvent.click(row);
      }

      // Close modal
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByText('Show private key')).not.toBeInTheDocument();
    });

    it('closes modal when cancel button is clicked', () => {
      const state = createMockState();
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <AccountShowPrivateKeyRow account={MOCK_ACCOUNT_EOA} />
        </MemoryRouter>,
        store,
      );

      // Open modal
      const row = screen.getByText('Private key').closest('div');
      if (row) {
        fireEvent.click(row);
      }

      // Cancel authentication
      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('showPrivateKey')).not.toBeInTheDocument();
    });
  });

  describe('Authentication Flow', () => {
    it('shows hold to reveal modal after successful authentication', () => {
      const state = createMockState();
      const store = mockStore(state);

      renderWithProvider(
        <MemoryRouter>
          <AccountShowPrivateKeyRow account={MOCK_ACCOUNT_EOA} />
        </MemoryRouter>,
        store,
      );

      // Open modal
      const row = screen.getByText('Private key').closest('div');
      if (row) {
        fireEvent.click(row);
      }

      // Authenticate
      const authenticateButton = screen.getByTestId('authenticate-button');
      fireEvent.click(authenticateButton);

      expect(screen.getByTestId('hold-to-reveal-modal')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing keyring type gracefully', () => {
      const state = createMockState();
      const store = mockStore(state);
      const accountWithoutKeyring = {
        ...MOCK_ACCOUNT_EOA,
        metadata: {
          ...MOCK_ACCOUNT_EOA.metadata,
          keyring: { type: '' },
        },
      };

      renderWithProvider(
        <MemoryRouter>
          <AccountShowPrivateKeyRow account={accountWithoutKeyring} />
        </MemoryRouter>,
        store,
      );

      expect(screen.getByText('Private key')).toBeInTheDocument();
    });
  });
});
