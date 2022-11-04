import { isPrefixedFormattedHexString } from '../../../shared/modules/network.utils';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_BACKGROUND,
  PLATFORM_FIREFOX,
  PLATFORM_OPERA,
  PLATFORM_CHROME,
  PLATFORM_EDGE,
} from '../../../shared/constants/app';
import { getEnvironmentType, getPlatform } from './util';

describe('app utils', () => {
  describe('getEnvironmentType', () => {
    it('should return popup type', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/popup.html',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_POPUP);
    });

    it('should return notification type', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/notification.html',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_NOTIFICATION);
    });

    it('should return fullscreen type for home.html', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/home.html',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_FULLSCREEN);
    });

    it('should return background type', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/_generated_background_page.html',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_BACKGROUND);
    });

    it('should return the correct type for a URL with a hash fragment', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/popup.html#hash',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_POPUP);
    });

    it('should return the correct type for a URL with query parameters', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/popup.html?param=foo',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_POPUP);
    });

    it('should return the correct type for a URL with query parameters and a hash fragment', () => {
      const environmentType = getEnvironmentType(
        'http://extension-id/popup.html?param=foo#hash',
      );
      expect(environmentType).toStrictEqual(ENVIRONMENT_TYPE_POPUP);
    });
  });

  describe('isPrefixedFormattedHexString', () => {
    it('should return true for valid hex strings', () => {
      expect(isPrefixedFormattedHexString('0x1')).toStrictEqual(true);

      expect(isPrefixedFormattedHexString('0xa')).toStrictEqual(true);

      expect(
        isPrefixedFormattedHexString('0xabcd1123fae909aad87452'),
      ).toStrictEqual(true);
    });

    it('should return false for invalid hex strings', () => {
      expect(isPrefixedFormattedHexString('0x')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString('0x0')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString('0x01')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString(' 0x1')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString('0x1 ')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString('0x1afz')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString('z')).toStrictEqual(false);

      expect(isPrefixedFormattedHexString(2)).toStrictEqual(false);

      expect(isPrefixedFormattedHexString(['0x1'])).toStrictEqual(false);

      expect(isPrefixedFormattedHexString()).toStrictEqual(false);
    });
  });

  describe('getPlatform', () => {
    let userAgent, setBrowserSpecificWindow;

    beforeEach(() => {
      userAgent = jest.spyOn(window.navigator, 'userAgent', 'get');

      setBrowserSpecificWindow = (browser) => {
        switch (browser) {
          case 'firefox': {
            userAgent.mockReturnValue(
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:95.0) Gecko/20100101 Firefox/95.0',
            );
            break;
          }
          case 'edge': {
            userAgent.mockReturnValue(
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36 Edg/95.0.1020.30',
            );
            break;
          }
          case 'opera': {
            userAgent.mockReturnValue(
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36 OPR/80.0.4170.63',
            );

            break;
          }
          default: {
            userAgent.mockReturnValue(
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
            );
            break;
          }
        }
      };
    });

    it('should detect Firefox', () => {
      setBrowserSpecificWindow('firefox');
      expect(getPlatform()).toStrictEqual(PLATFORM_FIREFOX);
    });

    it('should detect Edge', () => {
      setBrowserSpecificWindow('edge');
      expect(getPlatform()).toStrictEqual(PLATFORM_EDGE);
    });

    it('should detect Opera', () => {
      setBrowserSpecificWindow('opera');
      expect(getPlatform()).toStrictEqual(PLATFORM_OPERA);
    });

    it('should detect Chrome', () => {
      setBrowserSpecificWindow('chrome');
      expect(getPlatform()).toStrictEqual(PLATFORM_CHROME);
    });
  });
});
