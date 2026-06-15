import { DEVICE_TYPE } from '../../shared/constants/app';
import {
  getIsPasskeyFeatureAvailable,
  getIsPasskeyRegistered,
  getIsEnrolledPasskeyIncompatibleWithSidepanel,
  getPasskeyDerivationMethod,
} from './selectors';

jest.mock('../../shared/lib/environment', () => ({
  getIsPasskeyFeatureEnabled: jest.fn(),
}));

jest.mock('../../shared/lib/passkey', () => ({
  ...jest.requireActual('../../shared/lib/passkey'),
  isWebAuthnSupported: jest.fn(),
}));

jest.mock('../../shared/lib/browser-runtime.utils', () => ({
  isFirefoxBrowser: jest.fn(),
}));

jest.mock('../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../app/scripts/lib/util'),
  getDeviceType: jest.fn(),
}));

jest.mock('./first-time-flow', () => ({
  getIsSocialLoginFlow: jest.fn(),
}));

const { getIsPasskeyFeatureEnabled } = jest.requireMock(
  '../../shared/lib/environment',
) as {
  getIsPasskeyFeatureEnabled: jest.Mock;
};

const { isWebAuthnSupported } = jest.requireMock(
  '../../shared/lib/passkey',
) as {
  isWebAuthnSupported: jest.Mock;
};

const { isFirefoxBrowser } = jest.requireMock(
  '../../shared/lib/browser-runtime.utils',
) as {
  isFirefoxBrowser: jest.Mock;
};

const { getDeviceType } = jest.requireMock('../../app/scripts/lib/util') as {
  getDeviceType: jest.Mock;
};

const { getIsSocialLoginFlow } = jest.requireMock('./first-time-flow') as {
  getIsSocialLoginFlow: jest.Mock;
};

/** Must match private Google Password Manager AAGUID in shared/lib/passkey/passkey-sidepanel-aaguid.ts */
const GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID =
  'ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4';

describe('getIsPasskeyFeatureAvailable', () => {
  const mockState = {} as Parameters<typeof getIsPasskeyFeatureAvailable>[0];

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns true when build flag is enabled, WebAuthn is supported, not social login, not Firefox, and not mobile', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(true);
    isWebAuthnSupported.mockReturnValue(true);
    getIsSocialLoginFlow.mockReturnValue(false);
    isFirefoxBrowser.mockReturnValue(false);
    getDeviceType.mockReturnValue(DEVICE_TYPE.DESKTOP);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(true);
  });

  it('returns false when build flag is disabled', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(false);
    isWebAuthnSupported.mockReturnValue(true);
    getIsSocialLoginFlow.mockReturnValue(false);
    isFirefoxBrowser.mockReturnValue(false);
    getDeviceType.mockReturnValue(DEVICE_TYPE.DESKTOP);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });

  it('returns false when WebAuthn is not supported', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(true);
    isWebAuthnSupported.mockReturnValue(false);
    getIsSocialLoginFlow.mockReturnValue(false);
    isFirefoxBrowser.mockReturnValue(false);
    getDeviceType.mockReturnValue(DEVICE_TYPE.DESKTOP);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });

  it('returns false when user is on social login flow', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(true);
    isWebAuthnSupported.mockReturnValue(true);
    getIsSocialLoginFlow.mockReturnValue(true);
    isFirefoxBrowser.mockReturnValue(false);
    getDeviceType.mockReturnValue(DEVICE_TYPE.DESKTOP);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });

  it('returns false when browser is Firefox', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(true);
    isWebAuthnSupported.mockReturnValue(true);
    getIsSocialLoginFlow.mockReturnValue(false);
    isFirefoxBrowser.mockReturnValue(true);
    getDeviceType.mockReturnValue(DEVICE_TYPE.DESKTOP);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });

  it('returns false when device is mobile (e.g. Kiwi, Yandex)', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(true);
    isWebAuthnSupported.mockReturnValue(true);
    getIsSocialLoginFlow.mockReturnValue(false);
    isFirefoxBrowser.mockReturnValue(false);
    getDeviceType.mockReturnValue(DEVICE_TYPE.MOBILE);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });

  it('returns false when all conditions are negative', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(false);
    isWebAuthnSupported.mockReturnValue(false);
    getIsSocialLoginFlow.mockReturnValue(true);
    isFirefoxBrowser.mockReturnValue(true);
    getDeviceType.mockReturnValue(DEVICE_TYPE.MOBILE);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });
});

describe('getIsPasskeyRegistered', () => {
  it('returns true when a passkey record exists', () => {
    const state = {
      metamask: {
        passkeyRecord: { credentialId: 'credential-id' },
      },
    };

    expect(getIsPasskeyRegistered(state)).toBe(true);
  });

  it('returns false when no passkey record exists', () => {
    const state = {
      metamask: {
        passkeyRecord: null,
      },
    };

    expect(getIsPasskeyRegistered(state)).toBe(false);
  });
});

describe('getPasskeyDerivationMethod', () => {
  it('returns undefined when no passkey record exists', () => {
    const state = { metamask: { passkeyRecord: null } };
    expect(getPasskeyDerivationMethod(state)).toBeUndefined();
  });

  it('returns prf when record uses PRF key derivation', () => {
    const state = {
      metamask: {
        passkeyRecord: {
          keyDerivation: { method: 'prf' as const, prfSalt: 'salt' },
        },
      },
    };
    expect(getPasskeyDerivationMethod(state)).toBe('prf');
  });

  it('returns userHandle when record uses userHandle key derivation', () => {
    const state = {
      metamask: {
        passkeyRecord: {
          keyDerivation: { method: 'userHandle' as const },
        },
      },
    };
    expect(getPasskeyDerivationMethod(state)).toBe('userHandle');
  });
});

describe('getIsEnrolledPasskeyIncompatibleWithSidepanel', () => {
  it('returns true when passkey credential AAGUID is in the incompatible set', () => {
    const state = {
      metamask: {
        passkeyRecord: {
          credential: { aaguid: GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID },
        },
      },
    };
    expect(getIsEnrolledPasskeyIncompatibleWithSidepanel(state)).toBe(true);
  });

  it('returns false when no passkey record', () => {
    const state = { metamask: { passkeyRecord: null } };
    expect(getIsEnrolledPasskeyIncompatibleWithSidepanel(state)).toBe(false);
  });

  it('returns false when AAGUID is unknown', () => {
    const state = {
      metamask: {
        passkeyRecord: {
          credential: {
            aaguid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          },
        },
      },
    };
    expect(getIsEnrolledPasskeyIncompatibleWithSidepanel(state)).toBe(false);
  });
});
