import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import { QrSyncErrorCodes } from '../../../../../shared/constants/qr-sync';
import { submitRequestToBackground } from '../../../../store/background-connection';
import SyncError from './sync-error';

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

type QrSyncError = {
  code: (typeof QrSyncErrorCodes)[keyof typeof QrSyncErrorCodes];
  message: string;
};

const createMockStore = (qrSyncError: QrSyncError | null = null) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      qrSyncError,
    },
  });

const renderSyncError = (qrSyncError: QrSyncError | null = null) => {
  const store = createMockStore(qrSyncError);
  renderWithProvider(<SyncError />, store);
};

describe('SyncError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
  });

  it('renders the title and both action buttons', () => {
    renderSyncError();

    expect(
      screen.getByText(messages.add_device_error_title.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.add_device_try_again.message),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.cancel.message)).toBeInTheDocument();
  });

  it('falls back to the generic message when there is no error', () => {
    renderSyncError(null);

    expect(
      screen.getByText(messages.add_device_error_generic.message),
    ).toBeInTheDocument();
  });

  it('creates a new session when the try again button is clicked', async () => {
    renderSyncError();

    fireEvent.click(screen.getByText(messages.add_device_try_again.message));

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'messengerCall',
        ['QrSyncController:createSession', []],
      );
    });
  });

  it('cancels the sync session when the cancel button is clicked', async () => {
    renderSyncError();

    fireEvent.click(screen.getByText(messages.cancel.message));

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'messengerCall',
        ['QrSyncController:cancelSync', []],
      );
    });
  });
});
