import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import {
  MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  REVEAL_SEED_ROUTE,
} from '../../../helpers/constants/routes';
import { MultichainSrpBackup } from './multichain-srp-backup';

const srpBackupRowTestId = 'multichain-srp-backup';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

describe('MultichainSrpBackup', () => {
  const renderComponent = (props = {}, pathname = '/') => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    return renderWithProvider(
      <MultichainSrpBackup {...props} />,
      store,
      pathname,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    renderComponent();

    expect(
      screen.getByText(messages.secretRecoveryPhrase.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.srpListStateBackedUp.message),
    ).toBeInTheDocument();

    const buttonElement = screen.getByTestId(srpBackupRowTestId);
    expect(buttonElement).toHaveClass('multichain-srp-backup');
    expect(
      screen.getByRole('button', {
        name: messages.secretRecoveryPhrase.message,
      }),
    ).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    renderComponent({ className: 'custom-class' });

    const buttonElement = screen.getByTestId(srpBackupRowTestId);
    expect(buttonElement).toHaveClass('multichain-srp-backup');
    expect(buttonElement).toHaveClass('custom-class');
  });

  it('displays "Reveal" text when shouldShowBackupReminder is false', () => {
    renderComponent({ shouldShowBackupReminder: false });

    expect(
      screen.getByText(messages.srpListStateBackedUp.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(messages.accountDetailsSrpBackUpMessage.message),
    ).not.toBeInTheDocument();
  });

  it('navigates to SRP review route when shouldShowBackupReminder is true', () => {
    renderComponent({ shouldShowBackupReminder: true });

    fireEvent.click(screen.getByTestId(srpBackupRowTestId));

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true`,
    );
  });

  it('forwards the configured return route to the SRP review route', () => {
    const accountDetailsPage = `${MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE}?accountGroupId=entropy%3A01JKAF%2F0`;
    renderComponent({
      shouldShowBackupReminder: true,
      backupFlowReturnRoute: accountDetailsPage,
    });

    fireEvent.click(screen.getByTestId(srpBackupRowTestId));

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true&previousPage=${encodeURIComponent(
        accountDetailsPage,
      )}`,
    );
  });

  it('navigates to reveal seed page when shouldShowBackupReminder is false and keyringId is provided', () => {
    renderComponent({
      shouldShowBackupReminder: false,
      keyringId: 'test-keyring-id',
    });

    fireEvent.click(screen.getByTestId(srpBackupRowTestId));

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${REVEAL_SEED_ROUTE}/test-keyring-id`,
    );
  });

  it('navigates to base reveal seed route when shouldShowBackupReminder is false and keyringId is missing', () => {
    renderComponent({
      shouldShowBackupReminder: false,
    });

    fireEvent.click(screen.getByTestId(srpBackupRowTestId));

    expect(mockUseNavigate).toHaveBeenCalledWith(REVEAL_SEED_ROUTE);
  });
});
