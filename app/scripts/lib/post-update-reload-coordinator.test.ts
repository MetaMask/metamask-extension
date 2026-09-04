import { jest } from '@jest/globals';
import { PostUpdateReloadCoordinator } from './post-update-reload-coordinator';

const CURRENT_VERSION = '2.0.0';
const GENUINE_UPDATE = {
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

function createCoordinator(isServiceWorkerActivated = false) {
  const installed = createEvent<[chrome.runtime.InstalledDetails]>();
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
  } as unknown as ConstructorParameters<typeof PostUpdateReloadCoordinator>[0];
  const coordinator = new PostUpdateReloadCoordinator(
    browser,
    isServiceWorkerActivated,
  );

  return {
    dispatchInstalled: installed.emit,
    enableAction,
    coordinator,
  };
}

describe('PostUpdateReloadCoordinator', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('completes when no recovery reload is needed', async () => {
    const { coordinator, dispatchInstalled, enableAction } =
      createCoordinator();

    dispatchInstalled({ reason: 'update', previousVersion: CURRENT_VERSION });

    await expect(coordinator.completion).resolves.toBeUndefined();
    expect(enableAction).toHaveBeenCalledTimes(1);
  });

  it('completes when an activated worker restarts', async () => {
    const { coordinator, enableAction } = createCoordinator(true);

    await expect(coordinator.completion).resolves.toBeUndefined();
    expect(enableAction).toHaveBeenCalledTimes(1);
  });

  it('remains incomplete after the recovery reload begins', async () => {
    jest.useFakeTimers();
    const { coordinator, dispatchInstalled, enableAction } =
      createCoordinator();

    dispatchInstalled(GENUINE_UPDATE);
    expect(coordinator.tryBeginReload()).toBe(true);
    await jest.runOnlyPendingTimersAsync();

    expect(coordinator.tryBeginReload()).toBe(false);
    expect(enableAction).not.toHaveBeenCalled();
  });

  it('completes when the recovery reload does not begin before the deadline', async () => {
    jest.useFakeTimers();
    const { coordinator, dispatchInstalled, enableAction } =
      createCoordinator();
    dispatchInstalled(GENUINE_UPDATE);

    await jest.runOnlyPendingTimersAsync();

    await expect(coordinator.completion).resolves.toBeUndefined();
    expect(coordinator.tryBeginReload()).toBe(false);
    expect(enableAction).toHaveBeenCalledTimes(1);
  });

  it('allows callers to complete coordination explicitly', async () => {
    const { coordinator, dispatchInstalled, enableAction } =
      createCoordinator();
    const gatedWork = jest.fn();
    const gatedWorkPromise = coordinator.completion.then(gatedWork);
    dispatchInstalled(GENUINE_UPDATE);

    await Promise.resolve();
    expect(gatedWork).not.toHaveBeenCalled();

    coordinator.complete();
    await gatedWorkPromise;

    expect(gatedWork).toHaveBeenCalledTimes(1);
    expect(enableAction).toHaveBeenCalledTimes(1);
  });

  it('retries enabling the toolbar action when error reporting fails', async () => {
    jest.useFakeTimers();
    const firstError = new Error('first failure');
    const secondError = new Error('second failure');
    const onActionEnableError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error('reporting failed');
      });
    const { coordinator, enableAction } = createCoordinator();
    enableAction
      .mockRejectedValueOnce(firstError)
      .mockRejectedValueOnce(secondError);

    coordinator.complete();

    await expect(coordinator.completion).resolves.toBeUndefined();
    expect(enableAction).toHaveBeenCalledTimes(1);

    await jest.runOnlyPendingTimersAsync();
    await jest.runOnlyPendingTimersAsync();

    expect(enableAction).toHaveBeenCalledTimes(3);
    expect(onActionEnableError).toHaveBeenNthCalledWith(
      1,
      'MetaMask - Failed to enable extension toolbar action; retrying',
      firstError,
    );
    expect(onActionEnableError).toHaveBeenNthCalledWith(
      2,
      'MetaMask - Failed to enable extension toolbar action; retrying',
      secondError,
    );
  });
});
