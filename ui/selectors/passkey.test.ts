import { getIsPasskeyFeatureAvailable } from './selectors';

jest.mock('../../shared/lib/environment', () => ({
  getIsPasskeyFeatureEnabled: jest.fn(),
}));

jest.mock('../../shared/lib/passkey', () => ({
  isWebAuthnSupported: jest.fn(),
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

const { getIsSocialLoginFlow } = jest.requireMock('./first-time-flow') as {
  getIsSocialLoginFlow: jest.Mock;
};

describe('getIsPasskeyFeatureAvailable', () => {
  const mockState = {} as Parameters<typeof getIsPasskeyFeatureAvailable>[0];

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns true when build flag is enabled, WebAuthn is supported, and not social login', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(true);
    isWebAuthnSupported.mockReturnValue(true);
    getIsSocialLoginFlow.mockReturnValue(false);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(true);
  });

  it('returns false when build flag is disabled', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(false);
    isWebAuthnSupported.mockReturnValue(true);
    getIsSocialLoginFlow.mockReturnValue(false);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });

  it('returns false when WebAuthn is not supported', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(true);
    isWebAuthnSupported.mockReturnValue(false);
    getIsSocialLoginFlow.mockReturnValue(false);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });

  it('returns false when user is on social login flow', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(true);
    isWebAuthnSupported.mockReturnValue(true);
    getIsSocialLoginFlow.mockReturnValue(true);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });

  it('returns false when all conditions are negative', () => {
    getIsPasskeyFeatureEnabled.mockReturnValue(false);
    isWebAuthnSupported.mockReturnValue(false);
    getIsSocialLoginFlow.mockReturnValue(true);

    expect(getIsPasskeyFeatureAvailable(mockState)).toBe(false);
  });
});
