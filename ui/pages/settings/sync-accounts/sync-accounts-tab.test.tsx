import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { SETTINGS_ROUTE } from '../../../helpers/constants/routes';
import { submitRequestToBackground } from '../../../store/background-connection';
import SyncAccountsTab from './sync-accounts-tab';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./sync-accounts-settings', () => () => (
  <div data-testid="sync-accounts-settings" />
));

const renderTab = () => renderWithProvider(<SyncAccountsTab />);

describe('SyncAccountsTab', () => {
  it('renders without throwing', () => {
    expect(() => renderTab()).not.toThrow();
  });

  it('renders the sync accounts settings', () => {
    renderTab();

    expect(
      screen.getByTestId('parent-selector-sync-accounts-page'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('sync-accounts-settings')).toBeInTheDocument();
  });

  it('renders the back button', () => {
    renderTab();

    expect(screen.getByTestId('sync-accounts-back-button')).toBeInTheDocument();
  });

  it('cancels the QR sync session before navigating back to settings', async () => {
    renderTab();

    fireEvent.click(screen.getByTestId('sync-accounts-back-button'));

    expect(submitRequestToBackground).toHaveBeenCalledWith(
      'QrSyncController:cancelSync',
      [],
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(SETTINGS_ROUTE, {
        replace: true,
      });
    });
  });
});
