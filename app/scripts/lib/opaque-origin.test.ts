import { isOpaqueWebSender, OPAQUE_ORIGIN } from './opaque-origin';

describe('isOpaqueWebSender', () => {
  it('returns true for a sandboxed http frame', () => {
    expect(
      isOpaqueWebSender({
        origin: OPAQUE_ORIGIN,
        url: 'http://127.0.0.1:8798/child.html',
      }),
    ).toBe(true);
  });

  it('returns true for a sandboxed https frame', () => {
    expect(
      isOpaqueWebSender({ origin: OPAQUE_ORIGIN, url: 'https://dapp.test/x' }),
    ).toBe(true);
  });

  it('returns true for a top-level document served with CSP sandbox', () => {
    // Same shape as the iframe case: the browser reports an opaque origin
    // while the URL is the https document that was served.
    expect(
      isOpaqueWebSender({
        origin: OPAQUE_ORIGIN,
        url: 'https://dapp.test/user-content',
      }),
    ).toBe(true);
  });

  it('returns false for an ordinary same-origin frame', () => {
    expect(
      isOpaqueWebSender({
        origin: 'https://dapp.test',
        url: 'https://dapp.test/child.html',
      }),
    ).toBe(false);
  });

  it('returns false for an ordinary cross-origin frame', () => {
    expect(
      isOpaqueWebSender({
        origin: 'https://widget.test',
        url: 'https://widget.test/embed.html',
      }),
    ).toBe(false);
  });

  it('returns false when the browser does not report an origin', () => {
    // Older browsers, and senders that are not `MessageSender` (Snaps).
    expect(isOpaqueWebSender({ url: 'https://dapp.test/x' })).toBe(false);
    expect(isOpaqueWebSender(undefined)).toBe(false);
  });

  it('leaves file:// senders alone even though their URL origin is "null"', () => {
    expect(new URL('file:///x/y.html').origin).toBe(OPAQUE_ORIGIN);
    expect(
      isOpaqueWebSender({ origin: OPAQUE_ORIGIN, url: 'file:///x/y.html' }),
    ).toBe(false);
  });

  it('returns false for an unparseable or missing url', () => {
    expect(isOpaqueWebSender({ origin: OPAQUE_ORIGIN, url: 'not a url' })).toBe(
      false,
    );
    expect(isOpaqueWebSender({ origin: OPAQUE_ORIGIN })).toBe(false);
  });
});
