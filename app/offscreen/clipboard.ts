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
  textarea.focus();
  // eslint-disable-next-line deprecation/deprecation -- see JSDoc above
  document.execCommand('paste');
  const text = textarea.value;
  document.body.removeChild(textarea);
  return text;
}

/**
 * Initializes the clipboard offscreen handler.
 * Listens for clipboard read requests from extension pages (e.g. side panel)
 * and responds with the clipboard text.
 */
export default function initClipboard(): void {
  chrome.runtime.onMessage.addListener(
    (
      msg: {
        target: string;
        action: ClipboardAction;
      },
      _sender,
      sendResponse,
    ) => {
      if (msg.target !== OffscreenCommunicationTarget.clipboardOffscreen) {
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
