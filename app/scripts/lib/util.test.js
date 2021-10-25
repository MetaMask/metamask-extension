import { strict as assert } from 'assert';
import sinon from 'sinon';
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

describe('app utils', function () {
  describe('getEnvironmentType', function () {
    it('should return popup type', function () {
      const environmentType = getEnvironmentType(
        'http://extension-id/popup.html',
      );
      assert.equal(environmentType, ENVIRONMENT_TYPE_POPUP);
    });

    it('should return notification type', function () {
      const environmentType = getEnvironmentType(
        'http://extension-id/notification.html',
      );
      assert.equal(environmentType, ENVIRONMENT_TYPE_NOTIFICATION);
    });

    it('should return fullscreen type for home.html', function () {
      const environmentType = getEnvironmentType(
        'http://extension-id/home.html',
      );
      assert.equal(environmentType, ENVIRONMENT_TYPE_FULLSCREEN);
    });

    it('should return fullscreen type for phishing.html', function () {
      const environmentType = getEnvironmentType(
        'http://extension-id/phishing.html',
      );
      assert.equal(environmentType, ENVIRONMENT_TYPE_FULLSCREEN);
    });

    it('should return background type', function () {
      const environmentType = getEnvironmentType(
        'http://extension-id/_generated_background_page.html',
      );
      assert.equal(environmentType, ENVIRONMENT_TYPE_BACKGROUND);
    });

    it('should return the correct type for a URL with a hash fragment', function () {
      const environmentType = getEnvironmentType(
        'http://extension-id/popup.html#hash',
      );
      assert.equal(environmentType, ENVIRONMENT_TYPE_POPUP);
    });

    it('should return the correct type for a URL with query parameters', function () {
      const environmentType = getEnvironmentType(
        'http://extension-id/popup.html?param=foo',
      );
      assert.equal(environmentType, ENVIRONMENT_TYPE_POPUP);
    });

    it('should return the correct type for a URL with query parameters and a hash fragment', function () {
      const environmentType = getEnvironmentType(
        'http://extension-id/popup.html?param=foo#hash',
      );
      assert.equal(environmentType, ENVIRONMENT_TYPE_POPUP);
    });
  });

  describe('isPrefixedFormattedHexString', function () {
    it('should return true for valid hex strings', function () {
      assert.equal(
        isPrefixedFormattedHexString('0x1'),
        true,
        'should return true',
      );

      assert.equal(
        isPrefixedFormattedHexString('0xa'),
        true,
        'should return true',
      );

      assert.equal(
        isPrefixedFormattedHexString('0xabcd1123fae909aad87452'),
        true,
        'should return true',
      );
    });

    it('should return false for invalid hex strings', function () {
      assert.equal(
        isPrefixedFormattedHexString('0x'),
        false,
        'should return false',
      );

      assert.equal(
        isPrefixedFormattedHexString('0x0'),
        false,
        'should return false',
      );

      assert.equal(
        isPrefixedFormattedHexString('0x01'),
        false,
        'should return false',
      );

      assert.equal(
        isPrefixedFormattedHexString(' 0x1'),
        false,
        'should return false',
      );

      assert.equal(
        isPrefixedFormattedHexString('0x1 '),
        false,
        'should return false',
      );

      assert.equal(
        isPrefixedFormattedHexString('0x1afz'),
        false,
        'should return false',
      );

      assert.equal(
        isPrefixedFormattedHexString('z'),
        false,
        'should return false',
      );

      assert.equal(
        isPrefixedFormattedHexString(2),
        false,
        'should return false',
      );

      assert.equal(
        isPrefixedFormattedHexString(['0x1']),
        false,
        'should return false',
      );

      assert.equal(
        isPrefixedFormattedHexString(),
        false,
        'should return false',
      );
    });
  });

  describe('getPlatform', function () {
    const setBrowserSpecificWindow = (browser) => {
      switch (browser) {
        case 'firefox': {
          sinon.stub(window, 'navigator').value({
            userAgent:
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:95.0) Gecko/20100101 Firefox/95.0',
          });
          break;
        }
        case 'edge': {
          sinon.stub(window, 'navigator').value({
            userAgent:
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36 Edg/95.0.1020.30',
          });
          break;
        }
        case 'opera': {
          sinon.stub(window, 'navigator').value({
            userAgent:
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36 OPR/80.0.4170.63',
          });
          break;
        }
        default: {
          sinon.stub(window, 'navigator').value({
            userAgent:
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
          });
          break;
        }
      }
    };

    it('should detect Firefox', function () {
      setBrowserSpecificWindow('firefox');
      assert.equal(getPlatform(), PLATFORM_FIREFOX);
    });

    it('should detect Edge', function () {
      setBrowserSpecificWindow('edge');
      assert.equal(getPlatform(), PLATFORM_EDGE);
    });

    it('should detect Opera', function () {
      setBrowserSpecificWindow('opera');
      assert.equal(getPlatform(), PLATFORM_OPERA);
    });

    it('should detect Chrome', function () {
      setBrowserSpecificWindow('chrome');
      assert.equal(getPlatform(), PLATFORM_CHROME);
    });
  });
});
