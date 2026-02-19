import {
  ClipboardAction,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';

/**
 * Reads clipboard text inside the offscreen document.
 *
 * execCommand('paste') requires a focused, editable element to paste into,
 * so we create a temporary textarea, paste into it, read the value, and
 * remove it. navigator.clipboard.readText() silently fails in offscreen
 * documents (https://issuetracker.google.com/issues/41497480), making
 * execCommand the only working option.
 *
 * Requires the 'clipboardRead' extension permission.
 *
 * @returns The clipboard text content.
 */
function readClipboardText(): string {
  const textarea = document.createElement('textarea');
  document.body.appendChild(textarea);
  try {
    textarea.focus();
    // eslint-disable-next-line deprecation/deprecation -- see JSDoc above
    document.execCommand('paste');
    const text = textarea.value;
    return text;
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * Extension page paths that are allowed to read the clipboard through the
 * offscreen handler. Only first-party UI pages are included — the offscreen
 * document itself and Snap iframes are deliberately excluded.
 */
const ALLOWED_EXTENSION_PAGE_PATHS = new Set([
  '/popup.html',
  '/popup-init.html',
  '/sidepanel.html',
  '/home.html',
]);

/**
 * Returns `true` when the sender is a first-party extension page such as the
 * popup or side panel — i.e. it belongs to **this** extension and is **not**
 * a content script, another extension, or an internal page like the offscreen
 * document.
 *
 * Checks performed (all must pass):
 * 1. `sender.id === chrome.runtime.id` — rejects other extensions.
 * 2. `!sender.tab` — rejects content scripts, which always carry a `tab`
 *    property referencing the web-page tab they live in.
 * 3. `sender.origin` matches the extension origin — rejects opaque or
 *    cross-origin senders (e.g. sandboxed iframes).
 * 4. `sender.url` pathname is in {@link ALLOWED_EXTENSION_PAGE_PATHS} —
 *    rejects unexpected contexts such as the offscreen document itself or
 *    Snap iframes.
 *
 * @param sender - The `MessageSender` provided by `chrome.runtime.onMessage`.
 * @returns Whether the sender is a trusted extension page.
 */
function isTrustedExtensionSender(
  sender: chrome.runtime.MessageSender,
): boolean {
  if (sender.id !== chrome.runtime.id || sender.tab) {
    return false;
  }

  const expectedOrigin = `chrome-extension://${chrome.runtime.id}`;
  if (sender.origin !== expectedOrigin) {
    return false;
  }

  if (!sender.url) {
    return false;
  }

  try {
    const { pathname } = new URL(sender.url);
    return ALLOWED_EXTENSION_PAGE_PATHS.has(pathname);
  } catch {
    return false;
  }
}

/**
 * Initializes the clipboard offscreen handler.
 * Listens for clipboard read requests from extension pages (e.g. side panel)
 * and responds with the clipboard text.
 *
 * ── Security notes ──────────────────────────────────────────────────────
 *
 * **Sensitive data**: The clipboard may contain a Secret Recovery Phrase
 * (SRP). The response is delivered *only* to the original caller via the
 * `sendResponse` callback — it is **not** broadcast to other
 * `chrome.runtime.onMessage` listeners. `sendResponse` is a one-shot
 * reply channel scoped to the sender of the message.
 *
 * **Sender validation**: Before reading the clipboard we verify that the
 * request originates from a first-party extension page (popup / side panel)
 * and not from a content script or another extension. This prevents
 * compromised web-page contexts or rogue Snaps from exfiltrating
 * clipboard contents.
 *
 * **Constraints that MUST be maintained**:
 * 1. Never log, persist, or emit clipboard text to Sentry / telemetry /
 *    breadcrumbs.
 * 2. Never relay the clipboard text through a second `sendMessage` call.
 * 3. Keep sender validation in this handler — removing it would let any
 *    content script read the user's clipboard.
 * ─────────────────────────────────────────────────────────────────────────
 */
export default function initClipboard(): void {
  chrome.runtime.onMessage.addListener(
    (
      msg: {
        target: string;
        action: ClipboardAction;
      },
      sender,
      sendResponse,
    ) => {
      if (msg.target !== OffscreenCommunicationTarget.clipboardOffscreen) {
        return false;
      }

      // Reject requests that do not come from a trusted extension page.
      // Content scripts (sender.tab is set) and other extensions
      // (sender.id !== ours) are not allowed to read the clipboard through
      // this handler. See JSDoc on initClipboard for full rationale.
      if (!isTrustedExtensionSender(sender)) {
        return false;
      }

      if (msg.action === ClipboardAction.readClipboard) {
        try {
          const text = readClipboardText();
          sendResponse({ success: true, text });
        } catch (error) {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        return true;
      }

      return false;
    },
  );
}
