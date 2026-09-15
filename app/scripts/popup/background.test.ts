import type { PopupOpenerDeps } from './background';
import { createPopupOpener } from './background';

describe('createPopupOpener', () => {
  const createMockDeps = (): PopupOpenerDeps =>
    ({
      extension: {
        tabs: {
          get: jest.fn().mockResolvedValue({ windowId: 789 }),
        },
        windows: {
          update: jest.fn().mockResolvedValue(undefined),
        },
      },
    }) as unknown as PopupOpenerDeps;

  beforeEach(() => {
    globalThis.chrome = {
      action: {
        openPopup: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as typeof chrome;
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
    const result = await requestOpenPopup(123);

    expect(result).toBe(true);
    expect(deps.extension.tabs.get).toHaveBeenCalledWith(123);
    expect(deps.extension.windows.update).toHaveBeenCalledWith(789, {
      focused: true,
    });
    expect(globalThis.chrome.action.openPopup).toHaveBeenCalledWith({
      windowId: 789,
    });
  });

  it('continues even if tab.get fails', async () => {
    const deps = createMockDeps();
    (deps.extension.tabs.get as jest.Mock).mockRejectedValue(
      new Error('Tab not found'),
    );

    const requestOpenPopup = createPopupOpener(deps);
    const result = await requestOpenPopup(123);

    expect(result).toBe(true);
    expect(globalThis.chrome.action.openPopup).toHaveBeenCalledWith(undefined);
  });

  it('returns false if openPopup throws', async () => {
    const deps = createMockDeps();
    (globalThis.chrome.action.openPopup as jest.Mock).mockRejectedValue(
      new Error('Gesture expired'),
    );

    const requestOpenPopup = createPopupOpener(deps);
    const result = await requestOpenPopup();

    expect(result).toBe(false);
  });
});
