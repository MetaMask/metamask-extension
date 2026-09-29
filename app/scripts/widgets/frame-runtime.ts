import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import type { WidgetActionName, WidgetId } from './protocol';

let session: { widgetId: WidgetId; authToken: string } | null = null;

export function setWidgetSession(widgetId: WidgetId, authToken: string) {
  session = { widgetId, authToken };
}

export function sendWidgetAction(
  action: WidgetActionName,
  payload: Record<string, unknown> = {},
) {
  if (!session) {
    return Promise.reject(new Error('Widget frame is not authorized'));
  }
  return browser.runtime.sendMessage({
    type: EXTENSION_MESSAGES.WIDGET_FRAME_ACTION,
    body: { ...session, action, payload },
  });
}
