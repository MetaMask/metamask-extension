import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../helpers/constants/routes';
import { MultichainSrpBackup } from './multichain-srp-backup';

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

const srpBackupRowTestId = 'multichain-srp-backup';
const srpQuizHeaderTestId = 'srp-quiz-header';

describe('MultichainSrpBackup', () => {
  const renderComponent = (props = {}) => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
    });

    return renderWithProvider(<MultichainSrpBackup {...props} />, store);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    renderComponent();

    expect(screen.getByText('Secret Recovery Phrase')).toBeInTheDocument();
    expect(screen.getByText('Back up')).toBeInTheDocument();

    const buttonElement = screen.getByTestId(srpBackupRowTestId);
    expect(buttonElement).toHaveClass('multichain-srp-backup');
  });

  it('applies custom className when provided', () => {
    renderComponent({ className: 'custom-class' });

    const buttonElement = screen.getByTestId(srpBackupRowTestId);
    expect(buttonElement).toHaveClass('multichain-srp-backup');
    expect(buttonElement).toHaveClass('custom-class');
  });

  it('displays "Backup" text with error color when shouldShowBackupReminder is true', () => {
    renderComponent({ shouldShowBackupReminder: true });

    const backupText = screen.getByText('Backup');

    expect(backupText).toBeInTheDocument();
    expect(backupText).toHaveClass('mm-box--color-error-default');
    expect(screen.queryByText('Back up')).not.toBeInTheDocument();
  });

  it('displays "Back up" text when shouldShowBackupReminder is false', () => {
    renderComponent({ shouldShowBackupReminder: false });

    expect(screen.getByText('Back up')).toBeInTheDocument();
    expect(screen.queryByText('Backup')).not.toBeInTheDocument();
  });

  it('navigates to SRP review route when shouldShowBackupReminder is true', () => {
    renderComponent({ shouldShowBackupReminder: true });

    fireEvent.click(screen.getByTestId(srpBackupRowTestId));

    expect(mockHistoryPush).toHaveBeenCalledWith(
      `${ONBOARDING_REVIEW_SRP_ROUTE}/?isFromReminder=true`,
    );
  });

  it('opens SRP quiz modal when shouldShowBackupReminder is false', async () => {
    renderComponent({
      shouldShowBackupReminder: false,
      keyringId: 'test-keyring-id',
    });

    fireEvent.click(screen.getByTestId(srpBackupRowTestId));

    await waitFor(() => {
      expect(screen.getByText('Security quiz')).toBeInTheDocument();
    });

    expect(mockHistoryPush).not.toHaveBeenCalled();
  });

  it('closes SRP quiz modal when close button is clicked', async () => {
    renderComponent({
      shouldShowBackupReminder: false,
      keyringId: 'test-keyring-id',
    });

    fireEvent.click(screen.getByTestId(srpBackupRowTestId));
    await waitFor(() => {
      expect(screen.getByText('Security quiz')).toBeInTheDocument();
    });

    const closeButton = screen
      .getByTestId(srpQuizHeaderTestId)
      .querySelector('button');

    if (closeButton) {
      fireEvent.click(closeButton);
    } else {
      throw new Error('Close button not found in the modal header');
    }

    await waitFor(() => {
      expect(screen.queryByText('Security quiz')).not.toBeInTheDocument();
    });
  });
});
