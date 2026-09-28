import { receiveWidgetUpdate } from './frame-updates';
import './widget-bootstrap';

jest.mock('./frame-updates', () => ({ receiveWidgetUpdate: jest.fn() }));
jest.mock('../cashtag/widget/frame', () => ({ mountFrame: jest.fn() }));

describe('widget bootstrap updates', () => {
  it('forwards only updates from the registered parent with the matching token', async () => {
    const token = 'a'.repeat(64);
    Object.assign(chrome.runtime, {
      sendMessage: jest.fn(
        (
          _message: unknown,
          callback: (response: { body: { ok: boolean } }) => void,
        ) => callback({ body: { ok: true } }),
      ),
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        source: window,
        origin: 'https://x.com',
        data: {
          type: 'METAMASK_WIDGET_INIT',
          widgetId: 'x-cashtag',
          authToken: token,
          payload: { symbol: 'BTC', theme: 'dark' },
        },
      }),
    );
    await Promise.resolve();

    for (const [origin, authToken] of [
      ['https://evil.example', token],
      ['https://x.com', 'b'.repeat(64)],
    ]) {
      window.dispatchEvent(
        new MessageEvent('message', {
          source: window,
          origin,
          data: {
            type: 'METAMASK_WIDGET_UPDATE',
            widgetId: 'x-cashtag',
            authToken,
            payload: { type: 'cashtag.theme', theme: 'light' },
          },
        }),
      );
    }
    expect(receiveWidgetUpdate).not.toHaveBeenCalled();

    window.dispatchEvent(
      new MessageEvent('message', {
        source: window,
        origin: 'https://x.com',
        data: {
          type: 'METAMASK_WIDGET_UPDATE',
          widgetId: 'x-cashtag',
          authToken: token,
          payload: { type: 'cashtag.theme', theme: 'light' },
        },
      }),
    );
    expect(receiveWidgetUpdate).toHaveBeenCalledWith({
      type: 'cashtag.theme',
      theme: 'light',
    });
  });
});
