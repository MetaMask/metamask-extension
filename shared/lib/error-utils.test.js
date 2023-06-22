import browser from 'webextension-polyfill';
import { fetchLocale } from '../modules/i18n';
import { SUPPORT_LINK } from './ui-utils';
import {
  downloadDesktopApp,
  openOrDownloadMMD,
  downloadExtension,
  getErrorHtml,
  restartExtension,
  registerDesktopErrorActions,
  MMD_DOWNLOAD_LINK,
} from './error-utils';
import { openCustomProtocol } from './deep-linking';

jest.mock('../modules/i18n', () => ({
  fetchLocale: jest.fn(),
  loadRelativeTimeFormatLocaleData: jest.fn(),
}));
jest.mock('./deep-linking', () => ({
  openCustomProtocol: jest.fn(),
}));

jest.mock('webextension-polyfill', () => {
  return {
    runtime: {
      reload: jest.fn(),
    },
  };
});

describe('Error utils Tests', function () {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    global.platform = {
      openTab: jest.fn(),
    };
  });

  afterAll(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    delete global.platform;
  });
  it('should get error html', async function () {
    const mockStore = {
      localeMessages: {
        current: {
          troubleStarting: {
            message:
              'MetaMask had trouble starting. This error could be intermittent, so try restarting the extension.',
          },
          restartMetamask: {
            message: 'Restart MetaMask',
          },
          stillGettingMessage: {
            message: 'Still getting this message?',
          },
          sendBugReport: {
            message: 'Send us a bug report.',
          },
        },
      },
      metamask: {
        currentLocale: 'en',
      },
    };

    fetchLocale.mockReturnValue(mockStore.localeMessages.current);
    const errorHtml = await getErrorHtml(
      'troubleStarting',
      SUPPORT_LINK,
      mockStore.metamask,
    );
    const currentLocale = mockStore.localeMessages.current;
    const troubleStartingMessage = currentLocale.troubleStarting.message;
    const restartMetamaskMessage = currentLocale.restartMetamask.message;
    const stillGettingMessageMessage =
      currentLocale.stillGettingMessage.message;
    const sendBugReportMessage = currentLocale.sendBugReport.message;

    expect(errorHtml).toContain(troubleStartingMessage);
    expect(errorHtml).toContain(restartMetamaskMessage);
    expect(errorHtml).toContain(stillGettingMessageMessage);
    expect(errorHtml).toContain(sendBugReportMessage);
  });
  describe('desktop', () => {
    it('downloadDesktopApp opens a new tab on metamask-desktop releases url', () => {
      downloadDesktopApp();

      expect(global.platform.openTab).toHaveBeenCalledTimes(1);
      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: MMD_DOWNLOAD_LINK,
      });
    });

    it('downloadExtension opens a new tab on metamask extension url', () => {
      downloadExtension();

      expect(global.platform.openTab).toHaveBeenCalledTimes(1);
      expect(global.platform.openTab).toHaveBeenCalledWith({
        url: 'https://metamask.io/',
      });
    });

    it('restartExtension calls runtime reload method', () => {
      restartExtension();

      expect(browser.runtime.reload).toHaveBeenCalledTimes(1);
    });

    describe('openOrDownloadMMD', () => {
      it('launches installed desktop app by calling openCustomProtocol successfully', () => {
        openCustomProtocol.mockResolvedValue();
        openOrDownloadMMD();

        expect(openCustomProtocol).toHaveBeenCalledTimes(1);
        expect(openCustomProtocol).toHaveBeenCalledWith(
          'metamask-desktop://pair',
        );
      });

      it('opens metamask-desktop release url when fails to find and start a local metamask-desktop app', async () => {
        openCustomProtocol.mockRejectedValue();
        const focusMock = jest.fn();
        jest.spyOn(window, 'open').mockReturnValue({
          focus: focusMock,
        });

        openOrDownloadMMD();

        // this ensures that we are awaiting for pending promises to resolve
        // as the openOrDownloadMMD calls a promise, but returns before it is resolved
        await new Promise(process.nextTick);

        expect(openCustomProtocol).toHaveBeenCalledTimes(1);
        expect(openCustomProtocol).toHaveBeenCalledWith(
          'metamask-desktop://pair',
        );

        expect(window.open).toHaveBeenCalledTimes(1);
        expect(window.open).toHaveBeenCalledWith(MMD_DOWNLOAD_LINK, '_blank');
        expect(focusMock).toHaveBeenCalledTimes(1);
      });
    });

    it('registerDesktopErrorActions add click event listeners for each desktop error elements', async () => {
      const addEventListenerMock = jest.fn();
      jest.spyOn(document, 'getElementById').mockReturnValue({
        addEventListener: addEventListenerMock,
      });

      registerDesktopErrorActions();

      expect(document.getElementById).toHaveBeenCalledTimes(4);
      expect(document.getElementById).toHaveBeenNthCalledWith(
        1,
        'desktop-error-button-disable-mmd',
      );
      expect(document.getElementById).toHaveBeenNthCalledWith(
        2,
        'desktop-error-button-restart-mm',
      );
      expect(document.getElementById).toHaveBeenNthCalledWith(
        3,
        'desktop-error-button-download-mmd',
      );
      expect(document.getElementById).toHaveBeenNthCalledWith(
        4,
        'desktop-error-button-open-or-download-mmd',
      );

      expect(addEventListenerMock).toHaveBeenCalledTimes(4);
    });
  });
});
