import { StorageWriteErrorType } from '../../constants/app-state';
import { captureMessage } from '../sentry';
import {
  PersistenceHealthMonitor,
  PersistenceWriteFailure,
} from './persistence-health-monitor';

jest.mock('../sentry', () => ({
  captureMessage: jest.fn(),
}));
jest.mock('../trace', () => ({
  trace: jest.fn(),
  endTrace: jest.fn(),
  TraceName: {},
}));
const mockedCaptureMessage = jest.mocked(captureMessage);

const NO_SPACE_FAILURE: PersistenceWriteFailure = {
  errorType: StorageWriteErrorType.FileErrorNoSpace,
  failureClass: 'set-failed',
};

const DEFAULT_FAILURE: PersistenceWriteFailure = {
  errorType: StorageWriteErrorType.Default,
  failureClass: 'persist-failed',
};

describe('PersistenceHealthMonitor', () => {
  let monitor: PersistenceHealthMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = new PersistenceHealthMonitor();
  });

  it('is not degraded initially', () => {
    expect(monitor.isDegraded).toBe(false);
  });

  it('enters degraded mode on a disk-space failure and reports entry once', () => {
    monitor.recordWriteFailure(NO_SPACE_FAILURE);
    monitor.recordWriteFailure({
      ...NO_SPACE_FAILURE,
      failureClass: 'persist-backup-failed',
    });

    expect(monitor.isDegraded).toBe(true);
    expect(mockedCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockedCaptureMessage).toHaveBeenCalledWith(
      'Degraded persistence mode entered',
      {
        level: 'warning',
        tags: {
          'persistence.event': 'degraded-persistence-entered',
          'persistence.failure_class': 'set-failed',
          'persistence.storage_write_error_type': 'file-error-no-space',
        },
        fingerprint: ['persistence-event', 'degraded-persistence-entered'],
      },
    );
  });

  it('does not enter degraded mode on a failure that is not about disk space', () => {
    monitor.recordWriteFailure(DEFAULT_FAILURE);

    expect(monitor.isDegraded).toBe(false);
    expect(mockedCaptureMessage).not.toHaveBeenCalled();
  });

  it('does not report anything for a successful write while healthy', () => {
    monitor.recordWriteSuccess();

    expect(monitor.isDegraded).toBe(false);
    expect(mockedCaptureMessage).not.toHaveBeenCalled();
  });

  it('exits on a successful write and reports the failure that entered degraded mode', () => {
    monitor.recordWriteFailure(NO_SPACE_FAILURE);
    monitor.recordWriteFailure(DEFAULT_FAILURE);
    mockedCaptureMessage.mockClear();

    monitor.recordWriteSuccess();

    expect(monitor.isDegraded).toBe(false);
    expect(mockedCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockedCaptureMessage).toHaveBeenCalledWith(
      'Degraded persistence mode exited',
      {
        level: 'info',
        tags: {
          'persistence.event': 'degraded-persistence-exit',
          'persistence.failure_class': 'set-failed',
          'persistence.storage_write_error_type': 'file-error-no-space',
        },
        fingerprint: ['persistence-event', 'degraded-persistence-exit'],
      },
    );
  });

  it('enters degraded mode again after exiting', () => {
    monitor.recordWriteFailure(NO_SPACE_FAILURE);
    monitor.recordWriteSuccess();
    mockedCaptureMessage.mockClear();

    monitor.recordWriteFailure(NO_SPACE_FAILURE);

    expect(monitor.isDegraded).toBe(true);
    expect(mockedCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockedCaptureMessage).toHaveBeenCalledWith(
      'Degraded persistence mode entered',
      expect.anything(),
    );
  });
});
