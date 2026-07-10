import { getClientConfig } from './utils';

describe('getClientConfig', () => {
  it('returns the extension type', () => {
    process.env.METAMASK_VERSION = '1.2.3';
    const config = getClientConfig();
    expect(config.type).toBe('extension');
  });

  it('returns the version from METAMASK_VERSION', () => {
    process.env.METAMASK_VERSION = '1.2.3';
    const config = getClientConfig();
    expect(config.version).toBe('1.2.3');
  });

  it('strips prerelease tags from the version', () => {
    process.env.METAMASK_VERSION = '1.2.3-beta.0';
    const config = getClientConfig();
    expect(config.version).toBe('1.2.3');
  });

  it('falls back to the raw version string if it cannot be parsed', () => {
    process.env.METAMASK_VERSION = 'not-a-version';
    const config = getClientConfig();
    expect(config.version).toBe('not-a-version');
  });
});
