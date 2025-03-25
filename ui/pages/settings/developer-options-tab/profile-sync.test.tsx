import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { useDeleteAccountSyncingDataFromUserStorage } from '../../../hooks/identity/useAccountSyncing';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import {
  ProfileSyncDevSettings,
  useDeleteAccountSyncDataProps,
} from './profile-sync';

jest.mock('../../../hooks/identity/useAccountSyncing');

describe('ProfileSyncDevSettings', () => {
  const mockDispatchDeleteAccountSyncingData = jest.fn();

  beforeEach(() => {
    (useDeleteAccountSyncingDataFromUserStorage as jest.Mock).mockReturnValue({
      dispatchDeleteAccountSyncingData: mockDispatchDeleteAccountSyncingData,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the ProfileSyncDevSettings component', () => {
    const { getByText } = render(<ProfileSyncDevSettings />);
    expect(getByText('Profile Sync')).toBeInTheDocument();
  });

  it('calls onDelete and shows success icon when reset button is clicked', async () => {
    const { getByRole } = render(<ProfileSyncDevSettings />);
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
    const { getByText } = render(<ProfileSyncDevSettings />);

    const { title, description } = renderHookWithProviderTyped(
      () => useDeleteAccountSyncDataProps(),
      {},
    ).result.current;

    expect(getByText(title)).toBeInTheDocument();
    expect(getByText(description)).toBeInTheDocument();
  });
});
