import { EXTENSION_MESSAGES } from '#shared/constants/messages';

export const WIDGET_PAGE_PATH = 'widget.html';

export function defineWidget<
  const WidgetIdentifier extends string,
  const Actions extends readonly string[],
>(definition: {
  id: WidgetIdentifier;
  origins: readonly string[];
  actions: Actions;
}) {
  return definition;
}

export const WIDGETS = {
  Cashtag: defineWidget({
    id: 'x-cashtag',
    origins: ['https://x.com', 'https://www.x.com'],
    actions: [
      EXTENSION_MESSAGES.GET_DATA,
      EXTENSION_MESSAGES.OPEN_EXTENSION,
      EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED,
    ],
  }),
} as const;

export type WidgetDefinition = (typeof WIDGETS)[keyof typeof WIDGETS];
export type WidgetId = WidgetDefinition['id'];
export type WidgetActionName<WidgetIdentifier extends WidgetId = WidgetId> =
  Extract<WidgetDefinition, { id: WidgetIdentifier }>['actions'][number];

const widgetsById: ReadonlyMap<WidgetId, WidgetDefinition> = new Map(
  Object.values(WIDGETS).map((widget) => [widget.id, widget]),
);
if (widgetsById.size !== Object.keys(WIDGETS).length) {
  throw new Error('Widget IDs must be unique');
}

export const WIDGET_POST_MESSAGES = {
  Init: 'METAMASK_WIDGET_INIT',
  Update: 'METAMASK_WIDGET_UPDATE',
} as const;

export type WidgetInitMessage = {
  type: typeof WIDGET_POST_MESSAGES.Init;
  widgetId: WidgetId;
  authToken: string;
  payload: unknown;
};

export type WidgetUpdateMessage = {
  type: typeof WIDGET_POST_MESSAGES.Update;
  widgetId: WidgetId;
  authToken: string;
  payload: unknown;
};

export function isWidgetId(value: unknown): value is WidgetId {
  return typeof value === 'string' && widgetsById.has(value as WidgetId);
}

export function isAllowedWidgetOrigin(widgetId: WidgetId, origin: string) {
  return widgetsById.get(widgetId)?.origins.includes(origin) ?? false;
}

export function getWidgetPageUrl() {
  return chrome.runtime.getURL(WIDGET_PAGE_PATH);
}

export function widgetFrameOrigin() {
  const url = new URL(getWidgetPageUrl());
  return `${url.protocol}//${url.host}`;
}

export function isWidgetControlMessage(type: unknown) {
  return (
    type === EXTENSION_MESSAGES.REGISTER_WIDGET_FRAME ||
    type === EXTENSION_MESSAGES.CLAIM_WIDGET_FRAME ||
    type === EXTENSION_MESSAGES.REVOKE_WIDGET_FRAME ||
    type === EXTENSION_MESSAGES.WIDGET_FRAME_ACTION
  );
}
