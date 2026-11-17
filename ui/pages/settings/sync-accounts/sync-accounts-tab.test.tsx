import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { SETTINGS_ROUTE } from '../../../helpers/constants/routes';
import { submitRequestToBackground } from '../../../store/background-connection';
import { QR_SYNC_PHASES } from '../../../../shared/constants/qr-sync';
import SyncAccountsTab from './sync-accounts-tab';

const mockNavigate = jest.fn();
let mockQrSyncPhase = QR_SYNC_PHASES.IDLE;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => mockQrSyncPhase,
}));

jest.mock('./sync-accounts-settings', () => () => (
  <div data-testid="sync-accounts-settings" />
));

const renderTab = () => renderWithProvider(<SyncAccountsTab />);

describe('SyncAccountsTab', () => {
  beforeEach(() => {
    mockQrSyncPhase = QR_SYNC_PHASES.IDLE;
  });

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
    expect(screen.getByTestId('sync-accounts-header')).toHaveClass(
      'mm-box--justify-content-flex-start',
    );
  });

  it('hides the back button after the sync completes', () => {
    mockQrSyncPhase = QR_SYNC_PHASES.COMPLETED;
    renderTab();

    expect(
      screen.queryByTestId('sync-accounts-back-button'),
    ).not.toBeInTheDocument();
  });

  it('hides the back button after the import is submitted', () => {
    mockQrSyncPhase = QR_SYNC_PHASES.AWAITING_SYNC_COMPLETION;
    renderTab();

    expect(
      screen.queryByTestId('sync-accounts-back-button'),
    ).not.toBeInTheDocument();
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
