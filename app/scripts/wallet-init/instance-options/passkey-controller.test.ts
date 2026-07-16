import type { Browser } from 'webextension-polyfill';
import { getPasskeyControllerInstanceOptions } from './passkey-controller';

function createMockPlatform(
  getURL: Browser['runtime']['getURL'] | undefined,
): Browser {
  return {
    runtime: getURL ? { getURL } : {},
  } as unknown as Browser;
}

describe('getPasskeyControllerInstanceOptions', () => {
  it('derives expectedOrigin and expectedRPID from the extension runtime URL', () => {
    const platform = createMockPlatform(
      jest.fn().mockReturnValue('chrome-extension://mock-id/'),
    );

    expect(getPasskeyControllerInstanceOptions(platform)).toStrictEqual({
      expectedRPID: 'chrome-extension://mock-id',
      expectedOrigin: 'chrome-extension://mock-id',
    });
  });

  it('uses empty expectedOrigin and expectedRPID when runtime URL is unavailable', () => {
    const platform = createMockPlatform(undefined);

    expect(getPasskeyControllerInstanceOptions(platform)).toStrictEqual({
      expectedRPID: '',
      expectedOrigin: '',
    });
  });

  it('uses empty expectedOrigin and expectedRPID when getURL returns undefined', () => {
    const platform = createMockPlatform(jest.fn().mockReturnValue(undefined));

    expect(getPasskeyControllerInstanceOptions(platform)).toStrictEqual({
      expectedRPID: '',
      expectedOrigin: '',
    });
  });
});
