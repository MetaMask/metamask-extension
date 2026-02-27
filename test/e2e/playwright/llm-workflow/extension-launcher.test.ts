import { buildChromiumLaunchArgs } from './extension-launcher';

describe('buildChromiumLaunchArgs', () => {
  it('adds proxy and SPKI flags when proxy server and fingerprint are provided', () => {
    const args = buildChromiumLaunchArgs(
      '/tmp/dist/chrome',
      '127.0.0.1:8000',
      undefined,
      'abc123',
    );

    expect(args[0]).toBe('--ignore-certificate-errors-spki-list=abc123');
    expect(args[1]).toBe('--proxy-server=127.0.0.1:8000');
    expect(args).toContain('--disable-features=TranslateUI');
  });

  it('uses PAC script when provided', () => {
    const args = buildChromiumLaunchArgs(
      '/tmp/dist/chrome',
      '127.0.0.1:8000',
      'function FindProxyForURL(url, host) { return "DIRECT"; }',
      'abc123',
    );

    expect(args[0]).toBe('--ignore-certificate-errors-spki-list=abc123');
    expect(args[1]).toMatch(
      /^--proxy-pac-url=data:application\/x-ns-proxy-autoconfig;base64,/u,
    );
    expect(args.some((arg) => arg.startsWith('--proxy-server='))).toBe(false);
  });

  it('does not add proxy flag when proxy server is not provided', () => {
    const args = buildChromiumLaunchArgs('/tmp/dist/chrome');

    expect(args.some((arg) => arg.startsWith('--proxy-server='))).toBe(false);
    expect(
      args.some((arg) =>
        arg.startsWith('--ignore-certificate-errors-spki-list='),
      ),
    ).toBe(false);
    expect(args).toContain('--disable-features=TranslateUI');
  });
});
