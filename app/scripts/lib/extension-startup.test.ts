import { jest } from '@jest/globals';
import { ExtensionStartup } from './extension-startup';

const CURRENT_VERSION = '2.0.0';
const UPDATE = {
  reason: 'update',
  previousVersion: '1.0.0',
} as const;

function createEvent<Args extends unknown[]>() {
  const listeners: ((...args: Args) => void)[] = [];
  return {
    addListener: (listener: (...args: Args) => void) =>
      listeners.push(listener),
    emit: (...args: Args) => listeners.forEach((listener) => listener(...args)),
  };
}

function createStartup(serviceWorkerState = 'installing') {
  const installed = createEvent<[chrome.runtime.InstalledDetails]>();
  const activate = createEvent<[]>();
  const enableAction = jest
    .fn<() => Promise<void>>()
    .mockResolvedValue(undefined);
  const browser = {
    action: {
      enable: enableAction,
    },
    runtime: {
      getManifest: () => ({ version: CURRENT_VERSION }),
      onInstalled: installed,
    },
    sidePanel: {
      setOptions: jest
        .fn<(options: chrome.sidePanel.PanelOptions) => Promise<void>>()
        .mockResolvedValue(undefined),
    },
  } as unknown as ConstructorParameters<typeof ExtensionStartup>[0];
  const serviceWorker = {
    addEventListener: (_type: 'activate', listener: (...args: []) => void) =>
      activate.addListener(listener),
    serviceWorker: { state: serviceWorkerState },
  };
  const startup = new ExtensionStartup(browser, serviceWorker);

  return {
    activate: activate.emit,
    enableAction,
    install: installed.emit,
    startup,
  };
}

describe('ExtensionStartup', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('marks startup ready when no recovery reload is needed', async () => {
    const { enableAction, install, startup } = createStartup();

    install({ reason: 'update', previousVersion: CURRENT_VERSION });

    await expect(startup.ready).resolves.toBeUndefined();
    expect(enableAction).toHaveBeenCalledTimes(1);
  });

  it('marks startup ready when an activated worker restarts', async () => {
    const { enableAction, startup } = createStartup('activated');

    await expect(startup.ready).resolves.toBeUndefined();
    expect(enableAction).toHaveBeenCalledTimes(1);
  });

  it('keeps a claimed recovery reload closed through its deadline', async () => {
    jest.useFakeTimers();
    const { activate, enableAction, install, startup } = createStartup();
    let ready = false;
    startup.ready.then(() => {
      ready = true;
    });

    install(UPDATE);
    activate();
    expect(startup.claimReload()).toBe(true);
    await jest.runOnlyPendingTimersAsync();

    expect(ready).toBe(false);
    expect(startup.claimReload()).toBe(false);
    expect(enableAction).not.toHaveBeenCalled();
  });

  it('fails open when initialization misses the recovery reload deadline', async () => {
    jest.useFakeTimers();
    const { enableAction, install, startup } = createStartup();
    install(UPDATE);

    await jest.runOnlyPendingTimersAsync();

    await expect(startup.ready).resolves.toBeUndefined();
    expect(startup.claimReload()).toBe(false);
    expect(enableAction).toHaveBeenCalledTimes(1);
  });

  it('allows an explicit fail-open decision to release gated work', async () => {
    const { enableAction, install, startup } = createStartup();
    const gatedWork = jest.fn();
    const gatedWorkPromise = startup.ready.then(gatedWork);
    install(UPDATE);

    await Promise.resolve();
    expect(gatedWork).not.toHaveBeenCalled();

    startup.markReady();
    await gatedWorkPromise;

    expect(gatedWork).toHaveBeenCalledTimes(1);
    expect(enableAction).toHaveBeenCalledTimes(1);
  });

  it('resolves readiness once while retrying entry-point enablement', async () => {
    jest.useFakeTimers();
    const firstError = new Error('first failure');
    const secondError = new Error('second failure');
    const onEntryPointEnablementError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error('reporting failed');
      });
    const { enableAction, startup } = createStartup();
    enableAction
      .mockRejectedValueOnce(firstError)
      .mockRejectedValueOnce(secondError);

    startup.markReady();
    startup.markReady();

    await expect(startup.ready).resolves.toBeUndefined();
    expect(enableAction).toHaveBeenCalledTimes(1);

    await jest.runOnlyPendingTimersAsync();
    await jest.runOnlyPendingTimersAsync();

    expect(enableAction).toHaveBeenCalledTimes(3);
    expect(onEntryPointEnablementError).toHaveBeenNthCalledWith(
      1,
      'MetaMask - Failed to enable extension UI entry points; retrying',
      firstError,
    );
    expect(onEntryPointEnablementError).toHaveBeenNthCalledWith(
      2,
      'MetaMask - Failed to enable extension UI entry points; retrying',
      secondError,
    );
  });
});
