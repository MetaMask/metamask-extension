import { buildChromiumLaunchArgs } from './extension-launcher';

describe('buildChromiumLaunchArgs', () => {
  it('adds proxy flag when proxy server is provided', () => {
    const args = buildChromiumLaunchArgs('/tmp/dist/chrome', '127.0.0.1:8000');

    expect(args[0]).toBe('--proxy-server=127.0.0.1:8000');
    expect(args).toContain('--ignore-certificate-errors');
    expect(args).toContain('--allow-insecure-localhost');
    expect(args).toContain('--disable-features=TranslateUI');
  });

  it('does not add proxy flag when proxy server is not provided', () => {
    const args = buildChromiumLaunchArgs('/tmp/dist/chrome');

    expect(args.some((arg) => arg.startsWith('--proxy-server='))).toBe(false);
    expect(args).not.toContain('--ignore-certificate-errors');
    expect(args).not.toContain('--allow-insecure-localhost');
    expect(args).toContain('--disable-features=TranslateUI');
  });
});
