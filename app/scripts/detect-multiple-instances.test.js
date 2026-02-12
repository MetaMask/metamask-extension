import browser from 'webextension-polyfill';
import {
  PLATFORM_CHROME,
  PLATFORM_EDGE,
  PLATFORM_FIREFOX,
  METAMASK_BETA_CHROME_ID,
  METAMASK_PROD_CHROME_ID,
  METAMASK_FLASK_CHROME_ID,
  METAMASK_MMI_PROD_CHROME_ID,
  METAMASK_MMI_BETA_CHROME_ID,
} from '../../shared/constants/app';
import {
  checkForMultipleVersionsRunning,
  onMessageReceived,
} from './detect-multiple-instances';
import * as util from './lib/util';

describe('multiple instances running detector', function () {
  const PING_MESSAGE = 'isRunning';

  const sendMessageStub = jest.fn();

  beforeEach(function () {
    sendMessageStub.mockClear();
    jest.replaceProperty(browser, 'runtime', {
      sendMessage: sendMessageStub,
      id: METAMASK_BETA_CHROME_ID,
    });
    jest.spyOn(util, 'getPlatform').mockReturnValue(PLATFORM_CHROME);
  });

  afterEach(function () {
    jest.restoreAllMocks();
  });

  describe('checkForMultipleVersionsRunning', function () {
    it('should send ping message to multiple instances', async function () {
      await checkForMultipleVersionsRunning();

      expect(sendMessageStub.mock.calls).toHaveLength(4);
      expect(
        sendMessageStub.mock.instances[0].sendMessage,
      ).toHaveBeenCalledWith(METAMASK_PROD_CHROME_ID, PING_MESSAGE);
      expect(
        sendMessageStub.mock.instances[1].sendMessage,
      ).toHaveBeenCalledWith(METAMASK_FLASK_CHROME_ID, PING_MESSAGE);
      expect(
        sendMessageStub.mock.instances[2].sendMessage,
      ).toHaveBeenCalledWith(METAMASK_MMI_BETA_CHROME_ID, PING_MESSAGE);
      expect(
        sendMessageStub.mock.instances[3].sendMessage,
      ).toHaveBeenCalledWith(METAMASK_MMI_PROD_CHROME_ID, PING_MESSAGE);
    });

    it('should send ping message using Chrome IDs for non-Firefox browsers', async function () {
      jest.spyOn(util, 'getPlatform').mockReturnValue(PLATFORM_EDGE);

      await checkForMultipleVersionsRunning();

      // Edge and other Chromium browsers use Chrome Web Store IDs
      expect(sendMessageStub.mock.calls).toHaveLength(4);
      expect(
        sendMessageStub.mock.instances[0].sendMessage,
      ).toHaveBeenCalledWith(METAMASK_PROD_CHROME_ID, PING_MESSAGE);
    });

    it('should send ping message using Firefox IDs for Firefox', async function () {
      jest.spyOn(util, 'getPlatform').mockReturnValue(PLATFORM_FIREFOX);

      await checkForMultipleVersionsRunning();

      // Firefox uses its own extension IDs (3 builds: beta, prod, flask)
      // Current runtime.id is METAMASK_BETA_CHROME_ID which won't match Firefox IDs,
      // so all 3 Firefox IDs will be pinged
      expect(sendMessageStub.mock.calls).toHaveLength(3);
    });

    it('should not expose an error outside if sendMessage throws', async function () {
      jest.replaceProperty(browser, 'runtime', {
        sendMessage: sendMessageStub.mockImplementation(() => {
          throw new Error();
        }),
        id: METAMASK_BETA_CHROME_ID,
      });

      expect(async () => await checkForMultipleVersionsRunning()).not.toThrow();
    });
  });

  describe('onMessageReceived', function () {
    beforeEach(function () {
      jest.spyOn(console, 'warn');
    });

    it('should print warning message to on ping message received', async function () {
      onMessageReceived(PING_MESSAGE);

      expect(console.warn).toHaveBeenCalledWith(
        'Warning! You have multiple instances of MetaMask running!',
      );
    });

    it('should not print warning message if wrong message received', async function () {
      onMessageReceived(PING_MESSAGE.concat('wrong'));

      expect(console.warn).not.toHaveBeenCalled();
    });
  });
});
