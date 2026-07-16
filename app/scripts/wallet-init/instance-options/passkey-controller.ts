import type { WalletOptions } from '@metamask/wallet';
import { Browser } from 'webextension-polyfill';

type PasskeyControllerInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['passkeyController']
>;

export function getPasskeyControllerInstanceOptions(
  platform: Browser,
): PasskeyControllerInstanceOptions {
  const extensionUrl = platform.runtime?.getURL?.('');
  const extensionOrigin = extensionUrl ? extensionUrl.replace(/\/$/u, '') : '';

  return {
    expectedRPID: extensionOrigin,
    expectedOrigin: extensionOrigin,
  };
}
