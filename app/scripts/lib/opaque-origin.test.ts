import { SubjectType } from '@metamask/permission-controller';

import { isOpaqueWebsiteSender, OPAQUE_ORIGIN } from './opaque-origin';

describe('isOpaqueWebsiteSender', () => {
  it('returns true for a sandboxed http frame', () => {
    expect(
      isOpaqueWebsiteSender(SubjectType.Website, {
        origin: OPAQUE_ORIGIN,
        url: 'http://127.0.0.1:8798/child.html',
      }),
    ).toBe(true);
  });

  it('returns true for a sandboxed https frame', () => {
    expect(
      isOpaqueWebsiteSender(SubjectType.Website, {
        origin: OPAQUE_ORIGIN,
        url: 'https://dapp.test/x',
      }),
    ).toBe(true);
  });

  it('returns true for a top-level document served with CSP sandbox', () => {
    // Same shape as the iframe case: the browser reports an opaque origin
    // while the URL is the https document that was served.
    expect(
      isOpaqueWebsiteSender(SubjectType.Website, {
        origin: OPAQUE_ORIGIN,
        url: 'https://dapp.test/user-content',
      }),
    ).toBe(true);
  });

  it('returns false for an ordinary same-origin frame', () => {
    expect(
      isOpaqueWebsiteSender(SubjectType.Website, {
        origin: 'https://dapp.test',
        url: 'https://dapp.test/child.html',
      }),
    ).toBe(false);
  });

  it('returns false for an ordinary cross-origin frame', () => {
    expect(
      isOpaqueWebsiteSender(SubjectType.Website, {
        origin: 'https://widget.test',
        url: 'https://widget.test/embed.html',
      }),
    ).toBe(false);
  });

  it('returns false when the browser does not report an origin', () => {
    // Older browsers, and senders that are not `MessageSender` (Snaps).
    expect(
      isOpaqueWebsiteSender(SubjectType.Website, {
        url: 'https://dapp.test/x',
      }),
    ).toBe(false);
    expect(isOpaqueWebsiteSender(SubjectType.Website, undefined)).toBe(false);
  });

  it('leaves file:// senders alone even though their URL origin is "null"', () => {
    expect(new URL('file:///x/y.html').origin).toBe(OPAQUE_ORIGIN);
    expect(
      isOpaqueWebsiteSender(SubjectType.Website, {
        origin: OPAQUE_ORIGIN,
        url: 'file:///x/y.html',
      }),
    ).toBe(false);
  });

  it('returns false for an unparseable or missing url', () => {
    expect(
      isOpaqueWebsiteSender(SubjectType.Website, {
        origin: OPAQUE_ORIGIN,
        url: 'not a url',
      }),
    ).toBe(false);
    expect(
      isOpaqueWebsiteSender(SubjectType.Website, { origin: OPAQUE_ORIGIN }),
    ).toBe(false);
  });
});

describe('isOpaqueWebsiteSender — subject type', () => {
  const opaque = { origin: OPAQUE_ORIGIN, url: 'https://dapp.test/child.html' };

  it('refuses an opaque website sender', () => {
    expect(isOpaqueWebsiteSender(SubjectType.Website, opaque)).toBe(true);
  });

  it('leaves extension senders on the existing derivation', () => {
    expect(isOpaqueWebsiteSender(SubjectType.Extension, opaque)).toBe(false);
  });

  it('leaves snap and internal senders alone', () => {
    expect(isOpaqueWebsiteSender(SubjectType.Snap, opaque)).toBe(false);
    expect(isOpaqueWebsiteSender(SubjectType.Internal, opaque)).toBe(false);
  });

  it('returns false when the subject type is unresolved', () => {
    expect(isOpaqueWebsiteSender(undefined, opaque)).toBe(false);
  });
});
