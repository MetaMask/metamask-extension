import { ENVIRONMENT } from '../../../shared/constants/build';
import { AuthConnection } from '../../../shared/constants/onboarding';
import { getSocialOnboardingDomains } from './social-onboarding-network-policy';

jest.mock('@metamask/profile-sync-controller/sdk', () => ({
  ...jest.requireActual('@metamask/profile-sync-controller/sdk'),
  // Dependency-provided endpoints cannot authorize their own destinations.
  getEnvUrls: () => ({
    authApiUrl: 'https://unapproved.example/auth',
    oidcApiUrl: 'https://unapproved.example/oidc',
  }),
}));

describe('getSocialOnboardingDomains', () => {
  const initialEnvironment = process.env.METAMASK_ENVIRONMENT;
  const initialBuildType = process.env.METAMASK_BUILD_TYPE;

  beforeEach(() => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;
    process.env.METAMASK_BUILD_TYPE = 'main';
  });

  afterEach(() => {
    process.env.METAMASK_ENVIRONMENT = initialEnvironment;
    process.env.METAMASK_BUILD_TYPE = initialBuildType;
  });

  it('allows only the selected provider and the development onboarding services', () => {
    expect(getSocialOnboardingDomains(AuthConnection.Google)).toStrictEqual([
      'auth-service.dev-api.cx.metamask.io',
      'api.web3auth.io',
      'node-1.dev-node.web3auth.io',
      'node-2.dev-node.web3auth.io',
      'node-3.dev-node.web3auth.io',
      'node-4.dev-node.web3auth.io',
      'node-5.dev-node.web3auth.io',
      'geolocation.dev-api.cx.metamask.io',
      'accounts.google.com',
    ]);
  });

  it('uses production service hosts in a production build', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;

    expect(getSocialOnboardingDomains(AuthConnection.Apple)).toStrictEqual([
      'auth-service.api.cx.metamask.io',
      'api.web3auth.io',
      'node-1.node.web3auth.io',
      'node-2.node.web3auth.io',
      'node-3.node.web3auth.io',
      'node-4.node.web3auth.io',
      'node-5.node.web3auth.io',
      'geolocation.api.cx.metamask.io',
      'appleid.apple.com',
    ]);
  });

  it('allows the configured profile authentication hosts for Telegram', () => {
    const domains = getSocialOnboardingDomains(AuthConnection.Telegram);

    expect(domains).toContain('authentication.dev-api.cx.metamask.io');
    expect(domains).toContain('oidc.dev-api.cx.metamask.io');
    expect(domains).not.toContain('accounts.google.com');
    expect(domains).not.toContain('appleid.apple.com');
    expect(domains).not.toContain('user-storage.dev-api.cx.metamask.io');
    expect(domains).not.toContain('unapproved.example');
  });

  it('rejects an unsupported provider before granting domains', () => {
    expect(() =>
      getSocialOnboardingDomains('unrecognized' as AuthConnection),
    ).toThrow('Unsupported social onboarding provider');
  });
});
