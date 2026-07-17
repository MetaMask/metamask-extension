import { fireEvent, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as exportUtils from '../../../helpers/utils/export-utils';
import { toast } from '../../../components/ui/toast/toast';
import { DownloadStateLogsItem } from './download-state-logs-item';

jest.mock('../../../helpers/utils/export-utils', () => ({
  ...jest.requireActual('../../../helpers/utils/export-utils'),
  exportAsFile: jest.fn(),
}));

jest.mock('../../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../../shared/lib/sentry'),
  captureException: jest.fn(),
}));

jest.mock('../../../components/ui/toast/toast', () => {
  const actual = jest.requireActual<
    typeof import('../../../components/ui/toast/toast')
  >('../../../components/ui/toast/toast');
  return {
    ...actual,
    toast: {
      ...actual.toast,
      error: jest.fn(),
    },
    ToastContent: actual.ToastContent,
  };
});

const mockExportAsFile = exportUtils.exportAsFile as jest.Mock;

describe('DownloadStateLogsItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);
  let mockLogStateString: jest.Mock<Promise<string>>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogStateString = jest.fn();
    window.logStateString =
      mockLogStateString as unknown as typeof window.logStateString;
  });

  afterEach(() => {
    // @ts-expect-error - resetting mock
    delete window.logStateString;
  });

  it('renders the button with correct text', () => {
    renderWithProvider(<DownloadStateLogsItem />, mockStore);

    expect(
      screen.getByTestId('advanced-setting-state-logs-button'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.downloadStateLogs.message),
    ).toBeInTheDocument();
  });

  it('opens modal when button is clicked', async () => {
    renderWithProvider(<DownloadStateLogsItem />, mockStore);

    fireEvent.click(screen.getByTestId('advanced-setting-state-logs-button'));

    await waitFor(() => {
      expect(
        screen.getByText(messages.stateLogsModalDescription.message),
      ).toBeInTheDocument();
    });
  });

  it('calls logStateString and exportAsFile on download', async () => {
    mockLogStateString.mockResolvedValue('{"state": "data"}');
    mockExportAsFile.mockResolvedValue(undefined);

    renderWithProvider(<DownloadStateLogsItem />, mockStore);

    fireEvent.click(screen.getByTestId('advanced-setting-state-logs-button'));

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

  it('shows error toast when logStateString rejects', async () => {
    mockLogStateString.mockRejectedValue(new Error('Failed to get state'));

    renderWithProvider(<DownloadStateLogsItem />, mockStore);

    fireEvent.click(screen.getByTestId('advanced-setting-state-logs-button'));

    await waitFor(() => {
      expect(screen.getByText(messages.download.message)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText(messages.download.message));
    });

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        expect.objectContaining({
          title: messages.unableToDownload.message,
            description: messages.stateLogError.message,
            dataTestId: 'download-state-logs-error-toast',
          id: 'download-state-logs-error-toast',
        }),
        expect.objectContaining({
          duration: Infinity,
        }),
      );
    });
  });

  it('shows error toast when exportAsFile throws', async () => {
    mockLogStateString.mockResolvedValue('{"state": "data"}');
    mockExportAsFile.mockRejectedValue(new Error('Export failed'));

    renderWithProvider(<DownloadStateLogsItem />, mockStore);

    fireEvent.click(screen.getByTestId('advanced-setting-state-logs-button'));

    await waitFor(() => {
      expect(screen.getByText(messages.download.message)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText(messages.download.message));
    });

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        expect.objectContaining({
          dataTestId: 'download-state-logs-error-toast',
          id: 'download-state-logs-error-toast',
        }),
        expect.objectContaining({
          duration: Infinity,
        }),
      );
    });
  });
});
