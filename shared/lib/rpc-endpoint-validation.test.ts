import { it as jestIt } from '@jest/globals';
import { getRpcValidationFetchUrl } from './rpc-endpoint-validation';

describe('getRpcValidationFetchUrl', () => {
  it('ignores poisoned URL properties when canonicalizing the candidate', () => {
    const href = Object.getOwnPropertyDescriptor(URL.prototype, 'href');
    Object.defineProperty(URL.prototype, 'href', {
      configurable: true,
      get: () => 'https://different.example/',
      set: () => undefined,
    });
    try {
      expect(
        getRpcValidationFetchUrl('https://rpc.example/path#fragment'),
      ).toBe('https://rpc.example/path');
    } finally {
      if (href) {
        Object.defineProperty(URL.prototype, 'href', href);
      }
    }
  });

  it('removes credentials and fragments while preserving the RPC path and query', () => {
    expect(
      getRpcValidationFetchUrl(
        'https://alice:secret@RPC.example:8443/v1/api%2Fkey?token=a%2Bb&network=1#ignored',
      ),
    ).toBe('https://rpc.example:8443/v1/api%2Fkey?token=a%2Bb&network=1');
  });

  it('accepts a local HTTP endpoint', () => {
    expect(getRpcValidationFetchUrl('http://localhost:8545')).toBe(
      'http://localhost:8545/',
    );
  });

  jestIt.each([
    'file:///tmp/rpc',
    'data:application/json,{}',
    // eslint-disable-next-line no-script-url -- Exercise rejection of a non-HTTP URL.
    'javascript:alert(1)',
    'ws://rpc.example',
    'wss://rpc.example',
    'chrome-extension://extension-id/rpc',
    '/relative/rpc',
    'not a URL',
  ])('rejects a URL without an HTTP origin: %s', (url: string) => {
    expect(() => getRpcValidationFetchUrl(url)).toThrow(
      /Invalid URL|requires HTTP or HTTPS/u,
    );
  });

  it('rejects an oversized URL', () => {
    expect(() =>
      getRpcValidationFetchUrl(`https://rpc.example/${'a'.repeat(2048)}`),
    ).toThrow('Invalid RPC endpoint URL.');
  });

  jestIt.each([null, undefined, 123, { href: 'https://rpc.example/' }])(
    'rejects a non-string input: %p',
    (value: unknown) => {
      expect(() =>
        getRpcValidationFetchUrl(value as unknown as string),
      ).toThrow('Invalid RPC endpoint URL.');
    },
  );
});
