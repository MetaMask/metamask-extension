import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import { submitRequestToBackground } from '../../../../store/background-connection';
import SyncError from './sync-error';

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

const createMockStore = (error: unknown = null) =>
  configureMockStore([thunk])({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      error,
    },
  });

describe('SyncError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the error title and the generic description when no error message is present', () => {
    renderWithProvider(<SyncError />, createMockStore());

    expect(
      screen.getByText(messages.add_device_error_title.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.add_device_error_desc.message),
    ).toBeInTheDocument();
  });

  it('renders the controller error message when one is present', () => {
    renderWithProvider(
      <SyncError />,
      createMockStore({ code: 'SYNC_FAILED', message: 'The sync failed.' }),
    );

    expect(screen.getByText('The sync failed.')).toBeInTheDocument();
  });

  it('requests a new session when the restart button is clicked', () => {
    renderWithProvider(<SyncError />, createMockStore());

    fireEvent.click(screen.getByText(messages.start_with_new_qr_code.message));

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith('messengerCall', [
      'QrSyncController:createSession',
      [],
    ]);
  });
});
