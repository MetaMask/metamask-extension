import { Web3AuthNetwork } from '@metamask/seedless-onboarding-controller';
import type { WalletOptions } from '@metamask/wallet';
import { encryptorFactory } from '../../lib/encryptor-factory';
import { isDevOrTestBuild } from '../../services/oauth/config';
import type { SeedlessOnboardingControllerInitMessenger } from '../messengers/seedless-onboarding-controller-messenger';

type SeedlessOnboardingControllerInstanceOptions = NonNullable<
  WalletOptions['instanceOptions']['seedlessOnboardingController']
>;

const loadWeb3AuthNetwork = (): Web3AuthNetwork => {
  return isDevOrTestBuild() ? Web3AuthNetwork.Devnet : Web3AuthNetwork.Mainnet;
};

/**
 * Build the extension's `SeedlessOnboardingController` instance options.
 *
 * @param options - Options bag.
 * @param options.initMessenger - Messenger used to call `OAuthService` actions.
 * @returns The extension `SeedlessOnboardingController` instance options.
 */
export function getSeedlessOnboardingControllerInstanceOptions({
  initMessenger,
}: {
  initMessenger: SeedlessOnboardingControllerInitMessenger;
}): SeedlessOnboardingControllerInstanceOptions {
  return {
    network: loadWeb3AuthNetwork(),
    passwordOutdatedCacheTTL: 15_000,
    encryptor: encryptorFactory(600_000),
    refreshJWTToken: (...args) =>
      initMessenger.call('OAuthService:getNewRefreshToken', ...args),
    revokeRefreshToken: (...args) =>
      initMessenger.call('OAuthService:revokeRefreshToken', ...args),
    renewRefreshToken: (...args) =>
      initMessenger.call('OAuthService:renewRefreshToken', ...args),
  };
}
