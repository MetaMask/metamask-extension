import type { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';
import { Env, getEnvUrls } from '@metamask/profile-sync-controller/sdk';
import { sanitizePersistedAuthenticationState } from './sanitize-persisted-auth-state';

function createJwt(issuer: unknown): string {
  const payload = Buffer.from(JSON.stringify({ iss: issuer })).toString(
    'base64url',
  );
  return `header.${payload}.signature`;
}

function createState(accessToken: string): AuthenticationControllerState {
  return {
    isSignedIn: true,
    srpSessionData: {
      entropy: {
        token: { accessToken, expiresIn: 3600, obtainedAt: 1 },
        profile: {
          identifierId: 'identifier',
          profileId: 'profile',
          canonicalProfileId: 'profile',
          metaMetricsId: 'metrics',
        },
      },
    },
  };
}

describe('sanitizePersistedAuthenticationState', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('preserves state without persisted sessions', () => {
    const sessionlessState = { isSignedIn: false };

    expect({
      missing: sanitizePersistedAuthenticationState(undefined, Env.PRD),
      sessionless: sanitizePersistedAuthenticationState(
        sessionlessState,
        Env.PRD,
      ),
    }).toMatchInlineSnapshot(`
      {
        "missing": undefined,
        "sessionless": {
          "isSignedIn": false,
        },
      }
    `);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('preserves sessions minted for the configured environment', () => {
    const state = createState(createJwt(getEnvUrls(Env.PRD).oidcApiUrl));

    expect(sanitizePersistedAuthenticationState(state, Env.PRD)).toBe(state);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('clears incompatible and malformed session collections', () => {
    const emptyState: AuthenticationControllerState = {
      isSignedIn: true,
      srpSessionData: {},
    };
    const states = [
      emptyState,
      createState(createJwt(getEnvUrls(Env.DEV).oidcApiUrl)),
      createState('not-a-jwt'),
      createState(createJwt(123)),
      createState(''),
    ];

    expect(
      states.map((state) =>
        sanitizePersistedAuthenticationState(state, Env.PRD),
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "isSignedIn": false,
          "srpSessionData": undefined,
        },
        {
          "isSignedIn": false,
          "srpSessionData": undefined,
        },
        {
          "isSignedIn": false,
          "srpSessionData": undefined,
        },
        {
          "isSignedIn": false,
          "srpSessionData": undefined,
        },
        {
          "isSignedIn": false,
          "srpSessionData": undefined,
        },
      ]
    `);
    expect(warnSpy).toHaveBeenCalledTimes(states.length);
  });
});
