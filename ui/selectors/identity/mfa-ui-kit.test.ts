import { it } from '@jest/globals';
import { isMfaDevBuild } from '../../hooks/identity/mfa/isMfaDevBuild';
import { getIsMfaUiKitEnabled, getMfaUiKitMethods } from './mfa-ui-kit';

jest.mock('../../hooks/identity/mfa/isMfaDevBuild', () => ({
  isMfaDevBuild: jest.fn(),
}));

const withFlags = (remoteFeatureFlags: Record<string, unknown>) =>
  ({ metamask: { remoteFeatureFlags } }) as Parameters<
    typeof getIsMfaUiKitEnabled
  >[0];

describe('getIsMfaUiKitEnabled', () => {
  beforeEach(() => {
    jest.mocked(isMfaDevBuild).mockReturnValue(false);
  });

  it.each([true, false])(
    'follows the remote flag when enabled is %s',
    (enabled: boolean) => {
      expect(
        getIsMfaUiKitEnabled(
          withFlags({ mfaUiKit: { enabled, minimumVersion: '1.0.0' } }),
        ),
      ).toBe(enabled);
    },
  );

  it('stays hidden below the minimum version', () => {
    expect(
      getIsMfaUiKitEnabled(
        withFlags({ mfaUiKit: { enabled: true, minimumVersion: '99.0.0' } }),
      ),
    ).toBe(false);
  });

  it.each<[string, Record<string, unknown>]>([
    ['missing', {}],
    ['invalid', { mfaUiKit: { minimumVersion: '1.0.0' } }],
  ])('falls back to the build check when the flag is %s', (_case, flags) => {
    jest.mocked(isMfaDevBuild).mockReturnValue(true);

    expect(getIsMfaUiKitEnabled(withFlags(flags))).toBe(true);
  });
});

describe('getMfaUiKitMethods', () => {
  it('lists the flag methods', () => {
    expect(
      getMfaUiKitMethods(
        withFlags({
          mfaUiKit: {
            enabled: true,
            minimumVersion: '1.0.0',
            methods: ['email_otp'],
          },
        }),
      ),
    ).toStrictEqual(['email_otp']);
  });

  it('allows every method when the flag lists none', () => {
    expect(getMfaUiKitMethods(withFlags({}))).toStrictEqual([
      'passkey',
      'totp',
      'email_otp',
    ]);
  });
});

describe('a progressive rollout', () => {
  it('is read for both the switch and the methods', () => {
    const state = withFlags({
      mfaUiKit: {
        name: 'rollout',
        value: { enabled: true, minimumVersion: '1.0.0', methods: ['totp'] },
      },
    });

    expect(getIsMfaUiKitEnabled(state)).toBe(true);
    expect(getMfaUiKitMethods(state)).toStrictEqual(['totp']);
  });
});
