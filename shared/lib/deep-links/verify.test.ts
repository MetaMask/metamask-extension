import { it as jestIt } from '@jest/globals';

import type * as Verify from './verify';

jest.mock('./helpers', () => ({
  getKeyData: jest.fn(() => new Uint8Array([1, 2, 3])),
  sigToBytes: jest.fn((_: string) => new Uint8Array([4, 5, 6])),
}));

const mockVerify = jest.fn();
const mockImportKey = jest.fn();

Object.defineProperty(globalThis.crypto, 'subtle', {
  value: {
    importKey: mockImportKey,
    verify: mockVerify,
  },
});

describe('verify', () => {
  let verify: typeof Verify.verify,
    MISSING: typeof Verify.MISSING,
    VALID: typeof Verify.VALID,
    INVALID: typeof Verify.INVALID;

  beforeEach(async () => {
    // verify uses a singleton, and we have tests that need to test that the
    // singleton is singletoning; this means we need to import and reset the
    // module before each test to ensure that the singleton is reset.
    // eslint-disable-next-line import-x/extensions
    return import('./verify.ts').then((value) => {
      verify = value.verify;
      MISSING = value.MISSING;
      VALID = value.VALID;
      INVALID = value.INVALID;
    });
  });
  afterEach(() => {
    jest.resetAllMocks();
    // resets the ./verify.ts import
    jest.resetModules();
  });

  it('returns MISSING if sig param is not present', async () => {
    const url = new URL('https://example.com/path');
    expect(await verify(url)).toBe(MISSING);
  });

  it('returns VALID if signature is valid', async () => {
    mockVerify.mockResolvedValueOnce(true);

    const url = new URL('https://example.com/path?sig=abc');
    const result = await verify(url);
    expect(result).toBe(VALID);
    expect(mockImportKey).toHaveBeenCalled();
    expect(mockVerify).toHaveBeenCalled();
  });

  it('returns INVALID if signature is invalid', async () => {
    const url = new URL('https://example.com/path?sig=abc');
    const result = await verify(url);
    expect(result).toBe(INVALID);
    expect(mockImportKey).toHaveBeenCalled();
    expect(mockVerify).toHaveBeenCalled();
  });

  it('validates a .com link signed for the legacy .io origin without a second attempt', async () => {
    mockVerify.mockResolvedValueOnce(true);

    const result = await verify(
      new URL('https://link.metamask.com/path?sig=abc'),
    );

    expect(result).toBe(VALID);
    expect(mockVerify).toHaveBeenCalledTimes(1);
    expect(new TextDecoder().decode(mockVerify.mock.calls[0][3])).toBe(
      'https://link.metamask.io/path',
    );
  });

  it('validates a .com link signed for its own origin after trying .io', async () => {
    mockVerify.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const result = await verify(
      new URL('https://link.metamask.com/path?sig=abc'),
    );

    expect(result).toBe(VALID);
    expect(mockVerify).toHaveBeenCalledTimes(2);
    expect(
      mockVerify.mock.calls.map((call) => new TextDecoder().decode(call[3])),
    ).toStrictEqual([
      'https://link.metamask.io/path',
      'https://link.metamask.com/path',
    ]);
  });

  it('preserves the canonical signed query when trying another host', async () => {
    mockVerify.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const result = await verify(
      new URL(
        'https://link.metamask.com/path?z=3&sig=abc&sig_params=a,z&a=1&other=unsigned',
      ),
    );

    expect(result).toBe(VALID);
    expect(
      mockVerify.mock.calls.map((call) => new TextDecoder().decode(call[3])),
    ).toStrictEqual([
      'https://link.metamask.io/path?a=1&sig_params=a%2Cz&z=3',
      'https://link.metamask.com/path?a=1&sig_params=a%2Cz&z=3',
    ]);
  });

  it('rejects a .com link when neither origin verifies', async () => {
    const result = await verify(
      new URL('https://link.metamask.com/path?sig=abc'),
    );

    expect(result).toBe(INVALID);
    expect(mockVerify).toHaveBeenCalledTimes(2);
  });

  it('does not try the .com origin for a lookalike host', async () => {
    const result = await verify(
      new URL('https://link.metamask.com.evil.tld/path?sig=abc'),
    );

    expect(result).toBe(INVALID);
    expect(mockVerify).toHaveBeenCalledTimes(1);
  });

  jestIt.each([
    'http://link.metamask.io/path?sig=abc',
    'https://link.metamask.io:8443/path?sig=abc',
  ])('does not try another signing host for %s', async (url) => {
    const result = await verify(new URL(url));

    expect(result).toBe(INVALID);
    expect(mockVerify).toHaveBeenCalledTimes(1);
  });

  it('validates a .io link signed for the .com origin after trying .io', async () => {
    mockVerify.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const result = await verify(
      new URL('https://link.metamask.io/path?sig=abc'),
    );

    expect(result).toBe(VALID);
    expect(
      mockVerify.mock.calls.map((call) => new TextDecoder().decode(call[3])),
    ).toStrictEqual([
      'https://link.metamask.io/path',
      'https://link.metamask.com/path',
    ]);
  });

  it('validates a .io link signed for the .io origin without a second attempt', async () => {
    mockVerify.mockResolvedValueOnce(true);

    const result = await verify(
      new URL('https://link.metamask.io/path?sig=abc'),
    );

    expect(result).toBe(VALID);
    expect(mockVerify).toHaveBeenCalledTimes(1);
    expect(new TextDecoder().decode(mockVerify.mock.calls[0][3])).toBe(
      'https://link.metamask.io/path',
    );
  });

  it('rejects a .io link when neither origin verifies', async () => {
    const result = await verify(
      new URL('https://link.metamask.io/path?sig=abc'),
    );

    expect(result).toBe(INVALID);
    expect(mockVerify).toHaveBeenCalledTimes(2);
  });

  it('checks every configured signing host for an allowed link', async () => {
    const { DEEP_LINK_HOSTS } = await import('./common');
    DEEP_LINK_HOSTS.push('link.metamask.test');
    mockVerify
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    try {
      const result = await verify(
        new URL('https://link.metamask.io/path?sig=abc'),
      );

      expect(result).toBe(VALID);
      expect(
        mockVerify.mock.calls.map((call) => new TextDecoder().decode(call[3])),
      ).toStrictEqual([
        'https://link.metamask.io/path',
        'https://link.metamask.com/path',
        'https://link.metamask.test/path',
      ]);
    } finally {
      DEEP_LINK_HOSTS.pop();
    }
  });

  it('caches tools after first call', async () => {
    const url = new URL('https://example.com/path?sig=abc');
    await verify(url);
    await verify(url);
    expect(mockImportKey).toHaveBeenCalledTimes(1);
  });
});
