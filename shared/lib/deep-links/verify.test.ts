import type * as Verify from './verify';

jest.mock('./canonicalize', () => ({
  canonicalize: jest.fn((_: URL) => 'canonicalized-url'),
}));
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
    // eslint-disable-next-line import/extensions
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

  it('caches tools after first call', async () => {
    const url = new URL('https://example.com/path?sig=abc');
    await verify(url);
    await verify(url);
    expect(mockImportKey).toHaveBeenCalledTimes(1);
  });
});
