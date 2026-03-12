import { fireEvent, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as exportUtils from '../../../helpers/utils/export-utils';
import { DownloadStateLogsItem } from './download-state-logs-item';

jest.mock('../../../helpers/utils/export-utils', () => ({
  ...jest.requireActual('../../../helpers/utils/export-utils'),
  exportAsFile: jest.fn(),
}));

const mockExportAsFile = exportUtils.exportAsFile as jest.Mock;

type LogStateCallback = (err: Error | null, result?: string) => void;

describe('DownloadStateLogsItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);
  let mockLogStateString: jest.Mock<void, [LogStateCallback]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogStateString = jest.fn();
    (globalThis as Record<string, unknown>).logStateString = mockLogStateString;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).logStateString;
  });

  it('renders the button with correct text', () => {
    renderWithProvider(<DownloadStateLogsItem />, mockStore);

    expect(
      screen.getByTestId('download-state-logs-button'),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.downloadStateLogs.message)).toBeInTheDocument();
  });

  it('opens modal when button is clicked', async () => {
    renderWithProvider(<DownloadStateLogsItem />, mockStore);

    fireEvent.click(screen.getByTestId('download-state-logs-button'));

    await waitFor(() => {
      expect(
        screen.getByText(messages.stateLogsModalDescription.message),
      ).toBeInTheDocument();
    });
  });

  it('calls logStateString and exportAsFile on download', async () => {
    mockLogStateString.mockImplementation((callback) => {
      callback(null, '{"state": "data"}');
    });
    mockExportAsFile.mockResolvedValue(undefined);

    renderWithProvider(<DownloadStateLogsItem />, mockStore);

    fireEvent.click(screen.getByTestId('download-state-logs-button'));

    await waitFor(() => {
      expect(screen.getByText(messages.download.message)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText(messages.download.message));
    });

    expect(mockLogStateString).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockExportAsFile).toHaveBeenCalledWith(
        `${messages.stateLogFileName.message}.json`,
        '{"state": "data"}',
        exportUtils.ExportableContentType.JSON,
      );
    });
  });

  it('shows error toast when logStateString returns error', async () => {
    mockLogStateString.mockImplementation((callback) => {
      callback(new Error('Failed to get state'));
    });

    renderWithProvider(<DownloadStateLogsItem />, mockStore);

    fireEvent.click(screen.getByTestId('download-state-logs-button'));

    await waitFor(() => {
      expect(screen.getByText(messages.download.message)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText(messages.download.message));
    });

    await waitFor(() => {
      expect(
        screen.getByTestId('download-state-logs-error-toast'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.stateLogError.message),
      ).toBeInTheDocument();
    });
  });

  it('shows error toast when exportAsFile throws', async () => {
    mockLogStateString.mockImplementation((callback) => {
      callback(null, '{"state": "data"}');
    });
    mockExportAsFile.mockRejectedValue(new Error('Export failed'));

    renderWithProvider(<DownloadStateLogsItem />, mockStore);

    fireEvent.click(screen.getByTestId('download-state-logs-button'));

    await waitFor(() => {
      expect(screen.getByText(messages.download.message)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText(messages.download.message));
    });

    await waitFor(() => {
      expect(
        screen.getByTestId('download-state-logs-error-toast'),
      ).toBeInTheDocument();
    });
  });
});
