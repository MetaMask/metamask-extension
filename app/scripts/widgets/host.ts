import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import {
  getWidgetPageUrl,
  widgetFrameOrigin,
  WIDGET_POST_MESSAGES,
  type WidgetDefinition,
  type WidgetId,
  type WidgetInitMessage,
  type WidgetUpdateMessage,
} from './protocol';

function newAuthToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

async function registerFrame(widgetId: WidgetId, authToken: string) {
  try {
    const response = (await browser.runtime.sendMessage({
      type: EXTENSION_MESSAGES.REGISTER_WIDGET_FRAME,
      body: { widgetId, authToken },
    })) as { body?: { ok?: boolean } } | undefined;
    return response?.body?.ok === true;
  } catch {
    return false;
  }
}

function revokeFrame(widgetId: WidgetId, authToken: string | null) {
  if (!authToken) {
    return;
  }
  browser.runtime
    .sendMessage({
      type: EXTENSION_MESSAGES.REVOKE_WIDGET_FRAME,
      body: { widgetId, authToken },
    })
    .catch(() => undefined);
}

/**
 * Creates one frame and one authorization session per visible widget instance.
 * @param widget
 */
export function createWidgetFrame(widget: WidgetDefinition) {
  const widgetId = widget.id;
  const element = document.createElement('iframe');
  element.setAttribute('title', 'MetaMask');
  element.style.cssText =
    'display:block;width:100%;height:100%;border:0;color-scheme:normal;background:transparent;';

  let payload: unknown;
  let authToken: string | null = null;
  let lastUpdate: unknown;
  let hasLastUpdate = false;
  let generation = 0;
  let registrationQueue = Promise.resolve();

  const onFrameLoad = () => {
    if (!authToken) {
      return;
    }
    const message: WidgetInitMessage = {
      type: WIDGET_POST_MESSAGES.Init,
      widgetId,
      authToken,
      payload,
    };
    element.contentWindow?.postMessage(message, widgetFrameOrigin());
    if (hasLastUpdate) {
      element.contentWindow?.postMessage(
        {
          type: WIDGET_POST_MESSAGES.Update,
          widgetId,
          authToken,
          payload: lastUpdate,
        } satisfies WidgetUpdateMessage,
        widgetFrameOrigin(),
      );
    }
  };
  element.addEventListener('load', onFrameLoad);

  function hide() {
    generation += 1;
    const oldToken = authToken;
    authToken = null;
    payload = undefined;
    lastUpdate = undefined;
    hasLastUpdate = false;
    element.removeAttribute('src');
    revokeFrame(widgetId, oldToken);
  }

  function show(nextPayload: unknown) {
    hide();
    payload = nextPayload;
    const requestGeneration = generation;
    const nextToken = newAuthToken();
    authToken = nextToken;
    const registration = registrationQueue.then(() =>
      registerFrame(widgetId, nextToken),
    );
    registrationQueue = registration.then(() => undefined);
    registration.then((ok) => {
      if (!ok) {
        if (generation === requestGeneration) {
          authToken = null;
        }
        return;
      }
      if (generation !== requestGeneration) {
        revokeFrame(widgetId, nextToken);
        return;
      }
      element.src = getWidgetPageUrl();
    });
  }

  function sendUpdate(nextPayload: unknown) {
    if (!authToken) {
      return;
    }
    lastUpdate = nextPayload;
    hasLastUpdate = true;
    const message: WidgetUpdateMessage = {
      type: WIDGET_POST_MESSAGES.Update,
      widgetId,
      authToken,
      payload: nextPayload,
    };
    element.contentWindow?.postMessage(message, widgetFrameOrigin());
  }

  function dispose() {
    hide();
    element.removeEventListener('load', onFrameLoad);
    element.remove();
  }

  return { element, show, sendUpdate, hide, dispose };
}
