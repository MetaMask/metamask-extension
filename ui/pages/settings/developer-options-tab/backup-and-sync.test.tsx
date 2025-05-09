import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDeleteAccountSyncingDataFromUserStorage } from '../../../hooks/identity/useAccountSyncing';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import {
  BackupAndSyncDevSettings,
  useDeleteAccountSyncDataProps,
} from './backup-and-sync';

jest.mock('../../../hooks/identity/useAccountSyncing');

describe('BackupAndSyncDevSettings', () => {
  const mockDispatchDeleteAccountSyncingData = jest.fn();

  beforeEach(() => {
    (useDeleteAccountSyncingDataFromUserStorage as jest.Mock).mockReturnValue({
      dispatchDeleteAccountSyncingData: mockDispatchDeleteAccountSyncingData,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the BackupAndSyncDevSettings component', () => {
    const { getByText } = render(<BackupAndSyncDevSettings />);
    expect(getByText('Backup and sync')).toBeInTheDocument();
  });

  it('calls onDelete and shows success icon when reset button is clicked', async () => {
    const { getByRole } = render(<BackupAndSyncDevSettings />);
    const resetButton = getByRole('button', { name: 'Reset' });

    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(mockDispatchDeleteAccountSyncingData).toHaveBeenCalled();

      const iconElement = document.querySelector(
        '.settings-page-developer-options__icon-check',
      );
      expect(iconElement).toBeVisible();
    });
  });

  it('displays the correct title and description', () => {
    const { getByText } = render(<BackupAndSyncDevSettings />);

    const { title, description } = renderHookWithProviderTyped(
      () => useDeleteAccountSyncDataProps(),
      {},
    ).result.current;

    expect(getByText(title)).toBeInTheDocument();
    expect(getByText(description)).toBeInTheDocument();
  });
});
