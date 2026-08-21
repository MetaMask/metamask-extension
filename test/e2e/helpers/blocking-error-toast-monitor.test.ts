import {
  BLOCKING_ERROR_TOAST_POLL_INTERVAL_MS,
  getRecordedBlockingErrorToasts,
  installBlockingErrorToastMonitor,
} from './blocking-error-toast-monitor';

function flushPoll(): void {
  jest.advanceTimersByTime(BLOCKING_ERROR_TOAST_POLL_INTERVAL_MS);
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

  it('records a matching toast inserted as a child of an already-mounted container', () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    flushPoll();
    expect(getRecordedBlockingErrorToasts()).toHaveLength(0);

    const message = document.createElement('div');
    message.textContent =
      'None of the cryptocurrencies are supported by price api';
    container.appendChild(message);
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual([
      'None of the cryptocurrencies are supported by price api',
    ]);
  });

  it('records a matching toast nested inside a wrapper child of the container', () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    flushPoll();

    const wrapper = document.createElement('div');
    const message = document.createElement('div');
    message.textContent = 'unsupported cryptocurrencies';
    wrapper.appendChild(message);
    container.appendChild(wrapper);
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual([
      'unsupported cryptocurrencies',
    ]);
  });

  it('records a matching toast when the container is mounted with the message already inside', () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.textContent = 'unsupported cryptocurrency';
    document.body.appendChild(container);
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual([
      'unsupported cryptocurrency',
    ]);
  });

  it('records a matching toast once when the container and message are added in the same tick', () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    const message = document.createElement('div');
    message.textContent = 'unsupported';
    container.appendChild(message);
    document.body.appendChild(container);
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported']);
  });

  it('does not record a toast whose text does not match the blocking-error pattern', () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    flushPoll();

    const message = document.createElement('div');
    message.textContent = 'Network added successfully';
    container.appendChild(message);
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toHaveLength(0);
  });

  it('records a storage-error toast by test id', () => {
    const toast = document.createElement('div');
    toast.setAttribute('data-testid', 'storage-error-toast');
    toast.textContent = 'Storage error';
    document.body.appendChild(toast);
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual(['Storage error']);
  });

  it('keeps a recorded toast after it is removed from the document', () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    flushPoll();

    const message = document.createElement('div');
    message.textContent = 'unsupported';
    container.appendChild(message);
    flushPoll();

    container.remove();
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported']);
  });

  it('does not reset recordings when installed a second time', () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.textContent = 'unsupported';
    document.body.appendChild(container);
    flushPoll();

    installBlockingErrorToastMonitor();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported']);
  });

  it('does not record the same matching toast text twice while it stays mounted', () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.textContent = 'unsupported';
    document.body.appendChild(container);
    flushPoll();
    flushPoll();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported']);
  });
});
