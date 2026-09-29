import browser from 'webextension-polyfill';
import { EXTENSION_MESSAGES } from '#shared/constants/messages';
import { createWidgetFrame } from './host';
import { WIDGETS } from './protocol';

jest.mock('webextension-polyfill', () => ({
  runtime: { sendMessage: jest.fn() },
}));

type WidgetMessage = {
  type: string;
  body: { authToken: string };
};

describe('createWidgetFrame', () => {
  beforeEach(() => {
    Object.assign(chrome.runtime, {
      getURL: (path: string) => `chrome-extension://testid/${path}`,
    });
    jest.mocked(browser.runtime.sendMessage).mockReset();
  });

  it('revokes a registration that finishes after the frame hides', async () => {
    let finishRegistration: (value: unknown) => void = () => undefined;
    jest.mocked(browser.runtime.sendMessage).mockImplementation((message) => {
      if (
        (message as WidgetMessage).type ===
        EXTENSION_MESSAGES.REGISTER_WIDGET_FRAME
      ) {
        return new Promise((resolve) => {
          finishRegistration = resolve;
        });
      }
      return Promise.resolve(undefined);
    });
    const widget = createWidgetFrame(WIDGETS.Cashtag);
    widget.show({ symbol: 'BTC' });
    await Promise.resolve();

    widget.hide();
    finishRegistration({ body: { ok: true } });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    const messages = jest
      .mocked(browser.runtime.sendMessage)
      .mock.calls.map(([message]) => message as WidgetMessage);
    const registration = messages.find(
      (message) => message.type === EXTENSION_MESSAGES.REGISTER_WIDGET_FRAME,
    );
    const revocations = messages.filter(
      (message) => message.type === EXTENSION_MESSAGES.REVOKE_WIDGET_FRAME,
    );
    expect(revocations).toHaveLength(2);
    expect(revocations[0].body.authToken).toBe(registration?.body.authToken);
    expect(revocations[1].body.authToken).toBe(registration?.body.authToken);
    expect(widget.element.hasAttribute('src')).toBe(false);
    widget.dispose();
  });

  it('sends an update only while its frame has a registered token', async () => {
    jest.mocked(browser.runtime.sendMessage).mockResolvedValue({
      body: { ok: true },
    });
    const widget = createWidgetFrame(WIDGETS.Cashtag);
    document.documentElement.appendChild(widget.element);
    const beforeWindow = widget.element.contentWindow;
    if (!beforeWindow) {
      throw new Error('Widget frame has no content window');
    }
    const beforeNavigation = jest.spyOn(beforeWindow, 'postMessage');

    widget.sendUpdate({ type: 'cashtag.theme', theme: 'dark' });
    expect(beforeNavigation).not.toHaveBeenCalled();

    widget.show({ symbol: 'BTC', theme: 'light' });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const registration = jest
      .mocked(browser.runtime.sendMessage)
      .mock.calls.find(
        ([message]) =>
          (message as WidgetMessage).type ===
          EXTENSION_MESSAGES.REGISTER_WIDGET_FRAME,
      );
    const token = (registration?.[0] as WidgetMessage).body.authToken;

    beforeNavigation.mockRestore();
    const activeWindow = widget.element.contentWindow;
    if (!activeWindow) {
      throw new Error('Widget frame has no content window after navigation');
    }
    const postMessage = jest.spyOn(activeWindow, 'postMessage');
    widget.sendUpdate({ type: 'cashtag.theme', theme: 'dark' });
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: 'METAMASK_WIDGET_UPDATE',
        widgetId: WIDGETS.Cashtag.id,
        authToken: token,
        payload: { type: 'cashtag.theme', theme: 'dark' },
      },
      'chrome-extension://testid',
    );

    widget.hide();
    postMessage.mockClear();
    widget.sendUpdate({ type: 'cashtag.theme', theme: 'light' });
    expect(postMessage).not.toHaveBeenCalled();
    widget.dispose();
  });
});
