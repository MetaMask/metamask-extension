import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import {
  isAllowedWidgetOrigin,
  isWidgetId,
  WIDGETS,
  WIDGET_POST_MESSAGES,
  type WidgetId,
  type WidgetInitMessage,
  type WidgetUpdateMessage,
} from './protocol';
import { receiveWidgetUpdate } from './frame-updates';

const tokenPattern = /^[0-9a-f]{64}$/u;
const widgetLoaders = {
  [WIDGETS.Cashtag.id]: () => import('../cashtag/widget/frame'),
};

let activeSession: { widgetId: WidgetId; authToken: string } | null = null;
let candidateSession: { widgetId: WidgetId; authToken: string } | null = null;
let pendingUpdate: unknown;
let hasPendingUpdate = false;
let claimAttempted = false;

function isInitMessage(value: unknown): value is WidgetInitMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const message = value as Record<string, unknown>;
  return (
    message.type === WIDGET_POST_MESSAGES.Init &&
    isWidgetId(message.widgetId) &&
    typeof message.authToken === 'string' &&
    tokenPattern.test(message.authToken)
  );
}

function isUpdateMessage(value: unknown): value is WidgetUpdateMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const message = value as Record<string, unknown>;
  return (
    message.type === WIDGET_POST_MESSAGES.Update &&
    isWidgetId(message.widgetId) &&
    typeof message.authToken === 'string' &&
    tokenPattern.test(message.authToken)
  );
}

function claimFrame(widgetId: WidgetId, authToken: string) {
  return new Promise<boolean>((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: EXTENSION_MESSAGES.CLAIM_WIDGET_FRAME,
        body: { widgetId, authToken },
      },
      (response: { body?: { ok?: boolean } } | undefined) => {
        if (chrome.runtime.lastError) {
          resolve(false);
          return;
        }
        resolve(response?.body?.ok === true);
      },
    );
  });
}

window.addEventListener('message', async (event: MessageEvent<unknown>) => {
  if (event.source !== window.parent) {
    return;
  }
  const message = event.data;
  if (
    candidateSession &&
    isUpdateMessage(message) &&
    isAllowedWidgetOrigin(candidateSession.widgetId, event.origin) &&
    message.widgetId === candidateSession.widgetId &&
    message.authToken === candidateSession.authToken
  ) {
    if (activeSession) {
      receiveWidgetUpdate(message.payload);
    } else {
      pendingUpdate = message.payload;
      hasPendingUpdate = true;
    }
    return;
  }
  if (
    claimAttempted ||
    !isInitMessage(message) ||
    !isAllowedWidgetOrigin(message.widgetId, event.origin)
  ) {
    return;
  }
  claimAttempted = true;
  candidateSession = {
    widgetId: message.widgetId,
    authToken: message.authToken,
  };

  try {
    if (!(await claimFrame(message.widgetId, message.authToken))) {
      return;
    }
    activeSession = {
      widgetId: message.widgetId,
      authToken: message.authToken,
    };
    if (hasPendingUpdate) {
      receiveWidgetUpdate(pendingUpdate);
      pendingUpdate = undefined;
      hasPendingUpdate = false;
    }
    const widget = await widgetLoaders[message.widgetId]();
    await widget.mountFrame({
      authToken: message.authToken,
      payload: message.payload,
    });
  } catch {
    // An unauthorized or unavailable widget leaves the frame blank.
  }
});
