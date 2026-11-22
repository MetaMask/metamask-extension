import type { Browser } from 'webextension-polyfill';
import type { WalletInitMessenger } from '../types';
import { getPasskeyControllerInstanceOptions } from './passkey-controller';

const mockMessenger = {
  call: jest.fn().mockReturnValue({ completedOnboarding: true }),
} as unknown as WalletInitMessenger;

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

    expect(
      getPasskeyControllerInstanceOptions({
        messenger: mockMessenger,
        platform,
      }),
    ).toStrictEqual({
      rpId: undefined,
      rpName: 'MetaMask',
      expectedRPID: 'chrome-extension://mock-id',
      expectedOrigin: 'chrome-extension://mock-id',
      userName: 'MetaMask Wallet',
      userDisplayName: 'MetaMask Wallet',
      getIsOnboardingCompleted: expect.any(Function),
    });
  });

  it('uses empty expectedOrigin and expectedRPID when runtime URL is unavailable', () => {
    const platform = createMockPlatform(undefined);

    expect(
      getPasskeyControllerInstanceOptions({
        messenger: mockMessenger,
        platform,
      }),
    ).toStrictEqual({
      rpId: undefined,
      rpName: 'MetaMask',
      expectedRPID: '',
      expectedOrigin: '',
      userName: 'MetaMask Wallet',
      userDisplayName: 'MetaMask Wallet',
      getIsOnboardingCompleted: expect.any(Function),
    });
  });

  it('uses empty expectedOrigin and expectedRPID when getURL returns undefined', () => {
    const platform = createMockPlatform(jest.fn().mockReturnValue(undefined));

    expect(
      getPasskeyControllerInstanceOptions({
        messenger: mockMessenger,
        platform,
      }),
    ).toStrictEqual({
      rpId: undefined,
      rpName: 'MetaMask',
      expectedRPID: '',
      expectedOrigin: '',
      userName: 'MetaMask Wallet',
      userDisplayName: 'MetaMask Wallet',
      getIsOnboardingCompleted: expect.any(Function),
    });
  });

  it('gets the current onboarding status from the messenger', () => {
    const options = getPasskeyControllerInstanceOptions({
      messenger: mockMessenger,
      platform: createMockPlatform(undefined),
    });

    expect(options.getIsOnboardingCompleted()).toBe(true);
    expect(mockMessenger.call).toHaveBeenCalledWith(
      'OnboardingController:getState',
    );
  });
});
