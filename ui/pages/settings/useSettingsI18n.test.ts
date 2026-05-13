import { renderHook } from '@testing-library/react-hooks';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useSettingsI18n } from './useSettingsI18n';

jest.mock('../../../shared/lib/passkey', () => ({
  getPasskeyAuthMethodKey: jest.fn(() => 'passkeyAuthMethodBiometrics'),
}));

jest.mock('../../hooks/useI18nContext');

const mockUseI18nContext = jest.mocked(useI18nContext);

const { getPasskeyAuthMethodKey } = jest.requireMock<
  typeof import('../../../shared/lib/passkey')
>('../../../shared/lib/passkey');

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
