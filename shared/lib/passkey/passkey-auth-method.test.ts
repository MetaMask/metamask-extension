import Bowser from 'bowser';
import { getPasskeyAuthMethodKey } from './passkey-auth-method';

describe('getPasskeyAuthMethodKey', () => {
  const getOSNameMock = jest.fn();
  let getParserSpy: jest.SpyInstance;

  beforeEach(() => {
    getParserSpy = jest.spyOn(Bowser, 'getParser').mockReturnValue({
      getOSName: getOSNameMock,
    } as unknown as Bowser.Parser.Parser);
  });

  afterEach(() => {
    getParserSpy.mockRestore();
  });

  describe('Windows', () => {
    beforeEach(() => {
      getOSNameMock.mockReturnValue(Bowser.OS_MAP.Windows);
    });

    it('returns Windows Hello key', () => {
      expect(getPasskeyAuthMethodKey()).toBe('passkeyAuthMethodWindowsHello');
    });

    it('returns Windows Hello key even when specific is true', () => {
      expect(getPasskeyAuthMethodKey({ specific: true })).toBe(
        'passkeyAuthMethodWindowsHello',
      );
    });
  });

  describe('macOS', () => {
    beforeEach(() => {
      getOSNameMock.mockReturnValue(Bowser.OS_MAP.MacOS);
    });

    it('returns Biometrics key by default', () => {
      expect(getPasskeyAuthMethodKey()).toBe('passkeyAuthMethodBiometrics');
    });

    it('returns Biometrics key when specific is false', () => {
      expect(getPasskeyAuthMethodKey({ specific: false })).toBe(
        'passkeyAuthMethodBiometrics',
      );
    });

    it('returns Touch ID key when specific is true', () => {
      expect(getPasskeyAuthMethodKey({ specific: true })).toBe(
        'passkeyAuthMethodTouchId',
      );
    });
  });

  for (const [label, bowserName] of [
    ['Linux', Bowser.OS_MAP.Linux],
    ['iOS', Bowser.OS_MAP.iOS],
    ['Android', Bowser.OS_MAP.Android],
  ] as const) {
    describe(`non-Windows, non-macOS (${label})`, () => {
      beforeEach(() => {
        getOSNameMock.mockReturnValue(bowserName);
      });

      it('returns Biometrics key by default', () => {
        expect(getPasskeyAuthMethodKey()).toBe('passkeyAuthMethodBiometrics');
      });

      it('returns Biometrics key even when specific is true', () => {
        expect(getPasskeyAuthMethodKey({ specific: true })).toBe(
          'passkeyAuthMethodBiometrics',
        );
      });
    });
  }

  describe('unknown / other Bowser OS names', () => {
    beforeEach(() => {
      getOSNameMock.mockReturnValue(Bowser.OS_MAP.ChromeOS);
    });

    it('returns Biometrics key by default', () => {
      expect(getPasskeyAuthMethodKey()).toBe('passkeyAuthMethodBiometrics');
    });

    it('returns Biometrics key even when specific is true', () => {
      expect(getPasskeyAuthMethodKey({ specific: true })).toBe(
        'passkeyAuthMethodBiometrics',
      );
    });
  });
});
