import { Web3AuthNetwork } from '@metamask/seedless-onboarding-controller';
import { AuthConnection } from '../../../shared/constants/onboarding';
import { isProduction } from '../../../shared/lib/environment';
import { loadOAuthConfig } from '../services/oauth/config';

/** Capabilities passed only to the trusted social onboarding service. */
export type SocialOnboardingNetworkPolicy = {
  beginSocialOnboarding: (authConnection: AuthConnection) => Promise<void>;
  endSocialOnboarding: () => Promise<void>;
};

/**
 * Gets the exact hosts needed after a user selects a social onboarding path.
 * Grants are transient and must never be restored from persisted flow state.
 *
 * @param authConnection - The provider selected by the user.
 * @returns The hosts used by this build's OAuth, TOPRF and geolocation services.
 */
export function getSocialOnboardingDomains(
  authConnection: AuthConnection,
): string[] {
  const config = loadOAuthConfig();
  const providerDomains: string[] = [];

  switch (authConnection) {
    case AuthConnection.Google:
      providerDomains.push('accounts.google.com');
      break;
    case AuthConnection.Apple:
      providerDomains.push('appleid.apple.com');
      break;
    case AuthConnection.Telegram: {
      // Keep authorization destinations in application code. A compromised SDK
      // must not be able to expand its own network grant through getEnvUrls().
      const profileDomainPrefix = {
        dev: 'dev-',
        uat: 'uat-',
        prd: '',
      }[config.profileSyncEnv];
      if (profileDomainPrefix === undefined) {
        throw new Error('Unsupported social onboarding environment');
      }
      providerDomains.push(
        `authentication.${profileDomainPrefix}api.cx.metamask.io`,
        `oidc.${profileDomainPrefix}api.cx.metamask.io`,
      );
      break;
    }
    default:
      throw new Error('Unsupported social onboarding provider');
  }

  const nodeDomain =
    config.web3AuthNetwork === Web3AuthNetwork.Devnet
      ? 'dev-node.web3auth.io'
      : 'node.web3auth.io';

  return [
    ...new Set([
      new URL(config.authServerUrl).hostname,
      'api.web3auth.io',
      ...Array.from(
        { length: 5 },
        (_, index) => `node-${index + 1}.${nodeDomain}`,
      ),
      `geolocation.${isProduction() ? '' : 'dev-'}api.cx.metamask.io`,
      ...providerDomains,
    ]),
  ];
}
