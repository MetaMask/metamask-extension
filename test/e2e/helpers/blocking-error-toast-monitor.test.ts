import {
  getRecordedBlockingErrorToasts,
  installBlockingErrorToastMonitor,
} from './blocking-error-toast-monitor';

async function flushMutations(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('installBlockingErrorToastMonitor', () => {
  beforeAll(() => {
    document.body.innerHTML = '';
    installBlockingErrorToastMonitor();
  });

  beforeEach(() => {
    document.body.innerHTML = '';
    getRecordedBlockingErrorToasts().length = 0;
  });

  it('records a matching toast inserted as a child of an already-mounted container', async () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    await flushMutations();
    expect(getRecordedBlockingErrorToasts()).toHaveLength(0);

    const message = document.createElement('div');
    message.textContent =
      'None of the cryptocurrencies are supported by price api';
    container.appendChild(message);
    await flushMutations();

    expect(getRecordedBlockingErrorToasts()).toEqual([
      'None of the cryptocurrencies are supported by price api',
    ]);
  });

  it('records a matching toast nested inside a wrapper child of the container', async () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    await flushMutations();

    const wrapper = document.createElement('div');
    const message = document.createElement('div');
    message.textContent = 'unsupported cryptocurrencies';
    wrapper.appendChild(message);
    container.appendChild(wrapper);
    await flushMutations();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported cryptocurrencies']);
  });

  it('records a matching toast when the container is mounted with the message already inside', async () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.textContent = 'unsupported cryptocurrency';
    document.body.appendChild(container);
    await flushMutations();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported cryptocurrency']);
  });

  it('records a matching toast once when the container and message are added in the same tick', async () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    const message = document.createElement('div');
    message.textContent = 'unsupported';
    container.appendChild(message);
    document.body.appendChild(container);
    await flushMutations();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported']);
  });

  it('does not record a toast whose text does not match the blocking-error pattern', async () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    await flushMutations();

    const message = document.createElement('div');
    message.textContent = 'Network added successfully';
    container.appendChild(message);
    await flushMutations();

    expect(getRecordedBlockingErrorToasts()).toHaveLength(0);
  });

  it('records a storage-error toast by test id', async () => {
    const toast = document.createElement('div');
    toast.setAttribute('data-testid', 'storage-error-toast');
    toast.textContent = 'Storage error';
    document.body.appendChild(toast);
    await flushMutations();

    expect(getRecordedBlockingErrorToasts()).toEqual(['Storage error']);
  });

  it('keeps a recorded toast after it is removed from the document', async () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    await flushMutations();

    const message = document.createElement('div');
    message.textContent = 'unsupported';
    container.appendChild(message);
    await flushMutations();

    container.remove();
    await flushMutations();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported']);
  });

  it('does not reset recordings when installed a second time', async () => {
    const container = document.createElement('div');
    container.className = 'toast-container';
    container.textContent = 'unsupported';
    document.body.appendChild(container);
    await flushMutations();

    installBlockingErrorToastMonitor();

    expect(getRecordedBlockingErrorToasts()).toEqual(['unsupported']);
  });
});
