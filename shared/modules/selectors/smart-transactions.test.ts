import ExtensionPlatform from '../../../app/scripts/platforms/extension';
import { Platform } from '../../../types/global';
import { getMeetsMinimumVersionToShowOptInModal } from './smart-transactions';

const minVersionMock = '1.2.3';

const makeMinVersionFlags = (optInModalMinVersion: string) => ({
  smartTransactions: { optInModalMinVersion },
});

describe('getMeetsMinimumVersionToShowOptInModal', () => {
  const getCurrentVersionMock = jest.fn();
  const mockExtensionPlatform = {
    getVersion: getCurrentVersionMock,
  } as unknown as ExtensionPlatform;

  let originalPlatform: Platform;

  beforeAll(() => {
    originalPlatform = global.platform;
    global.platform = mockExtensionPlatform;
  });

  beforeEach(() => {
    getCurrentVersionMock.mockClear();
  });

  afterAll(() => {
    global.platform = originalPlatform;
  });

  describe('normal behavior', () => {
    const featureFlags = makeMinVersionFlags(minVersionMock);

    it.each([
      // [expectedOutcome, condition, currentVersion]
      [true, 'equal to the minimum required version', '1.2.3'],
      [true, 'exceeds the minimum required version', '1.2.4'],
      [false, 'below the minimum required version', '1.2.2'],
    ])(
      'returns %s when the current version is %s, testing condition: %s',
      (expectedResult, _description, currentVersion) => {
        getCurrentVersionMock.mockReturnValue(currentVersion);
        const selector =
          getMeetsMinimumVersionToShowOptInModal.resultFunc(featureFlags);
        expect(selector).toBe(expectedResult);
      },
    );
  });

  describe('edge cases', () => {
    it('returns false when the minimum version is not parseable', () => {
      getCurrentVersionMock.mockReturnValue('1.2.3');
      const selector = getMeetsMinimumVersionToShowOptInModal.resultFunc(
        makeMinVersionFlags('invalid.min.version'),
      );
      expect(selector).toBeFalsy();
    });

    it('returns false when the platform version is not parseable', () => {
      getCurrentVersionMock.mockReturnValue('invalid.version');
      const selector = getMeetsMinimumVersionToShowOptInModal.resultFunc(
        makeMinVersionFlags(minVersionMock),
      );
      expect(selector).toBeFalsy();
    });

    it('returns false when feature flags are missing', () => {
      getCurrentVersionMock.mockReturnValue('1.2.3');
      const featureFlags = null;
      const selector =
        getMeetsMinimumVersionToShowOptInModal.resultFunc(featureFlags);
      expect(selector).toBeFalsy();
    });
  });
});
