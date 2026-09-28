import { createWidgetFrameAuthorization } from './authorization';
import { WIDGETS } from './protocol';

const token = 'a'.repeat(64);
const otherToken = 'b'.repeat(64);
const xTab = { id: 7, url: 'https://x.com/home' } as chrome.tabs.Tab;

function sender(overrides: Partial<chrome.runtime.MessageSender>) {
  return { id: 'testid', ...overrides } as chrome.runtime.MessageSender;
}

const parent = sender({
  tab: xTab,
  frameId: 0,
  documentId: 'parent-document',
  url: 'https://x.com/home',
});
const frame = sender({
  tab: xTab,
  frameId: 4,
  documentId: 'widget-document',
  url: 'chrome-extension://testid/widget.html',
});

describe('createWidgetFrameAuthorization', () => {
  beforeEach(() => {
    Object.assign(chrome.runtime, {
      id: 'testid',
      getURL: (path: string) => `chrome-extension://testid/${path}`,
    });
  });

  it('rejects registration from another site or a nested frame', () => {
    const authorization = createWidgetFrameAuthorization();

    expect(
      authorization.register(
        WIDGETS.Cashtag.id,
        token,
        sender({ ...parent, url: 'https://example.com/' }),
      ),
    ).toBe(false);
    expect(
      authorization.register(
        WIDGETS.Cashtag.id,
        token,
        sender({ ...parent, frameId: 1 }),
      ),
    ).toBe(false);
    expect(authorization.claim(WIDGETS.Cashtag.id, token, frame)).toBe(false);
  });

  it('binds independent widget instances to their own frames', () => {
    const authorization = createWidgetFrameAuthorization();
    const secondFrame = sender({ ...frame, frameId: 5, documentId: 'second' });

    expect(authorization.register(WIDGETS.Cashtag.id, token, parent)).toBe(
      true,
    );
    expect(authorization.register(WIDGETS.Cashtag.id, otherToken, parent)).toBe(
      true,
    );
    expect(authorization.claim(WIDGETS.Cashtag.id, token, frame)).toBe(true);
    expect(
      authorization.claim(WIDGETS.Cashtag.id, otherToken, secondFrame),
    ).toBe(true);
    expect(authorization.isAuthorized(WIDGETS.Cashtag.id, token, frame)).toBe(
      true,
    );
    expect(
      authorization.isAuthorized(WIDGETS.Cashtag.id, otherToken, secondFrame),
    ).toBe(true);
    expect(
      authorization.isAuthorized(WIDGETS.Cashtag.id, token, secondFrame),
    ).toBe(false);
  });

  it('accepts only a pending single-use token for the matching tab', () => {
    const authorization = createWidgetFrameAuthorization();
    authorization.register(WIDGETS.Cashtag.id, token, parent);

    expect(authorization.claim(WIDGETS.Cashtag.id, otherToken, frame)).toBe(
      false,
    );
    expect(
      authorization.claim(
        WIDGETS.Cashtag.id,
        token,
        sender({
          ...frame,
          tab: { id: 8, url: 'https://x.com/home' } as chrome.tabs.Tab,
        }),
      ),
    ).toBe(false);
    expect(authorization.claim(WIDGETS.Cashtag.id, token, frame)).toBe(true);
    expect(authorization.claim(WIDGETS.Cashtag.id, token, frame)).toBe(false);
  });

  it('rejects an expired registration', () => {
    let time = 100;
    const authorization = createWidgetFrameAuthorization(() => time);
    authorization.register(WIDGETS.Cashtag.id, token, parent);
    time += 15_001;

    expect(authorization.claim(WIDGETS.Cashtag.id, token, frame)).toBe(false);
  });

  it('binds authorization to the frame document and registered parent', () => {
    const authorization = createWidgetFrameAuthorization();
    authorization.register(WIDGETS.Cashtag.id, token, parent);
    authorization.claim(WIDGETS.Cashtag.id, token, frame);

    expect(
      authorization.isAuthorized(
        WIDGETS.Cashtag.id,
        token,
        sender({ ...frame, documentId: 'new-document' }),
      ),
    ).toBe(false);
    expect(
      authorization.revoke(
        WIDGETS.Cashtag.id,
        token,
        sender({ ...parent, documentId: 'new-parent' }),
      ),
    ).toBe(false);
    expect(authorization.revoke(WIDGETS.Cashtag.id, token, parent)).toBe(true);
    expect(authorization.isAuthorized(WIDGETS.Cashtag.id, token, frame)).toBe(
      false,
    );
  });

  it('rejects a frame on another site or with query parameters', () => {
    const authorization = createWidgetFrameAuthorization();
    authorization.register(WIDGETS.Cashtag.id, token, parent);

    expect(
      authorization.claim(
        WIDGETS.Cashtag.id,
        token,
        sender({
          ...frame,
          tab: { id: 7, url: 'https://example.com/' } as chrome.tabs.Tab,
        }),
      ),
    ).toBe(false);
    expect(
      authorization.claim(
        WIDGETS.Cashtag.id,
        token,
        sender({ ...frame, url: `${frame.url}?symbol=ETH` }),
      ),
    ).toBe(false);
  });

  it('removes only sessions for the closed tab', () => {
    const authorization = createWidgetFrameAuthorization();
    authorization.register(WIDGETS.Cashtag.id, token, parent);
    authorization.register(
      WIDGETS.Cashtag.id,
      otherToken,
      sender({
        ...parent,
        tab: { id: 8, url: 'https://x.com/home' } as chrome.tabs.Tab,
      }),
    );

    authorization.removeTab(7);

    expect(authorization.claim(WIDGETS.Cashtag.id, token, frame)).toBe(false);
    expect(
      authorization.claim(
        WIDGETS.Cashtag.id,
        otherToken,
        sender({
          ...frame,
          tab: { id: 8, url: 'https://x.com/home' } as chrome.tabs.Tab,
        }),
      ),
    ).toBe(true);
  });

  it('bounds live sessions per tab', () => {
    const authorization = createWidgetFrameAuthorization();
    for (let index = 0; index < 32; index += 1) {
      const nextToken = index.toString(16).padStart(64, '0');
      expect(
        authorization.register(WIDGETS.Cashtag.id, nextToken, parent),
      ).toBe(true);
    }

    expect(
      authorization.register(WIDGETS.Cashtag.id, 'f'.repeat(64), parent),
    ).toBe(false);
  });
});
