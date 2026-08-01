import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '../../../shared/constants/messages';
import { createSidepanelOpener } from './background';

const messageListeners: ((
  message: { type?: string; nonce?: string },
  sender: { tab?: { id?: number } },
) => unknown)[] = [];

jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: (listener: (typeof messageListeners)[number]) => {
        messageListeners.push(listener);
      },
    },
  },
  tabs: {
    sendMessage: jest.fn(),
  },
}));

describe('createSidepanelOpener', () => {
  const sendMessageMock = browser.tabs.sendMessage as jest.Mock;
  const originalInTest = process.env.IN_TEST;
  let sidePanelOpenMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    messageListeners.length = 0;
    jest.clearAllMocks();
    delete process.env.IN_TEST;

    sidePanelOpenMock = jest.fn().mockResolvedValue(undefined);
    global.chrome = {
      sidePanel: {
        open: sidePanelOpenMock,
      },
    } as unknown as typeof chrome;

    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env.IN_TEST = originalInTest;
    jest.restoreAllMocks();
  });

  it('resolves false when tabs.sendMessage fails', async () => {
    sendMessageMock.mockRejectedValue(new Error('no content script'));
    const requestOpenSidePanel = createSidepanelOpener();

    await expect(requestOpenSidePanel(12)).resolves.toBe(false);
    expect(sidePanelOpenMock).not.toHaveBeenCalled();
  });

  it('resolves false after timeout if no OPEN_SIDEPANEL reply', async () => {
    sendMessageMock.mockResolvedValue(undefined);
    const requestOpenSidePanel = createSidepanelOpener();

    const openPromise = requestOpenSidePanel(12);
    await jest.advanceTimersByTimeAsync(500);

    await expect(openPromise).resolves.toBe(false);
    expect(sidePanelOpenMock).not.toHaveBeenCalled();
  });

  it('resolves false when sidePanel.open rejects', async () => {
    sidePanelOpenMock.mockRejectedValue(new Error('no gesture'));
    sendMessageMock.mockImplementation((_tabId, message) => {
      messageListeners[0](
        {
          type: EXTENSION_MESSAGES.OPEN_SIDEPANEL,
          nonce: message.nonce,
        },
        { tab: { id: 12 } },
      );
      return Promise.resolve();
    });

    const requestOpenSidePanel = createSidepanelOpener();

    await expect(requestOpenSidePanel(12)).resolves.toBe(false);
  });

  it('resolves false when reply has no tab id', async () => {
    sendMessageMock.mockImplementation((_tabId, message) => {
      messageListeners[0](
        {
          type: EXTENSION_MESSAGES.OPEN_SIDEPANEL,
          nonce: message.nonce,
        },
        { tab: {} },
      );
      return Promise.resolve();
    });

    const requestOpenSidePanel = createSidepanelOpener();

    await expect(requestOpenSidePanel(12)).resolves.toBe(false);
    expect(sidePanelOpenMock).not.toHaveBeenCalled();
  });

  it('ignores OPEN_SIDEPANEL with an unknown nonce', async () => {
    sendMessageMock.mockResolvedValue(undefined);
    const requestOpenSidePanel = createSidepanelOpener();

    const openPromise = requestOpenSidePanel(12);
    messageListeners[0](
      {
        type: EXTENSION_MESSAGES.OPEN_SIDEPANEL,
        nonce: 'unknown',
      },
      { tab: { id: 12 } },
    );

    await jest.advanceTimersByTimeAsync(500);
    await expect(openPromise).resolves.toBe(false);
    expect(sidePanelOpenMock).not.toHaveBeenCalled();
  });

  it('resolves true when content script replies and sidePanel.open succeeds', async () => {
    sendMessageMock.mockImplementation((_tabId, message) => {
      messageListeners[0](
        {
          type: EXTENSION_MESSAGES.OPEN_SIDEPANEL,
          nonce: message.nonce,
        },
        { tab: { id: 12 } },
      );
      return Promise.resolve();
    });

    const requestOpenSidePanel = createSidepanelOpener();

    await expect(requestOpenSidePanel(12)).resolves.toBe(true);
    expect(sidePanelOpenMock).toHaveBeenCalledWith({ tabId: 12 });
  });
});
