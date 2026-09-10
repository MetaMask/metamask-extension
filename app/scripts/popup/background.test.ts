import { createPopupOpener } from './background';

describe('createPopupOpener', () => {
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

  it('returns false if chrome.action.openPopup is not available', async () => {
    // @ts-expect-error - removing mock
    delete globalThis.chrome;

    const deps = createMockDeps();
    const requestOpenPopup = createPopupOpener(deps);
    const result = await requestOpenPopup();

    expect(result).toBe(false);
  });

  it('opens popup successfully without tabId', async () => {
    const deps = createMockDeps();
    const requestOpenPopup = createPopupOpener(deps);
    const result = await requestOpenPopup();

    expect(result).toBe(true);
    expect(globalThis.chrome.action.openPopup).toHaveBeenCalledWith(undefined);
    expect(deps.extension.tabs.get).not.toHaveBeenCalled();
  });

  it('opens popup in the specified tab window when tabId is provided', async () => {
    const deps = createMockDeps();
    const requestOpenPopup = createPopupOpener(deps);
    const result = await requestOpenPopup({ tabId: 123 });

    expect(result).toBe(true);
    expect(deps.extension.tabs.get).toHaveBeenCalledWith(123);
    expect(deps.extension.windows.update).toHaveBeenCalledWith(789, {
      focused: true,
    });
    expect(globalThis.chrome.action.openPopup).toHaveBeenCalledWith({
      windowId: 789,
    });
  });

  it('closes existing notification before opening popup', async () => {
    const deps = createMockDeps();
    deps.appStateController.getCurrentPopupId.mockReturnValue(456);

    const requestOpenPopup = createPopupOpener(deps);
    const result = await requestOpenPopup();

    expect(result).toBe(true);
    expect(
      deps.notificationManager.markAsAutomaticallyClosed,
    ).toHaveBeenCalled();
    expect(deps.extension.windows.remove).toHaveBeenCalledWith(456);
  });

  it('continues even if tab.get fails', async () => {
    const deps = createMockDeps();
    deps.extension.tabs.get.mockRejectedValue(new Error('Tab not found'));

    const requestOpenPopup = createPopupOpener(deps);
    const result = await requestOpenPopup({ tabId: 123 });

    expect(result).toBe(true);
    expect(globalThis.chrome.action.openPopup).toHaveBeenCalledWith(undefined);
  });

  it('returns false if openPopup throws', async () => {
    const deps = createMockDeps();
    // @ts-expect-error - mocking rejection
    globalThis.chrome.action.openPopup.mockRejectedValue(
      new Error('Gesture expired'),
    );

    const requestOpenPopup = createPopupOpener(deps);
    const result = await requestOpenPopup();

    expect(result).toBe(false);
  });

  it('continues even if notification window removal fails', async () => {
    const deps = createMockDeps();
    deps.appStateController.getCurrentPopupId.mockReturnValue(456);
    deps.extension.windows.remove.mockRejectedValue(
      new Error('Window not found'),
    );

    const requestOpenPopup = createPopupOpener(deps);
    const result = await requestOpenPopup();

    expect(result).toBe(true);
  });
});
