/**
 * @jest-environment node
 */

import { jest } from '@jest/globals';
import browser, { Runtime } from 'webextension-polyfill';
import { PLATFORM_CHROME, PLATFORM_FIREFOX } from '../../shared/constants/app';
import * as util from './lib/util';
import { onUpdate } from './on-update';

jest.mock('webextension-polyfill', () => ({
  action: {
    disable: jest.fn(),
    enable: jest.fn(),
  },
  runtime: {
    getContexts: jest.fn(),
  },
}));

jest.mock('loglevel', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

const mockBrowser = jest.mocked(browser);
const SIDE_PANEL_CONTEXT: Runtime.ExtensionContext = {
  contextId: 'side-panel',
  contextType: 'SIDE_PANEL',
  incognito: false,
  frameId: -1,
  tabId: -1,
  windowId: 1,
};

function createController(lastUpdatedFromVersion: string | null = null) {
  const appStateController = {
    state: { lastUpdatedFromVersion },
    setLastUpdatedAt: jest.fn(),
    setLastUpdatedFromVersion: jest.fn(),
    setPendingExtensionVersion: jest.fn(),
  };

  return {
    appStateController,
    controller: {
      store: {},
      appStateController,
    } as unknown as Parameters<typeof onUpdate>[0],
  };
}

const platform = {
  getVersion: jest.fn(() => '2.0.0'),
} as unknown as Parameters<typeof onUpdate>[1];

describe('onUpdate', () => {
  let requestSafeReload: jest.Mock<() => Promise<void>>;
  let postUpdateReloadAbortController: AbortController;
  let update: (
    controller: Parameters<typeof onUpdate>[0],
  ) => ReturnType<typeof onUpdate>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(util, 'getPlatform').mockReturnValue(PLATFORM_CHROME);
    mockBrowser.action.disable.mockResolvedValue(undefined);
    mockBrowser.action.enable.mockResolvedValue(undefined);
    mockBrowser.runtime.getContexts.mockResolvedValue([]);
    requestSafeReload = jest.fn<() => Promise<void>>(async () => undefined);
    postUpdateReloadAbortController = new AbortController();
    update = (controller) =>
      onUpdate(controller, platform, '1.0.0', requestSafeReload, {
        postUpdateReloadAbortSignal:
          postUpdateReloadAbortController.signal,
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cancels the reload when an internal UI connection was already observed', async () => {
    const { appStateController, controller } = createController();
    postUpdateReloadAbortController.abort();

    await expect(update(controller)).resolves.toBe('cancelled-by-ui');

    expect(appStateController.setLastUpdatedFromVersion).toHaveBeenCalledWith(
      '1.0.0',
    );
    expect(mockBrowser.action.disable).not.toHaveBeenCalled();
    expect(mockBrowser.action.enable).toHaveBeenCalledTimes(1);
    expect(requestSafeReload).not.toHaveBeenCalled();
  });

  it('reloads when no internal UI is connecting', async () => {
    const { controller } = createController();

    await expect(update(controller)).resolves.toBe('reload');

    expect(mockBrowser.action.disable).toHaveBeenCalledTimes(1);
    expect(mockBrowser.runtime.getContexts).toHaveBeenCalledWith({
      contextTypes: ['POPUP', 'SIDE_PANEL', 'TAB'],
    });
    expect(requestSafeReload).toHaveBeenCalledTimes(1);
  });

  it('cancels the reload when a UI connects while the action is being disabled', async () => {
    const { controller } = createController();
    let resolveDisable!: () => void;
    mockBrowser.action.disable.mockReturnValue(
      new Promise((resolve) => {
        resolveDisable = resolve;
      }),
    );

    const decisionPromise = update(controller);
    await new Promise<void>((resolve) => setImmediate(resolve));
    postUpdateReloadAbortController.abort();
    resolveDisable();

    await expect(decisionPromise).resolves.toBe('cancelled-by-ui');
    expect(mockBrowser.action.enable).toHaveBeenCalledTimes(1);
    expect(requestSafeReload).not.toHaveBeenCalled();
  });

  it('cancels the reload when an in-flight side panel connects', async () => {
    const { controller } = createController();
    mockBrowser.runtime.getContexts.mockImplementation(async () => {
      setTimeout(() => postUpdateReloadAbortController.abort(), 0);
      return [SIDE_PANEL_CONTEXT];
    });

    await expect(update(controller)).resolves.toBe('cancelled-by-ui');

    expect(mockBrowser.runtime.getContexts).toHaveBeenCalledTimes(1);
    expect(mockBrowser.action.enable).toHaveBeenCalledTimes(1);
    expect(requestSafeReload).not.toHaveBeenCalled();
  });

  it('reloads when an in-flight side panel never connects', async () => {
    const { controller } = createController();
    mockBrowser.runtime.getContexts.mockResolvedValue([SIDE_PANEL_CONTEXT]);

    await expect(update(controller)).resolves.toBe('reload');

    expect(requestSafeReload).toHaveBeenCalledTimes(1);
  });

  it('uses the bounded connection wait when querying contexts fails', async () => {
    const { controller } = createController();
    mockBrowser.runtime.getContexts.mockRejectedValue(
      new Error('getContexts failed'),
    );

    await expect(update(controller)).resolves.toBe('reload');

    expect(requestSafeReload).toHaveBeenCalledTimes(1);
  });

  it('reloads when disabling the action fails and no UI connected', async () => {
    const { controller } = createController();
    mockBrowser.action.disable.mockRejectedValue(new Error('disable failed'));

    await expect(update(controller)).resolves.toBe('reload');

    expect(mockBrowser.runtime.getContexts).not.toHaveBeenCalled();
    expect(requestSafeReload).toHaveBeenCalledTimes(1);
  });

  it('preserves Firefox update behavior without coordinating a reload', async () => {
    const { appStateController, controller } = createController();
    jest.spyOn(util, 'getPlatform').mockReturnValue(PLATFORM_FIREFOX);

    await expect(update(controller)).resolves.toBeUndefined();

    expect(appStateController.setLastUpdatedFromVersion).toHaveBeenCalledWith(
      '1.0.0',
    );
    expect(mockBrowser.action.disable).not.toHaveBeenCalled();
    expect(requestSafeReload).not.toHaveBeenCalled();
  });

  it('ignores a duplicate update event', async () => {
    const { appStateController, controller } = createController('1.0.0');

    await expect(update(controller)).resolves.toBeUndefined();

    expect(appStateController.setLastUpdatedAt).not.toHaveBeenCalled();
    expect(mockBrowser.action.disable).not.toHaveBeenCalled();
    expect(requestSafeReload).not.toHaveBeenCalled();
  });
});
