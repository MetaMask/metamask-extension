import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { captureException } from '../../../../shared/lib/sentry';
import * as exportUtils from '../../../helpers/utils/export-utils';
import { backupUserData } from '../../../store/actions';
import { ExportYourDataItem } from './export-your-data-item';

const mockTrackEvent = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../../../helpers/utils/export-utils', () => ({
  ...jest.requireActual('../../../helpers/utils/export-utils'),
  exportAsFile: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  backupUserData: jest.fn(),
}));

jest.mock('../../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../../shared/lib/sentry'),
  captureException: jest.fn(),
}));

const mockExportAsFile = exportUtils.exportAsFile as jest.Mock;
const mockBackupUserData = backupUserData as jest.MockedFunction<
  typeof backupUserData
>;
const mockCaptureException = captureException as jest.MockedFunction<
  typeof captureException
>;

describe('ExportYourDataItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackEvent.mockClear();
  });

  it('renders the button with correct text', () => {
    renderWithProvider(<ExportYourDataItem />, mockStore);

    expect(
      screen.getByTestId('privacy-tab-export-your-data-button'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.exportYourData.message),
    ).toBeInTheDocument();
  });

  it('opens the export modal when the row is clicked', () => {
    renderWithProvider(<ExportYourDataItem />, mockStore);

    fireEvent.click(screen.getByTestId('privacy-tab-export-your-data-button'));

    expect(
      screen.getByText(messages.exportYourDataDescription.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('export-your-data-modal-download-button'),
    ).toBeInTheDocument();
  });

  it('backs up and exports the user data when Download is clicked in the modal', async () => {
    mockBackupUserData.mockResolvedValue({
      fileName: 'MetaMaskUserData.json',
      data: '{"accounts":[]}',
    } as never);
    mockExportAsFile.mockResolvedValue(undefined);

    renderWithProvider(<ExportYourDataItem />, mockStore);

    fireEvent.click(screen.getByTestId('privacy-tab-export-your-data-button'));
    fireEvent.click(
      screen.getByTestId('export-your-data-modal-download-button'),
    );

    await waitFor(() => {
      expect(mockBackupUserData).toHaveBeenCalled();
    });

    expect(mockExportAsFile).toHaveBeenCalledWith(
      'MetaMaskUserData.json',
      '{"accounts":[]}',
      exportUtils.ExportableContentType.JSON,
    );
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'User Data Exported',
        properties: expect.objectContaining({
          category: 'Backup',
        }),
      }),
    );
  });

  it('supports filename responses from the typed action', async () => {
    mockBackupUserData.mockResolvedValue({
      filename: 'MetaMaskUserData.typed.json',
      data: '{"accounts":[]}',
    });
    mockExportAsFile.mockResolvedValue(undefined);

    renderWithProvider(<ExportYourDataItem />, mockStore);

    fireEvent.click(screen.getByTestId('privacy-tab-export-your-data-button'));
    fireEvent.click(
      screen.getByTestId('export-your-data-modal-download-button'),
    );

    await waitFor(() => {
      expect(mockExportAsFile).toHaveBeenCalledWith(
        'MetaMaskUserData.typed.json',
        '{"accounts":[]}',
        exportUtils.ExportableContentType.JSON,
      );
    });
  });

  it('closes the modal and captures the error when backup fails', async () => {
    mockBackupUserData.mockRejectedValue(new Error('backup failed'));

    renderWithProvider(<ExportYourDataItem />, mockStore);

    fireEvent.click(screen.getByTestId('privacy-tab-export-your-data-button'));
    fireEvent.click(
      screen.getByTestId('export-your-data-modal-download-button'),
    );

    await waitFor(() => {
      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'backup failed' }),
      );
    });

    expect(
      screen.queryByTestId('export-your-data-modal-download-button'),
    ).not.toBeInTheDocument();
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});
