import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { MOCK_ACCOUNT_EOA } from '../../../../test/data/mock-accounts';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../helpers/constants/routes';
import { AccountShowSrpRow } from './account-show-srp-row';

const middleware = [thunk];
const mockStore = configureMockStore(middleware);

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../app/srp-quiz-modal', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="srp-quiz-modal">
        <button onClick={onClose} data-testid="close-srp-quiz">
          Close SRP Quiz
        </button>
      </div>
    ) : null,
}));

const createMockState = (
  seedPhraseBackedUp = true,
  hdKeyrings = [
    {
      type: 'HD Key Tree',
      accounts: [MOCK_ACCOUNT_EOA.address],
      metadata: {
        id: 'mock-hd-keyring-id',
        name: 'HD Key Tree',
      },
    },
  ],
) => ({
  metamask: {
    seedPhraseBackedUp,
    keyrings: hdKeyrings,
  },
});

describe('AccountShowSrpRow', () => {
  describe('Component Rendering', () => {
    it('should render with basic props', () => {
      const state = createMockState();
      const store = mockStore(state);

      renderWithProvider(
        <AccountShowSrpRow account={MOCK_ACCOUNT_EOA} />,
        store,
      );

      expect(screen.getByText('secretRecoveryPhrase')).toBeInTheDocument();
      expect(screen.getByLabelText('next')).toBeInTheDocument();
    });

    it('should render with backup reminder when seed phrase is not backed up', () => {
      const baseState = createMockState(false);
      const state = {
        ...baseState,
        metamask: {
          ...baseState.metamask,
          firstTimeFlowType: 'create',
        },
      };
      const store = mockStore(state);
      const account = {
        ...MOCK_ACCOUNT_EOA,
        options: {
          ...MOCK_ACCOUNT_EOA.options,
          entropySource: 'mock-hd-keyring-id',
        },
      };

      renderWithProvider(<AccountShowSrpRow account={account} />, store);

      expect(screen.getByText('secretRecoveryPhrase')).toBeInTheDocument();
      expect(screen.getByText('backup')).toBeInTheDocument();
      expect(screen.getByLabelText('next')).toBeInTheDocument();
    });

    it('should not show backup reminder when seed phrase is backed up', () => {
      const state = createMockState(true);
      const store = mockStore(state);

      renderWithProvider(
        <AccountShowSrpRow account={MOCK_ACCOUNT_EOA} />,
        store,
      );

      expect(screen.getByText('secretRecoveryPhrase')).toBeInTheDocument();
      expect(screen.queryByText('backup')).not.toBeInTheDocument();
      expect(screen.getByLabelText('next')).toBeInTheDocument();
    });

    it('should not show backup reminder for non-first HD keyring', () => {
      const secondHdKeyring = {
        type: 'HD Key Tree',
        accounts: [MOCK_ACCOUNT_EOA.address],
        metadata: {
          id: 'second-hd-keyring-id',
          name: 'HD Key Tree',
        },
      };
      const state = createMockState(false, [secondHdKeyring]);
      const store = mockStore(state);

      const accountWithSecondKeyring = {
        ...MOCK_ACCOUNT_EOA,
        options: {
          entropySource: 'second-hd-keyring-id',
        },
      };

      renderWithProvider(
        <AccountShowSrpRow account={accountWithSecondKeyring} />,
        store,
      );

      expect(screen.getByText('secretRecoveryPhrase')).toBeInTheDocument();
      expect(screen.queryByText('backup')).not.toBeInTheDocument();
      expect(screen.getByLabelText('next')).toBeInTheDocument();
    });
  });

  describe('Click Functionality', () => {
    it('should navigate to backup route when clicked and seed phrase not backed up', () => {
      const baseState = createMockState(false);
      const state = {
        ...baseState,
        metamask: {
          ...baseState.metamask,
          firstTimeFlowType: 'create',
        },
      };
      const store = mockStore(state);
      const account = {
        ...MOCK_ACCOUNT_EOA,
        options: {
          ...MOCK_ACCOUNT_EOA.options,
          entropySource: 'mock-hd-keyring-id',
        },
      };

      const { history } = renderWithProvider(
        <AccountShowSrpRow account={account} />,
        store,
      );
      const mockPush = jest.spyOn(history, 'push');

      const row = screen.getByText('secretRecoveryPhrase').closest('div');
      if (row) {
        fireEvent.click(row);
      }

      expect(mockPush).toHaveBeenCalledWith(
        `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true`,
      );
    });

    it('should open SRP quiz modal when clicked and seed phrase is backed up', () => {
      const state = createMockState(true);
      const store = mockStore(state);

      const { history } = renderWithProvider(
        <AccountShowSrpRow account={MOCK_ACCOUNT_EOA} />,
        store,
      );
      const mockPush = jest.spyOn(history, 'push');

      const row = screen.getByText('secretRecoveryPhrase').closest('div');
      if (row) {
        fireEvent.click(row);
      }

      expect(screen.getByTestId('srp-quiz-modal')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing keyrings gracefully', () => {
      const state = createMockState(true, []);
      const store = mockStore(state);

      renderWithProvider(
        <AccountShowSrpRow account={MOCK_ACCOUNT_EOA} />,
        store,
      );

      expect(screen.getByText('secretRecoveryPhrase')).toBeInTheDocument();
      expect(screen.queryByText('backup')).not.toBeInTheDocument();
    });

    it('should handle non-HD keyring types gracefully', () => {
      const nonHdKeyring = {
        type: 'Snap Keyring',
        accounts: [MOCK_ACCOUNT_EOA.address],
        metadata: {
          id: 'snap-keyring-id',
          name: 'Snap Keyring',
        },
      };
      const state = createMockState(false, [nonHdKeyring]);
      const store = mockStore(state);

      const accountWithSnapKeyring = {
        ...MOCK_ACCOUNT_EOA,
        options: {
          entropySource: 'snap-keyring-id',
        },
      };

      renderWithProvider(
        <AccountShowSrpRow account={accountWithSnapKeyring} />,
        store,
      );

      expect(screen.getByText('secretRecoveryPhrase')).toBeInTheDocument();
      expect(screen.queryByText('backup')).not.toBeInTheDocument();
    });
  });
});
