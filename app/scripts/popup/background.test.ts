import { createPopupOpener } from './background';
import type { PopupOpenerDeps } from './background';

describe('createPopupOpener', () => {
  const createMockDeps = (): PopupOpenerDeps =>
    ({
      extension: {
        tabs: {
          get: jest.fn().mockResolvedValue({ windowId: 789 }),
        },
        action: {
          openPopup: jest.fn().mockResolvedValue(undefined),
        },
        windows: {
          update: jest.fn().mockResolvedValue(undefined),
        },
      },
    }) as unknown as PopupOpenerDeps;

  it('returns false if action.openPopup is not available', async () => {
    const deps = createMockDeps();
    deps.extension.action = undefined;

    const requestOpenPopup = createPopupOpener(deps);
    const result = await requestOpenPopup();

    expect(result).toBe(false);
  });

  it('opens popup successfully without tabId', async () => {
    const deps = createMockDeps();
    const requestOpenPopup = createPopupOpener(deps);
    const result = await requestOpenPopup();

    expect(result).toBe(true);
    expect(deps.extension.action?.openPopup).toHaveBeenCalledWith(undefined);
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
    expect(deps.extension.action?.openPopup).toHaveBeenCalledWith({
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
    expect(deps.extension.action?.openPopup).toHaveBeenCalledWith(undefined);
  });

  it('returns false if openPopup throws', async () => {
    const deps = createMockDeps();
    (deps.extension.action?.openPopup as jest.Mock).mockRejectedValue(
      new Error('Gesture expired'),
    );

    const requestOpenPopup = createPopupOpener(deps);
    const result = await requestOpenPopup();

    expect(result).toBe(false);
  });
});
