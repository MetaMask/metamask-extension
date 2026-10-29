import type { WalletOptions } from '@metamask/wallet';
import { Browser } from 'webextension-polyfill';
import type { WalletInitMessenger } from '../types';

type PasskeyControllerInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['passkeyController']
>;

type GetPasskeyControllerInstanceOptionsParams = {
  messenger: WalletInitMessenger;
  platform: Browser;
};

const PASSKEY_RP_NAME = 'MetaMask';
const PASSKEY_USER_NAME = 'MetaMask Wallet';
const PASSKEY_USER_DISPLAY_NAME = 'MetaMask Wallet';

export function getPasskeyControllerInstanceOptions({
  messenger,
  platform,
}: GetPasskeyControllerInstanceOptionsParams): PasskeyControllerInstanceOptions {
  const extensionUrl = platform.runtime?.getURL?.('');
  const extensionOrigin = extensionUrl ? extensionUrl.replace(/\/$/u, '') : '';

  return {
    rpId: undefined,
    rpName: PASSKEY_RP_NAME,
    expectedRPID: extensionOrigin,
    expectedOrigin: extensionOrigin,
    userName: PASSKEY_USER_NAME,
    userDisplayName: PASSKEY_USER_DISPLAY_NAME,
    getIsOnboardingCompleted: () =>
      messenger.call('OnboardingController:getState').completedOnboarding,
  };
}
