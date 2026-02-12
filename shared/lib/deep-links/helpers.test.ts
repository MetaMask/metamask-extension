import { getManifestFlags } from '../manifestFlags';
import { sigToBytes, base64ToUint8Array, getKeyData } from './helpers';

jest.mock('../manifestFlags');
const mockGetManifestFlags = getManifestFlags as jest.MockedFunction<
  typeof getManifestFlags
>;

describe('helpers', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV };
    jest.clearAllMocks();
    mockGetManifestFlags.mockReset();
    mockGetManifestFlags.mockReturnValue({
      testing: {
        deepLinkPublicKey: undefined,
      },
    });
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('sigToBytes', () => {
    it('should decode a valid base64url signature string to Uint8Array (modern browsers)', () => {
      // we don't test `Uint8Array.fromBase64` because node.js doesn't support
      // it. It is IDENTICAL to doing `Buffer.from(bytes).toString('base64url')`
      //
      // If node ever ships `Uint8Array.fromBase64` this test will fail, and we
      // can write a real test for it.
      //
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((Uint8Array as any).fromBase64).toBeUndefined();
    });

    it('should decode a valid base64url signature string to Uint8Array (old browsers fallback)', () => {
      // we don't test `Uint8Array.fromBase64` because node.js doesn't support
      // it. Its is IDENTICAL to doing `Buffer.from(bytes).toString('base64url')`
      // Simulate old browser by deleting Uint8Array.fromBase64
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orig = (Uint8Array as any).fromBase64;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (Uint8Array as any).fromBase64;

      // 64 bytes = 86 base64url chars (no padding)
      // Use a known 64-byte buffer, encode to base64url, then decode
      // `i + 98`, because this causes both url-safe replacements to occur in
      // the output.
      const bytes = Array.from({ length: 64 }, (_, i) => i + 98);
      // we can't use `btoa`, as it doesn't output a base64url, so we use Buffer
      // for test because our tests are in Node, so we can :-)
      const base64url = Buffer.from(bytes).toString('base64url');
      const result = sigToBytes(base64url);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(64);
      expect(Array.from(result)).toStrictEqual(bytes);

      // Restore the original method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Uint8Array as any).fromBase64 = orig;
    });
  });

  describe('base64ToUint8Array', () => {
    it('should convert base64 string to Uint8Array (modern browsers)', () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5]);
      const base64 = Buffer.from(bytes).toString('base64');
      const result = base64ToUint8Array(base64);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toStrictEqual([1, 2, 3, 4, 5]);
    });

    it('should convert base64 string to Uint8Array (old browsers fallback)', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orig = (Uint8Array as any).fromBase64;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (Uint8Array as any).fromBase64;

      const bytes = [10, 20, 30, 40, 50];
      const base64 = Buffer.from(bytes).toString('base64');
      const result = base64ToUint8Array(base64);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toStrictEqual(bytes);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Uint8Array as any).fromBase64 = orig;
    });
  });

  describe('getKeyData', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should use manifest flag key in test mode', () => {
      const bytes = [1, 2, 3, 4];
      const fakeKey = Buffer.from(bytes).toString('base64');
      mockGetManifestFlags.mockReturnValue({
        testing: {
          deepLinkPublicKey: fakeKey,
        },
      });
      process.env.IN_TEST = 'true';
      const result = getKeyData();
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toStrictEqual(bytes);
    });

    it('should use DEEP_LINK_PUBLIC_KEY when in test mode and manifest key is not set', () => {
      // just some random base64 encoded string, no meaning
      process.env.DEEP_LINK_PUBLIC_KEY = 'U3RheSBjdXJpb3VzLg==';
      const result = getKeyData();
      expect(result).toBeInstanceOf(Uint8Array);
      // Corrected assertion to use the actual environment variable's decoded value
      const expectedBytes = Array.from(
        Buffer.from(process.env.DEEP_LINK_PUBLIC_KEY, 'base64'),
      );
      expect(Array.from(result)).toStrictEqual(expectedBytes);
    });

    it('should use DEEP_LINK_PUBLIC_KEY when not in test mode', () => {
      delete process.env.IN_TEST;
      // just some random base64 encoded string, no meaning
      process.env.DEEP_LINK_PUBLIC_KEY = 'WW91IHNob3VsZCB0YWtlIGEgYnJlYWs=';
      const result = getKeyData();
      expect(result).toBeInstanceOf(Uint8Array);
      // Corrected assertion to use the actual environment variable's decoded value
      const expectedBytes = Array.from(
        Buffer.from(process.env.DEEP_LINK_PUBLIC_KEY, 'base64'),
      );
      expect(Array.from(result)).toStrictEqual(expectedBytes);
    });

    it('should return undefined or throw if no key is present when in production-mode', () => {
      delete process.env.IN_TEST;
      delete process.env.DEEP_LINK_PUBLIC_KEY;
      expect(() => getKeyData()).toThrow(Error);
    });
  });
});
