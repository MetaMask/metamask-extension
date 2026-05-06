import { GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID } from '../../shared/constants/passkey';
import {
  getIsPasskeyFeatureAvailable,
  getIsPasskeyRegistered,
  getIsEnrolledPasskeyIncompatibleWithSidepanel,
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

const { getIsSocialLoginFlow } = jest.requireMock('./first-time-flow') as {
  getIsSocialLoginFlow: jest.Mock;
};

describe('getIsPasskeyFeatureAvailable', () => {
  const mockState = {} as Parameters<typeof getIsPasskeyFeatureAvailable>[0];

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns true when build flag is enabled, WebAuthn is supported, not social login, and not Firefox', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(true);
    isWebAuthnSupported.mockReturnValue(true);
    getIsSocialLoginFlow.mockReturnValue(false);
    isFirefoxBrowser.mockReturnValue(false);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(true);
  });

  it('returns false when build flag is disabled', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(false);
    isWebAuthnSupported.mockReturnValue(true);
    getIsSocialLoginFlow.mockReturnValue(false);
    isFirefoxBrowser.mockReturnValue(false);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });

  it('returns false when WebAuthn is not supported', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(true);
    isWebAuthnSupported.mockReturnValue(false);
    getIsSocialLoginFlow.mockReturnValue(false);
    isFirefoxBrowser.mockReturnValue(false);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });

  it('returns false when user is on social login flow', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(true);
    isWebAuthnSupported.mockReturnValue(true);
    getIsSocialLoginFlow.mockReturnValue(true);
    isFirefoxBrowser.mockReturnValue(false);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });

  it('returns false when browser is Firefox', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(true);
    isWebAuthnSupported.mockReturnValue(true);
    getIsSocialLoginFlow.mockReturnValue(false);
    isFirefoxBrowser.mockReturnValue(true);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });

  it('returns false when all conditions are negative', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(false);
    isWebAuthnSupported.mockReturnValue(false);
    getIsSocialLoginFlow.mockReturnValue(true);
    isFirefoxBrowser.mockReturnValue(true);

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
