import {
  ClipboardAction,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import initClipboard from './clipboard';

// ── Chrome runtime mock ──────────────────────────────────────────────────

type MessageListener = (
  msg: { target: string; action: ClipboardAction },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
) => boolean | void;

const listeners: MessageListener[] = [];

const EXTENSION_ID = 'test-extension-id';

// jsdom doesn't provide document.execCommand, so we define a mock.
let execCommandMock: jest.Mock;

beforeEach(() => {
  listeners.length = 0;

  globalThis.chrome = {
    runtime: {
      id: EXTENSION_ID,
      onMessage: {
        addListener: (fn: MessageListener) => {
          listeners.push(fn);
        },
      },
    },
  } as unknown as typeof chrome;

  // Install a mock for document.execCommand (not present in jsdom).
  execCommandMock = jest.fn().mockReturnValue(true);
  document.execCommand = execCommandMock;
});

afterEach(() => {
  // Clean up any leftover textareas
  document.querySelectorAll('textarea').forEach((el) => el.remove());
});

// ── Helpers ──────────────────────────────────────────────────────────────

/** Simulate dispatching a chrome.runtime.onMessage message. */
function dispatchMessage(
  msg: { target: string; action: ClipboardAction },
  sender: chrome.runtime.MessageSender,
): Promise<unknown> {
  return new Promise((resolve) => {
    for (const listener of listeners) {
      const result = listener(msg, sender, resolve);
      if (result === true) {
        // Listener indicated async response — wait for sendResponse.
        return;
      }
    }
    // No listener claimed the message; resolve with undefined.
    resolve(undefined);
  });
}

const EXTENSION_ORIGIN = `chrome-extension://${EXTENSION_ID}`;

/** Build a `MessageSender` for a trusted extension page (e.g. side panel). */
function trustedExtensionSender(
  page = '/sidepanel.html',
): chrome.runtime.MessageSender {
  return {
    id: EXTENSION_ID,
    origin: EXTENSION_ORIGIN,
    url: `${EXTENSION_ORIGIN}${page}`,
  } as chrome.runtime.MessageSender;
}

/** Build a `MessageSender` for a content script in a web page tab. */
function contentScriptSender(): chrome.runtime.MessageSender {
  return {
    id: EXTENSION_ID,
    origin: EXTENSION_ORIGIN,
    url: `${EXTENSION_ORIGIN}/sidepanel.html`,
    tab: { id: 42 } as chrome.tabs.Tab,
  } as chrome.runtime.MessageSender;
}

/** Build a `MessageSender` for a different (external) extension. */
function externalExtensionSender(): chrome.runtime.MessageSender {
  return {
    id: 'other-extension-id',
    origin: 'chrome-extension://other-extension-id',
    url: 'chrome-extension://other-extension-id/popup.html',
  } as chrome.runtime.MessageSender;
}

/**
 * Make the `execCommand('paste')` mock write `pasteText` into any
 * textarea present in the DOM (mimicking a real paste).
 */
function stubClipboardPaste(pasteText: string): void {
  execCommandMock.mockImplementation((cmd: string) => {
    if (cmd === 'paste') {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = pasteText;
      }
      return true;
    }
    return false;
  });
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('clipboard offscreen handler', () => {
  describe('sender validation', () => {
    it('responds to a trusted extension page', async () => {
      stubClipboardPaste('hello world');
      initClipboard();

      const response = await dispatchMessage(
        {
          target: OffscreenCommunicationTarget.clipboardOffscreen,
          action: ClipboardAction.readClipboard,
        },
        trustedExtensionSender(),
      );

      expect(response).toStrictEqual({
        success: true,
        text: 'hello world',
      });
    });

    it('rejects messages from content scripts (sender.tab is set)', async () => {
      stubClipboardPaste('secret SRP words');
      initClipboard();

      const response = await dispatchMessage(
        {
          target: OffscreenCommunicationTarget.clipboardOffscreen,
          action: ClipboardAction.readClipboard,
        },
        contentScriptSender(),
      );

      // No listener claimed async handling → resolved as undefined
      expect(response).toBeUndefined();
    });

    it('rejects messages from external extensions', async () => {
      stubClipboardPaste('secret SRP words');
      initClipboard();

      const response = await dispatchMessage(
        {
          target: OffscreenCommunicationTarget.clipboardOffscreen,
          action: ClipboardAction.readClipboard,
        },
        externalExtensionSender(),
      );

      expect(response).toBeUndefined();
    });

    it('rejects messages with a mismatched origin', async () => {
      stubClipboardPaste('secret SRP words');
      initClipboard();

      const response = await dispatchMessage(
        {
          target: OffscreenCommunicationTarget.clipboardOffscreen,
          action: ClipboardAction.readClipboard,
        },
        {
          id: EXTENSION_ID,
          origin: 'https://evil.com',
          url: `${EXTENSION_ORIGIN}/popup.html`,
        } as chrome.runtime.MessageSender,
      );

      expect(response).toBeUndefined();
    });

    it('rejects messages with no origin', async () => {
      stubClipboardPaste('secret SRP words');
      initClipboard();

      const response = await dispatchMessage(
        {
          target: OffscreenCommunicationTarget.clipboardOffscreen,
          action: ClipboardAction.readClipboard,
        },
        { id: EXTENSION_ID } as chrome.runtime.MessageSender,
      );

      expect(response).toBeUndefined();
    });

    it('rejects messages from the offscreen document itself', async () => {
      stubClipboardPaste('secret SRP words');
      initClipboard();

      const response = await dispatchMessage(
        {
          target: OffscreenCommunicationTarget.clipboardOffscreen,
          action: ClipboardAction.readClipboard,
        },
        {
          id: EXTENSION_ID,
          origin: EXTENSION_ORIGIN,
          url: `${EXTENSION_ORIGIN}/offscreen.html`,
        } as chrome.runtime.MessageSender,
      );

      expect(response).toBeUndefined();
    });

    it('rejects messages from a Snap iframe URL', async () => {
      stubClipboardPaste('secret SRP words');
      initClipboard();

      const response = await dispatchMessage(
        {
          target: OffscreenCommunicationTarget.clipboardOffscreen,
          action: ClipboardAction.readClipboard,
        },
        {
          id: EXTENSION_ID,
          origin: EXTENSION_ORIGIN,
          url: `${EXTENSION_ORIGIN}/snaps/index.html`,
        } as chrome.runtime.MessageSender,
      );

      expect(response).toBeUndefined();
    });

    const allowedPages = [
      '/popup.html',
      '/popup-init.html',
      '/sidepanel.html',
      '/home.html',
    ];

    for (const page of allowedPages) {
      it(`accepts messages from allowed page ${page}`, async () => {
        stubClipboardPaste('hello world');
        initClipboard();

        const response = await dispatchMessage(
          {
            target: OffscreenCommunicationTarget.clipboardOffscreen,
            action: ClipboardAction.readClipboard,
          },
          trustedExtensionSender(page),
        );

        expect(response).toStrictEqual({
          success: true,
          text: 'hello world',
        });
      });
    }
  });

  describe('target filtering', () => {
    it('ignores messages with a different target', () => {
      initClipboard();

      const sendResponse = jest.fn();
      const result = listeners[0](
        {
          target: 'some-other-target',
          action: ClipboardAction.readClipboard,
        },
        trustedExtensionSender(),
        sendResponse,
      );

      expect(result).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
    });
  });

  describe('readClipboard action', () => {
    it('returns clipboard text on success', async () => {
      stubClipboardPaste('seed phrase words here');
      initClipboard();

      const response = await dispatchMessage(
        {
          target: OffscreenCommunicationTarget.clipboardOffscreen,
          action: ClipboardAction.readClipboard,
        },
        trustedExtensionSender(),
      );

      expect(response).toStrictEqual({
        success: true,
        text: 'seed phrase words here',
      });
    });

    it('returns an error when execCommand throws', async () => {
      execCommandMock.mockImplementation(() => {
        throw new Error('paste failed');
      });
      initClipboard();

      const response = await dispatchMessage(
        {
          target: OffscreenCommunicationTarget.clipboardOffscreen,
          action: ClipboardAction.readClipboard,
        },
        trustedExtensionSender(),
      );

      expect(response).toStrictEqual({
        success: false,
        error: 'paste failed',
      });
    });

    it('cleans up the temporary textarea even on error', () => {
      execCommandMock.mockImplementation(() => {
        throw new Error('paste failed');
      });
      initClipboard();

      const sendResponse = jest.fn();
      listeners[0](
        {
          target: OffscreenCommunicationTarget.clipboardOffscreen,
          action: ClipboardAction.readClipboard,
        },
        trustedExtensionSender(),
        sendResponse,
      );

      // No leftover textareas in the DOM
      expect(document.querySelectorAll('textarea')).toHaveLength(0);
    });
  });
});
