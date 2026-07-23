import type * as Verify from './verify';
import { sigToBytes } from './helpers';

jest.mock('./helpers', () => ({
  getKeyData: jest.fn(() => new Uint8Array([1, 2, 3])),
  sigToBytes: jest.fn((_: string) => new Uint8Array([4, 5, 6])),
}));

const mockVerify = jest.fn();
const mockImportKey = jest.fn();
const mockSigToBytes = sigToBytes as jest.MockedFunction<typeof sigToBytes>;

Object.defineProperty(globalThis.crypto, 'subtle', {
  value: {
    importKey: mockImportKey,
    verify: mockVerify,
  },
});

describe('verify', () => {
  let verify: typeof Verify.verify,
    VALID: typeof Verify.VALID,
    INVALID: typeof Verify.INVALID;

  beforeEach(async () => {
    // verify uses a singleton, and we have tests that need to test that the
    // singleton is singletoning; this means we need to import and reset the
    // module before each test to ensure that the singleton is reset.
    // eslint-disable-next-line import-x/extensions
    return import('./verify.ts').then((value) => {
      verify = value.verify;
      VALID = value.VALID;
      INVALID = value.INVALID;
    });
  });
  afterEach(() => {
    jest.resetAllMocks();
    // resets the ./verify.ts import
    jest.resetModules();
  });

  it('returns VALID if signature is valid', async () => {
    mockVerify.mockResolvedValueOnce(true);

    const canonicalUrl = new URL('https://example.com/path?foo=bar');
    const result = await verify('abc', canonicalUrl);

    expect(result).toBe(VALID);
    expect(mockImportKey).toHaveBeenCalled();
    expect(mockSigToBytes).toHaveBeenCalledWith('abc');
    expect(mockVerify).toHaveBeenCalled();
    expect(mockVerify.mock.calls[0][3]).toStrictEqual(
      new TextEncoder().encode(canonicalUrl.toString()),
    );
  });

  it('returns INVALID if signature is invalid', async () => {
    const canonicalUrl = new URL('https://example.com/path?foo=bar');
    const result = await verify('abc', canonicalUrl);

    expect(result).toBe(INVALID);
    expect(mockImportKey).toHaveBeenCalled();
    expect(mockVerify).toHaveBeenCalled();
  });

  it('caches tools after first call', async () => {
    const canonicalUrl = new URL('https://example.com/path');
    await verify('abc', canonicalUrl);
    await verify('abc', canonicalUrl);

    expect(mockImportKey).toHaveBeenCalledTimes(1);
  });
});
