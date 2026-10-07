import { DEVICE_TYPE } from '../../shared/constants/app';
import {
  getIsPasskeyFeatureAvailable,
  getIsPasskeyPRFBased,
  getIsPasskeyRegistered,
  getIsPasskeyUserHandleBased,
  getIsEnrolledPasskeyIncompatibleWithSidepanel,
  getPasskeyAuthenticatorId,
  getPasskeyDerivationMethod,
} from './selectors';

jest.mock('../../shared/lib/environment', () => ({
  getIsPasskeyFeatureEnabled: jest.fn(),
}));

jest.mock('../../shared/lib/passkey/passkey-capabilities', () => ({
  ...jest.requireActual('../../shared/lib/passkey/passkey-capabilities'),
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

const { isWebAuthnSupported } = {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PasskeyCeremonyTimeoutError() {
    return jest.requireMock('../../shared/lib/passkey/passkey-ceremony')
      .PasskeyCeremonyTimeoutError;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PasskeyPRFRequiredError() {
    return jest.requireMock('../../shared/lib/passkey/passkey-capabilities')
      .PasskeyPRFRequiredError;
  },
  get cancelPasskeyCeremony() {
    return jest.requireMock('../../shared/lib/passkey/passkey-ceremony')
      .cancelPasskeyCeremony;
  },
  get getPasskeyAuthMethodKey() {
    return jest.requireMock('../../shared/lib/passkey/passkey-auth-method')
      .getPasskeyAuthMethodKey;
  },
  get getPasskeyErrorCode() {
    return jest.requireMock('../../shared/lib/passkey/passkey-error')
      .getPasskeyErrorCode;
  },
  get hasPasskeyPRFEnabled() {
    return jest.requireMock('../../shared/lib/passkey/passkey-capabilities')
      .hasPasskeyPRFEnabled;
  },
  get hasPasskeyPRFResult() {
    return jest.requireMock('../../shared/lib/passkey/passkey-capabilities')
      .hasPasskeyPRFResult;
  },
  get isPasskeyAaguidIncompatibleWithSidepanel() {
    return jest.requireMock('../../shared/lib/passkey/passkey-sidepanel-aaguid')
      .isPasskeyAaguidIncompatibleWithSidepanel;
  },
  get isPasskeyCeremonySilentError() {
    return jest.requireMock('../../shared/lib/passkey/passkey-ceremony')
      .isPasskeyCeremonySilentError;
  },
  get isPasskeyPRFSupported() {
    return jest.requireMock('../../shared/lib/passkey/passkey-capabilities')
      .isPasskeyPRFSupported;
  },
  get isWebAuthnSupported() {
    return jest.requireMock('../../shared/lib/passkey/passkey-capabilities')
      .isWebAuthnSupported;
  },
  get startPasskeyAuthentication() {
    return jest.requireMock('../../shared/lib/passkey/passkey-ceremony')
      .startPasskeyAuthentication;
  },
  get startPasskeyRegistration() {
    return jest.requireMock('../../shared/lib/passkey/passkey-ceremony')
      .startPasskeyRegistration;
  },
  get translatePasskeyError() {
    return jest.requireMock('../../shared/lib/passkey/passkey-error')
      .translatePasskeyError;
  },
} as {
  isWebAuthnSupported: jest.Mock;
};

const { isFirefoxBrowser } = jest.requireMock(
  '../../shared/lib/browser-runtime.utils',
) as {
  isFirefoxBrowser: jest.Mock;
};

const { getDeviceType } = {
  get addHexPrefix() {
    return jest.requireMock('../../shared/lib/add-hex-prefix').addHexPrefix;
  },
  get addUrlProtocolPrefix() {
    return jest.requireMock('../../shared/lib/url-utils').addUrlProtocolPrefix;
  },
  get checkAlarmExists() {
    return jest.requireMock('../../app/scripts/lib/util').checkAlarmExists;
  },
  get convertEnglishWordlistIndicesToCodepoints() {
    return jest.requireMock('../../app/scripts/lib/util')
      .convertEnglishWordlistIndicesToCodepoints;
  },
  get extractRpcDomain() {
    return jest.requireMock('../../app/scripts/lib/util').extractRpcDomain;
  },
  get formatTxMetaForRpcResult() {
    return jest.requireMock('../../app/scripts/lib/util')
      .formatTxMetaForRpcResult;
  },
  get formatValue() {
    return jest.requireMock('../../shared/lib/format-value').formatValue;
  },
  get generateRandomId() {
    return jest.requireMock('../../app/scripts/lib/util').generateRandomId;
  },
  get getBooleanFlag() {
    return jest.requireMock('../../shared/lib/environment').getBooleanFlag;
  },
  get getChainType() {
    return jest.requireMock('../../app/scripts/lib/util').getChainType;
  },
  get getConversionRatesForNativeAsset() {
    return jest.requireMock('../../shared/lib/asset-conversion-rates')
      .getConversionRatesForNativeAsset;
  },
  get getDeviceType() {
    return jest.requireMock('../../app/scripts/lib/util').getDeviceType;
  },
  get getEnvironmentType() {
    return jest.requireMock('../../shared/lib/environment-type')
      .getEnvironmentType;
  },
  get getInstallType() {
    return jest.requireMock('../../app/scripts/lib/install-type')
      .getInstallType;
  },
  get getMethodDataName() {
    return jest.requireMock('../../app/scripts/lib/util').getMethodDataName;
  },
  get getOs() {
    return jest.requireMock('../../app/scripts/lib/util').getOs;
  },
  get getPlatform() {
    return jest.requireMock('../../app/scripts/lib/util').getPlatform;
  },
  get getValidUrl() {
    return jest.requireMock('../../shared/lib/url-utils').getValidUrl;
  },
  get initInstallType() {
    return jest.requireMock('../../app/scripts/lib/install-type')
      .initInstallType;
  },
  get initializeRpcProviderDomains() {
    return jest.requireMock('../../app/scripts/lib/util')
      .initializeRpcProviderDomains;
  },
  get isKnownDomain() {
    return jest.requireMock('../../app/scripts/lib/util').isKnownDomain;
  },
  get isPublicEndpointUrl() {
    return jest.requireMock('../../app/scripts/lib/util').isPublicEndpointUrl;
  },
  get isSpecialUseDomain() {
    return jest.requireMock('../../app/scripts/lib/util').isSpecialUseDomain;
  },
  get isValidAmount() {
    return jest.requireMock('../../shared/lib/format-value').isValidAmount;
  },
  get isValidDate() {
    return jest.requireMock('../../app/scripts/lib/util').isValidDate;
  },
  get isValidEmail() {
    return jest.requireMock('../../shared/lib/url-utils').isValidEmail;
  },
  get isWebOrigin() {
    return jest.requireMock('../../shared/lib/url-utils').isWebOrigin;
  },
  get isWebUrl() {
    return jest.requireMock('../../shared/lib/url-utils').isWebUrl;
  },
  get previousValueComparator() {
    return jest.requireMock('../../app/scripts/lib/util')
      .previousValueComparator;
  },
  get shouldEmitDappViewedEvent() {
    return jest.requireMock('../../app/scripts/lib/util')
      .shouldEmitDappViewedEvent;
  },
} as {
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

describe('getIsPasskeyUserHandleBased', () => {
  it('returns true when the record uses userHandle key derivation', () => {
    const state = {
      metamask: {
        passkeyRecord: {
          keyDerivation: { method: 'userHandle' as const },
        },
      },
    };

    expect(getIsPasskeyUserHandleBased(state)).toBe(true);
  });

  it('returns false when the record uses PRF key derivation', () => {
    const state = {
      metamask: {
        passkeyRecord: {
          keyDerivation: { method: 'prf' as const },
        },
      },
    };

    expect(getIsPasskeyUserHandleBased(state)).toBe(false);
  });

  it('returns false when no passkey record exists', () => {
    const state = { metamask: { passkeyRecord: null } };
    expect(getIsPasskeyUserHandleBased(state)).toBe(false);
  });
});

describe('getIsPasskeyPRFBased', () => {
  it('returns true when the record uses PRF key derivation', () => {
    const state = {
      metamask: {
        passkeyRecord: {
          keyDerivation: { method: 'prf' as const },
        },
      },
    };

    expect(getIsPasskeyPRFBased(state)).toBe(true);
  });

  it('returns false when the record uses userHandle key derivation', () => {
    const state = {
      metamask: {
        passkeyRecord: {
          keyDerivation: { method: 'userHandle' as const },
        },
      },
    };

    expect(getIsPasskeyPRFBased(state)).toBe(false);
  });

  it('returns false when no passkey record exists', () => {
    const state = { metamask: { passkeyRecord: null } };
    expect(getIsPasskeyPRFBased(state)).toBe(false);
  });
});

describe('getPasskeyAuthenticatorType', () => {
  it('returns the enrolled passkey credential AAGUID', () => {
    const state = {
      metamask: {
        passkeyRecord: {
          credential: { aaguid: GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID },
        },
      },
    };

    expect(getPasskeyAuthenticatorId(state)).toBe(
      GOOGLE_PASSWORD_MANAGER_PASSKEY_AAGUID,
    );
  });

  it('returns undefined when no passkey record exists', () => {
    const state = { metamask: { passkeyRecord: null } };
    expect(getPasskeyAuthenticatorId(state)).toBeUndefined();
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
