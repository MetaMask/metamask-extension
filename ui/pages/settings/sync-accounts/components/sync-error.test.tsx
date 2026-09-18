import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
// eslint-disable-next-line import-x/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import { QrSyncErrorCodes } from '../../../../../shared/constants/qr-sync';
import SyncError from './sync-error';

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
  const onRetry = jest.fn();
  const onCancel = jest.fn();
  const store = createMockStore(qrSyncError);
  renderWithProvider(
    <SyncError onRetry={onRetry} onCancel={onCancel} />,
    store,
  );

  return { onRetry, onCancel };
};

describe('SyncError', () => {
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

  it('calls onRetry when the try again button is clicked', () => {
    const { onRetry } = renderSyncError();

    fireEvent.click(screen.getByText(messages.add_device_try_again.message));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the cancel button is clicked', () => {
    const { onCancel } = renderSyncError();

    fireEvent.click(screen.getByText(messages.cancel.message));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
