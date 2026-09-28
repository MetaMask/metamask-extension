import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import {
  createWidgetFrameAuthorization,
  type WidgetFrameAuthorization,
} from './authorization';
import {
  isWidgetControlMessage,
  isWidgetId,
  type WidgetActionName,
  type WidgetId,
} from './protocol';

type WidgetActionHandler = (
  payload: Record<string, unknown>,
  sender: chrome.runtime.MessageSender,
) => unknown;

export type WidgetBackgroundDefinition<
  WidgetIdentifier extends WidgetId = WidgetId,
> = {
  isEnabled: () => boolean;
  actions: Record<WidgetActionName<WidgetIdentifier>, WidgetActionHandler>;
};

export type WidgetBackgroundDefinitions = {
  [WidgetIdentifier in WidgetId]: WidgetBackgroundDefinition<WidgetIdentifier>;
};

type WidgetMessage = {
  type?: unknown;
  body?: Record<string, unknown>;
};

let registered = false;

function controlResponse(type: unknown, ok: boolean) {
  return { type, body: { ok } };
}

export function createWidgetFrameResponse(
  message: WidgetMessage | null | undefined,
  sender: chrome.runtime.MessageSender,
  definitions: WidgetBackgroundDefinitions,
  authorization: WidgetFrameAuthorization,
) {
  if (!isWidgetControlMessage(message?.type)) {
    return undefined;
  }
  const body = message?.body;
  const widgetId = body?.widgetId;
  const token = body?.authToken;
  const definition = isWidgetId(widgetId) ? definitions[widgetId] : undefined;

  switch (message?.type) {
    case EXTENSION_MESSAGES.REGISTER_WIDGET_FRAME:
      return controlResponse(
        message.type,
        Boolean(
          definition?.isEnabled() &&
          authorization.register(widgetId, token, sender),
        ),
      );
    case EXTENSION_MESSAGES.CLAIM_WIDGET_FRAME:
      return controlResponse(
        message.type,
        Boolean(
          definition?.isEnabled() &&
          authorization.claim(widgetId, token, sender),
        ),
      );
    case EXTENSION_MESSAGES.REVOKE_WIDGET_FRAME:
      return controlResponse(
        message.type,
        authorization.revoke(widgetId, token, sender),
      );
    case EXTENSION_MESSAGES.WIDGET_FRAME_ACTION: {
      const action = body?.action;
      const payload = body?.payload;
      if (
        !definition?.isEnabled() ||
        typeof action !== 'string' ||
        !Object.hasOwn(definition.actions, action) ||
        !payload ||
        typeof payload !== 'object' ||
        Array.isArray(payload) ||
        !authorization.isAuthorized(widgetId, token, sender)
      ) {
        return undefined;
      }
      return definition.actions[action as WidgetActionName](
        payload as Record<string, unknown>,
        sender,
      );
    }
    default:
      return undefined;
  }
}

export function registerWidgetBackgroundBridge(
  definitions: WidgetBackgroundDefinitions,
) {
  if (registered) {
    return;
  }
  registered = true;
  const authorization = createWidgetFrameAuthorization();
  chrome.tabs.onRemoved.addListener(authorization.removeTab);
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const response = createWidgetFrameResponse(
      message,
      sender,
      definitions,
      authorization,
    );
    if (response === undefined) {
      return false;
    }
    Promise.resolve(response)
      .then(sendResponse)
      .catch(() => sendResponse(undefined));
    return true;
  });
}
