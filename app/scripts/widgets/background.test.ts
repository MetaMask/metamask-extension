import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import { createWidgetFrameAuthorization } from './authorization';
import {
  createWidgetFrameResponse,
  type WidgetBackgroundDefinitions,
} from './background';
import { WIDGETS } from './protocol';

const authToken = 'a'.repeat(64);
const xTab = { id: 3, url: 'https://x.com/home' } as chrome.tabs.Tab;
const parent = {
  id: 'testid',
  frameId: 0,
  tab: xTab,
  url: 'https://x.com/home',
} as chrome.runtime.MessageSender;
const frame = {
  id: 'testid',
  frameId: 2,
  documentId: 'widget-document',
  tab: xTab,
  url: 'chrome-extension://testid/widget.html',
} as chrome.runtime.MessageSender;

describe('createWidgetFrameResponse', () => {
  const action = jest.fn().mockResolvedValue({ body: { ok: true } });
  let enabled = true;
  const definitions: WidgetBackgroundDefinitions = {
    [WIDGETS.Cashtag.id]: {
      isEnabled: () => enabled,
      actions: {
        [EXTENSION_MESSAGES.GET_DATA]: action,
        [EXTENSION_MESSAGES.OPEN_EXTENSION]: action,
        [EXTENSION_MESSAGES.SET_X_WIDGET_ENABLED]: action,
      },
    },
  };

  beforeEach(() => {
    action.mockClear();
    enabled = true;
    Object.assign(chrome.runtime, {
      id: 'testid',
      getURL: (path: string) => `chrome-extension://testid/${path}`,
    });
  });

  it('dispatches an allowed action only after the frame claims its token', async () => {
    const authorization = createWidgetFrameAuthorization();
    const message = {
      type: EXTENSION_MESSAGES.WIDGET_FRAME_ACTION,
      body: {
        widgetId: WIDGETS.Cashtag.id,
        authToken,
        action: EXTENSION_MESSAGES.GET_DATA,
        payload: { symbol: 'ETH' },
      },
    };

    expect(
      createWidgetFrameResponse(message, frame, definitions, authorization),
    ).toBeUndefined();
    expect(
      createWidgetFrameResponse(
        {
          type: EXTENSION_MESSAGES.REGISTER_WIDGET_FRAME,
          body: { widgetId: WIDGETS.Cashtag.id, authToken },
        },
        parent,
        definitions,
        authorization,
      ),
    ).toEqual({
      type: EXTENSION_MESSAGES.REGISTER_WIDGET_FRAME,
      body: { ok: true },
    });
    expect(
      createWidgetFrameResponse(
        {
          type: EXTENSION_MESSAGES.CLAIM_WIDGET_FRAME,
          body: { widgetId: WIDGETS.Cashtag.id, authToken },
        },
        frame,
        definitions,
        authorization,
      ),
    ).toEqual({
      type: EXTENSION_MESSAGES.CLAIM_WIDGET_FRAME,
      body: { ok: true },
    });

    await createWidgetFrameResponse(message, frame, definitions, authorization);

    expect(action).toHaveBeenCalledWith({ symbol: 'ETH' }, frame);
  });

  it('rejects unknown actions and another frame document', () => {
    const authorization = createWidgetFrameAuthorization();
    authorization.register(WIDGETS.Cashtag.id, authToken, parent);
    authorization.claim(WIDGETS.Cashtag.id, authToken, frame);

    expect(
      createWidgetFrameResponse(
        {
          type: EXTENSION_MESSAGES.WIDGET_FRAME_ACTION,
          body: {
            widgetId: WIDGETS.Cashtag.id,
            authToken,
            action: 'unknown',
            payload: {},
          },
        },
        frame,
        definitions,
        authorization,
      ),
    ).toBeUndefined();
    expect(
      createWidgetFrameResponse(
        {
          type: EXTENSION_MESSAGES.WIDGET_FRAME_ACTION,
          body: {
            widgetId: WIDGETS.Cashtag.id,
            authToken,
            action: EXTENSION_MESSAGES.GET_DATA,
            payload: {},
          },
        },
        { ...frame, documentId: 'another-document' },
        definitions,
        authorization,
      ),
    ).toBeUndefined();
    expect(action).not.toHaveBeenCalled();
  });

  it('rejects registration while the widget is disabled', () => {
    enabled = false;
    const authorization = createWidgetFrameAuthorization();

    expect(
      createWidgetFrameResponse(
        {
          type: EXTENSION_MESSAGES.REGISTER_WIDGET_FRAME,
          body: { widgetId: WIDGETS.Cashtag.id, authToken },
        },
        parent,
        definitions,
        authorization,
      ),
    ).toEqual({
      type: EXTENSION_MESSAGES.REGISTER_WIDGET_FRAME,
      body: { ok: false },
    });
  });
});
