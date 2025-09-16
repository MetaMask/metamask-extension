import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProviderAndHistory } from '../../../../test/jest';
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

const renderWithHistory = (
  component: React.ReactElement,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
) => {
  const store = mockStore(state);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const history: any = createMemoryHistory();

  // Add push method spy for navigation testing
  history.push = jest.fn();
  const mockPush = jest.spyOn(history, 'push');

  return {
    ...renderWithProviderAndHistory(component, store, history),
    mockPush,
  };
};

describe('AccountShowSrpRow', () => {
  describe('Component Rendering', () => {
    it('should render with basic props', () => {
      const state = createMockState();

      renderWithHistory(
        <AccountShowSrpRow account={MOCK_ACCOUNT_EOA} />,
        state,
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
      const account = {
        ...MOCK_ACCOUNT_EOA,
        options: {
          ...MOCK_ACCOUNT_EOA.options,
          entropySource: 'mock-hd-keyring-id',
        },
      };

      renderWithHistory(<AccountShowSrpRow account={account} />, state);

      expect(screen.getByText('secretRecoveryPhrase')).toBeInTheDocument();
      expect(screen.getByText('backup')).toBeInTheDocument();
      expect(screen.getByLabelText('next')).toBeInTheDocument();
    });

    it('should not show backup reminder when seed phrase is backed up', () => {
      const state = createMockState(true);

      renderWithHistory(
        <AccountShowSrpRow account={MOCK_ACCOUNT_EOA} />,
        state,
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

      const accountWithSecondKeyring = {
        ...MOCK_ACCOUNT_EOA,
        options: {
          entropySource: 'second-hd-keyring-id',
        },
      };

      renderWithHistory(
        <AccountShowSrpRow account={accountWithSecondKeyring} />,
        state,
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
      const account = {
        ...MOCK_ACCOUNT_EOA,
        options: {
          ...MOCK_ACCOUNT_EOA.options,
          entropySource: 'mock-hd-keyring-id',
        },
      };

      const { mockPush } = renderWithHistory(
        <AccountShowSrpRow account={account} />,
        state,
      );

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

      const { mockPush } = renderWithHistory(
        <AccountShowSrpRow account={MOCK_ACCOUNT_EOA} />,
        state,
      );

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

      renderWithHistory(
        <AccountShowSrpRow account={MOCK_ACCOUNT_EOA} />,
        state,
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

      const accountWithSnapKeyring = {
        ...MOCK_ACCOUNT_EOA,
        options: {
          entropySource: 'snap-keyring-id',
        },
      };

      renderWithHistory(
        <AccountShowSrpRow account={accountWithSnapKeyring} />,
        state,
      );

      expect(screen.getByText('secretRecoveryPhrase')).toBeInTheDocument();
      expect(screen.queryByText('backup')).not.toBeInTheDocument();
    });
  });
});
