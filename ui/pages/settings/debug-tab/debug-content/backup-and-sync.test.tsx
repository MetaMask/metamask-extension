import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDeleteAccountSyncingDataFromUserStorage } from '../../../../hooks/identity/useAccountSyncing';
import { renderHookWithProviderTyped } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { performSignOut } from '../../../../store/actions';
import {
  BackupAndSyncDevSettings,
  useClearAuthSessionProps,
  useDeleteAccountSyncDataProps,
} from './backup-and-sync';

jest.mock('../../../../hooks/identity/useAccountSyncing');
jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  performSignOut: jest.fn(() => async () => undefined),
}));

const mockDispatch = jest.fn(async (action: unknown) => {
  if (typeof action === 'function') {
    return action();
  }
  return action;
});

jest.mock('../../../../store/hooks', () => ({
  useDispatch: () => mockDispatch,
}));

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
    const { container } = render(<BackupAndSyncDevSettings />);
    expect(container).toMatchSnapshot();
  });

  it('calls onDelete and shows success icon when reset button is clicked', async () => {
    const { getByRole } = render(<BackupAndSyncDevSettings />);
    const resetButton = getByRole('button', {
      name: messages.reset.message,
    });

    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(mockDispatchDeleteAccountSyncingData).toHaveBeenCalled();

      const iconElement = document.querySelector(
        '.settings-page-developer-options__icon-check',
      );
      expect(iconElement).toBeVisible();
    });
  });

  it('clears the auth session from developer options', async () => {
    const { getByTestId } = render(<BackupAndSyncDevSettings />);
    fireEvent.click(getByTestId('identity-dev-clear-auth-session-button'));

    await waitFor(() => {
      expect(performSignOut).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalled();
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

  it('exposes identity env in the clear-session copy', () => {
    const { result } = renderHookWithProviderTyped(
      () => useClearAuthSessionProps(),
      {},
    );

    expect(result.current).toMatchInlineSnapshot(`
      {
        "buttonLabel": "Clear auth session",
        "deleteSuccessful": false,
        "description": "Current identity env is prd (MM_DEV_API_ENV=prod). Clear the persisted Profile Sync session after flipping MM_DEV_API_ENV, then unlock so a matching token can be minted.",
        "onDelete": [Function],
        "testId": "identity-dev-clear-auth-session-button",
        "title": "Identity auth session",
      }
    `);
  });
});
