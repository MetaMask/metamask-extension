// @ts-expect-error reset is conditionally exported for testing only
import { verify, MISSING, VALID, INVALID, reset } from './verify';

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
  beforeEach(async () => {
    jest.clearAllMocks();
    reset();
  });

  it('returns MISSING if sig param is not present', async () => {
    const url = new URL('https://example.com/path');
    expect(await verify(url)).toBe(MISSING);
  });

  it('returns VALID if signature is valid', async () => {
    mockImportKey.mockResolvedValueOnce('mockKey');
    mockVerify.mockResolvedValueOnce(true);

    const url = new URL('https://example.com/path?sig=abc');
    const result = await verify(url);
    expect(result).toBe(VALID);
    expect(mockImportKey).toHaveBeenCalled();
    expect(mockVerify).toHaveBeenCalled();
  });

  it('returns INVALID if signature is invalid', async () => {
    reset();
    mockImportKey.mockResolvedValueOnce('mockKey');
    mockVerify.mockResolvedValueOnce(false);

    const url = new URL('https://example.com/path?sig=abc');
    const result = await verify(url);
    expect(result).toBe(INVALID);
    expect(mockImportKey).toHaveBeenCalled();
    expect(mockVerify).toHaveBeenCalled();
  });

  it('caches tools after first call', async () => {
    reset();
    mockImportKey.mockResolvedValue('mockKey');
    mockVerify.mockResolvedValue(true);

    const url = new URL('https://example.com/path?sig=abc');
    await verify(url);
    await verify(url);
    expect(mockImportKey).toHaveBeenCalledTimes(1);
  });
});
