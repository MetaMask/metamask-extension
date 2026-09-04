import {
  BLOCKING_ERROR_TOAST_POLL_INTERVAL_MS,
  getRecordedBlockingErrorToasts,
  installBlockingErrorToastMonitor,
} from './blocking-error-toast-monitor';

function flushPoll(): void {
  jest.advanceTimersByTime(BLOCKING_ERROR_TOAST_POLL_INTERVAL_MS);
}

function mountErrorToast(text: string): HTMLElement {
  const toast = document.createElement('div');
  toast.setAttribute('data-testid', 'error-toast');
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

    mountErrorToast('None of the cryptocurrencies are supported by price api');
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual([
      'None of the cryptocurrencies are supported by price api',
    ]);
  });

  it('records an error toast that is already in the document', () => {
    mountErrorToast('unsupported cryptocurrency');
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual([
      'unsupported cryptocurrency',
    ]);
  });

  it('does not record a toast without the error-toast test id', () => {
    const toast = document.createElement('div');
    toast.className = 'toast-container';
    toast.textContent =
      'None of the cryptocurrencies are supported by price api';
    document.body.appendChild(toast);
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toHaveLength(0);
  });

  it('keeps a recorded toast after it is removed from the document', () => {
    const toast = mountErrorToast('unsupported');
    flushPoll();

    toast.remove();
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported']);
  });

  it('does not reset recordings when installed a second time', () => {
    mountErrorToast('unsupported');
    flushPoll();

    installBlockingErrorToastMonitor();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported']);
  });

  it('does not record the same matching toast text twice while it stays mounted', () => {
    mountErrorToast('unsupported');
    flushPoll();
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported']);
  });
});
