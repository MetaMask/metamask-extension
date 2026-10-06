import { renderHook } from '@testing-library/react';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useSettingsI18n } from './useSettingsI18n';

jest.mock('../../../shared/lib/passkey/passkey-auth-method', () => ({
  getPasskeyAuthMethodKey: jest.fn(() => 'passkeyAuthMethodBiometrics'),
}));

jest.mock('../../hooks/useI18nContext');

const mockUseI18nContext = jest.mocked(useI18nContext);

const { getPasskeyAuthMethodKey } = {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PasskeyCeremonyTimeoutError() {
    return jest.requireMock('../../../shared/lib/passkey/passkey-ceremony')
      .PasskeyCeremonyTimeoutError;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get PasskeyPRFRequiredError() {
    return jest.requireMock('../../../shared/lib/passkey/passkey-capabilities')
      .PasskeyPRFRequiredError;
  },
  get cancelPasskeyCeremony() {
    return jest.requireMock('../../../shared/lib/passkey/passkey-ceremony')
      .cancelPasskeyCeremony;
  },
  get getPasskeyAuthMethodKey() {
    return jest.requireMock('../../../shared/lib/passkey/passkey-auth-method')
      .getPasskeyAuthMethodKey;
  },
  get getPasskeyErrorCode() {
    return jest.requireMock('../../../shared/lib/passkey/passkey-error')
      .getPasskeyErrorCode;
  },
  get hasPasskeyPRFEnabled() {
    return jest.requireMock('../../../shared/lib/passkey/passkey-capabilities')
      .hasPasskeyPRFEnabled;
  },
  get hasPasskeyPRFResult() {
    return jest.requireMock('../../../shared/lib/passkey/passkey-capabilities')
      .hasPasskeyPRFResult;
  },
  get isPasskeyAaguidIncompatibleWithSidepanel() {
    return jest.requireMock(
      '../../../shared/lib/passkey/passkey-sidepanel-aaguid',
    ).isPasskeyAaguidIncompatibleWithSidepanel;
  },
  get isPasskeyCeremonySilentError() {
    return jest.requireMock('../../../shared/lib/passkey/passkey-ceremony')
      .isPasskeyCeremonySilentError;
  },
  get isPasskeyPRFSupported() {
    return jest.requireMock('../../../shared/lib/passkey/passkey-capabilities')
      .isPasskeyPRFSupported;
  },
  get isWebAuthnSupported() {
    return jest.requireMock('../../../shared/lib/passkey/passkey-capabilities')
      .isWebAuthnSupported;
  },
  get startPasskeyAuthentication() {
    return jest.requireMock('../../../shared/lib/passkey/passkey-ceremony')
      .startPasskeyAuthentication;
  },
  get startPasskeyRegistration() {
    return jest.requireMock('../../../shared/lib/passkey/passkey-ceremony')
      .startPasskeyRegistration;
  },
  get translatePasskeyError() {
    return jest.requireMock('../../../shared/lib/passkey/passkey-error')
      .translatePasskeyError;
  },
};

describe('useSettingsI18n', () => {
  beforeEach(() => {
    mockUseI18nContext.mockReset();
  });

  it('forwards to raw t when substitutions are passed', () => {
    const rawT = jest.fn(() => 'forwarded');
    mockUseI18nContext.mockReturnValue(rawT);

    const { result } = renderHook(() => useSettingsI18n());
    expect(result.current('settingsSearchCantFindSetting', [{}])).toBe(
      'forwarded',
    );

    expect(rawT).toHaveBeenCalledWith('settingsSearchCantFindSetting', [{}]);
  });

  it('fills passkey placeholder for unlockWithPasskey when only key is passed', () => {
    const rawT = jest.fn((key: string, substitutions?: string[]) => {
      if (key === 'passkeyAuthMethodBiometrics') {
        return 'Biometrics';
      }
      if (key === 'unlockWithPasskey' && substitutions?.[0] === 'Biometrics') {
        return 'Unlock with Biometrics';
      }
      return key;
    });
    mockUseI18nContext.mockReturnValue(rawT);

    const { result } = renderHook(() => useSettingsI18n());
    expect(result.current('unlockWithPasskey')).toBe('Unlock with Biometrics');
    expect(getPasskeyAuthMethodKey).toHaveBeenCalled();
    expect(rawT).toHaveBeenCalledWith('passkeyAuthMethodBiometrics');
    expect(rawT).toHaveBeenCalledWith('unlockWithPasskey', ['Biometrics']);
  });

  it('fills passkey placeholder for setUpPasskey and turnOffPasskey', () => {
    const rawT = jest.fn((key: string, substitutions?: string[]) => {
      if (key === 'passkeyAuthMethodBiometrics') {
        return 'X';
      }
      if (substitutions?.[0] === 'X') {
        return `${key} done`;
      }
      return key;
    });
    mockUseI18nContext.mockReturnValue(rawT);

    const { result } = renderHook(() => useSettingsI18n());
    expect(result.current('setUpPasskey')).toBe('setUpPasskey done');
    expect(result.current('turnOffPasskey')).toBe('turnOffPasskey done');
  });

  it('delegates to raw t for keys without passkey substitution', () => {
    const rawT = jest.fn((key: string) => `:${key}:`);
    mockUseI18nContext.mockReturnValue(rawT);

    const { result } = renderHook(() => useSettingsI18n());
    expect(result.current('theme')).toBe(':theme:');
    expect(rawT).toHaveBeenCalledWith('theme');
  });
});
