import { createWidgetFrameAuthorization } from './authorization';

const token = 'a'.repeat(64);
const otherToken = 'b'.repeat(64);
const xTab = { id: 7, url: 'https://x.com/home' } as chrome.tabs.Tab;

function sender(overrides: Partial<chrome.runtime.MessageSender>) {
  return {
    id: 'testid',
    ...overrides,
  } as chrome.runtime.MessageSender;
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
  url: 'chrome-extension://testid/cashtag-widget.html',
});

describe('createWidgetFrameAuthorization', () => {
  beforeEach(() => {
    Object.assign(chrome.runtime, {
      id: 'testid',
      getURL: (path: string) => `chrome-extension://testid/${path}`,
    });
  });

  it('rejects registration from another site or a nested X frame', () => {
    const authorization = createWidgetFrameAuthorization();

    expect(
      authorization.register(
        token,
        sender({ ...parent, url: 'https://example.com/' }),
      ),
    ).toBe(false);
    expect(
      authorization.register(token, sender({ ...parent, frameId: 1 })),
    ).toBe(false);
    expect(authorization.claim(token, frame)).toBe(false);
  });

  it('accepts only a pending single-use token for the matching X tab', () => {
    const authorization = createWidgetFrameAuthorization();
    authorization.register(token, parent);

    expect(authorization.claim(otherToken, frame)).toBe(false);
    expect(
      authorization.claim(
        token,
        sender({
          ...frame,
          tab: { id: 8, url: 'https://x.com/home' } as chrome.tabs.Tab,
        }),
      ),
    ).toBe(false);
    expect(authorization.claim(token, frame)).toBe(true);
    expect(authorization.claim(token, frame)).toBe(false);
    expect(authorization.isAuthorized(token, frame)).toBe(true);
  });

  it('rejects an expired registration', () => {
    let time = 100;
    const authorization = createWidgetFrameAuthorization(() => time);
    authorization.register(token, parent);
    time += 15_001;

    expect(authorization.claim(token, frame)).toBe(false);
  });

  it('binds authorization to the frame document and registered parent', () => {
    const authorization = createWidgetFrameAuthorization();
    authorization.register(token, parent);
    authorization.claim(token, frame);

    expect(
      authorization.isAuthorized(
        token,
        sender({ ...frame, documentId: 'new-document' }),
      ),
    ).toBe(false);
    expect(
      authorization.isAuthorized(token, sender({ ...frame, frameId: 5 })),
    ).toBe(false);
    expect(
      authorization.revoke(
        token,
        sender({ ...parent, documentId: 'new-parent' }),
      ),
    ).toBe(false);
    expect(authorization.revoke(token, parent)).toBe(true);
    expect(authorization.isAuthorized(token, frame)).toBe(false);
  });

  it('rejects a widget document on another site or with query parameters', () => {
    const authorization = createWidgetFrameAuthorization();
    authorization.register(token, parent);

    expect(
      authorization.claim(
        token,
        sender({
          ...frame,
          tab: { id: 7, url: 'https://example.com/' } as chrome.tabs.Tab,
        }),
      ),
    ).toBe(false);
    expect(
      authorization.claim(
        token,
        sender({ ...frame, url: `${frame.url}?symbol=ETH` }),
      ),
    ).toBe(false);
  });
});
