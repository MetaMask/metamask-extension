import { createPopupOpenerWithNotificationClose } from './createPopupOpenerWithNotificationClose';

describe('createPopupOpenerWithNotificationClose', () => {
  const createMockDeps = () => ({
    appStateController: {
      getCurrentPopupId: jest.fn().mockReturnValue(undefined),
    },
    extension: {
      tabs: {
        get: jest.fn().mockResolvedValue({ windowId: 789 }),
      },
      windows: {
        remove: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
      },
    },
    notificationManager: {
      markAsAutomaticallyClosed: jest.fn(),
    },
  });

  beforeEach(() => {
    // @ts-expect-error - mocking chrome.action.openPopup
    globalThis.chrome = {
      action: {
        openPopup: jest.fn().mockResolvedValue(undefined),
      },
    };
  });

  afterEach(() => {
    // @ts-expect-error - cleaning up mock
    delete globalThis.chrome;
  });

  it('returns false if tabId is not provided', async () => {
    const deps = createMockDeps();
    const opener = createPopupOpenerWithNotificationClose(deps);

    const result = await opener();

    expect(result).toBe(false);
    expect(globalThis.chrome.action.openPopup).not.toHaveBeenCalled();
  });

  it('returns false if tabId is undefined', async () => {
    const deps = createMockDeps();
    const opener = createPopupOpenerWithNotificationClose(deps);

    const result = await opener({ tabId: undefined });

    expect(result).toBe(false);
    expect(globalThis.chrome.action.openPopup).not.toHaveBeenCalled();
  });

  it('opens popup and returns true when tabId is provided', async () => {
    const deps = createMockDeps();
    const opener = createPopupOpenerWithNotificationClose(deps);

    const result = await opener({ tabId: 456 });

    expect(result).toBe(true);
    expect(deps.extension.tabs.get).toHaveBeenCalledWith(456);
    expect(globalThis.chrome.action.openPopup).toHaveBeenCalled();
  });

  it('closes notification only after popup opens successfully', async () => {
    const deps = createMockDeps();
    deps.appStateController.getCurrentPopupId.mockReturnValue(123);
    const opener = createPopupOpenerWithNotificationClose(deps);

    const result = await opener({ tabId: 456 });

    expect(result).toBe(true);
    expect(
      deps.notificationManager.markAsAutomaticallyClosed,
    ).toHaveBeenCalled();
    expect(deps.extension.windows.remove).toHaveBeenCalledWith(123);
  });

  it('does not close notification when popup fails to open', async () => {
    // @ts-expect-error - removing mock to simulate unsupported
    delete globalThis.chrome;

    const deps = createMockDeps();
    deps.appStateController.getCurrentPopupId.mockReturnValue(123);
    const opener = createPopupOpenerWithNotificationClose(deps);

    const result = await opener({ tabId: 456 });

    expect(result).toBe(false);
    expect(
      deps.notificationManager.markAsAutomaticallyClosed,
    ).not.toHaveBeenCalled();
    expect(deps.extension.windows.remove).not.toHaveBeenCalled();
  });

  it('does not try to close notification if none exists', async () => {
    const deps = createMockDeps();
    deps.appStateController.getCurrentPopupId.mockReturnValue(undefined);
    const opener = createPopupOpenerWithNotificationClose(deps);

    await opener({ tabId: 456 });

    expect(
      deps.notificationManager.markAsAutomaticallyClosed,
    ).not.toHaveBeenCalled();
    expect(deps.extension.windows.remove).not.toHaveBeenCalled();
  });

  it('continues even if notification window removal fails', async () => {
    const deps = createMockDeps();
    deps.appStateController.getCurrentPopupId.mockReturnValue(123);
    deps.extension.windows.remove.mockRejectedValue(
      new Error('Window not found'),
    );
    const opener = createPopupOpenerWithNotificationClose(deps);

    const result = await opener({ tabId: 456 });

    expect(result).toBe(true);
  });
});
