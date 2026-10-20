import {
  BLOCKING_ERROR_TOAST_POLL_INTERVAL_MS,
  getBlockingErrorToastHeartbeat,
  getRecordedBlockingErrorToasts,
  installBlockingErrorToastMonitor,
} from './blocking-error-toast-monitor';

function flushPoll(): void {
  jest.advanceTimersByTime(BLOCKING_ERROR_TOAST_POLL_INTERVAL_MS);
}

function mountToastContainer(text: string): HTMLElement {
  const toast = document.createElement('div');
  toast.className = 'toast-container';
  toast.textContent = text;
  document.body.appendChild(toast);
  return toast;
}

describe('installBlockingErrorToastMonitor', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '';
    installBlockingErrorToastMonitor();
  });

  afterAll(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    getRecordedBlockingErrorToasts().length = 0;
  });

  it('records an error toast inserted after the monitor is installed', () => {
    flushPoll();
    expect(getRecordedBlockingErrorToasts()).toHaveLength(0);

    mountToastContainer(
      'None of the cryptocurrencies are supported by price api',
    );
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual([
      'None of the cryptocurrencies are supported by price api',
    ]);
  });

  it('records an error toast that is already in the document', () => {
    mountToastContainer('unsupported cryptocurrency');
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual([
      'unsupported cryptocurrency',
    ]);
  });

  it('does not record price-api text outside the toast container', () => {
    const toast = document.createElement('div');
    toast.textContent =
      'None of the cryptocurrencies are supported by price api';
    document.body.appendChild(toast);
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toHaveLength(0);
  });

  it('does not record unrelated toast container copy', () => {
    mountToastContainer('Network added successfully');
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toHaveLength(0);
  });

  it('keeps a recorded toast after it is removed from the document', () => {
    const toast = mountToastContainer('unsupported');
    flushPoll();

    toast.remove();
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported']);
  });

  it('does not reset recordings when installed a second time', () => {
    mountToastContainer('unsupported');
    flushPoll();
    const heartbeat = getBlockingErrorToastHeartbeat();

    installBlockingErrorToastMonitor();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported']);
    expect(getBlockingErrorToastHeartbeat()).toBe(heartbeat);
  });

  it('bumps a heartbeat each time the poll runs', () => {
    const before = getBlockingErrorToastHeartbeat();

    flushPoll();

    expect(getBlockingErrorToastHeartbeat()).toBe(before + 1);
  });

  it('does not record the same matching toast text twice while it stays mounted', () => {
    mountToastContainer('unsupported');
    flushPoll();
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported']);
  });
});
