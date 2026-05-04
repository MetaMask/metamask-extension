import {
  type I18NMessageDict,
  fetchLocale,
  loadRelativeTimeFormatLocaleData,
} from './i18n';
import { SUPPORT_LINK } from './ui-utils';
import {
  maybeGetLocaleContext,
  getErrorHtml,
  getLocaleContext,
  setupLocale,
  getErrorHtmlBase,
} from './error-utils';
import getFirstPreferredLangCode from './get-first-preferred-lang-code';

jest.mock('./i18n', () => ({
  fetchLocale: jest.fn(),
  loadRelativeTimeFormatLocaleData: jest.fn(),
}));
jest.mock('./deep-linking', () => ({
  openCustomProtocol: jest.fn(),
}));
jest.mock('./get-first-preferred-lang-code', () => jest.fn());
jest.mock('./switch-direction', () => ({
  switchDirectionForPreferredLocale: jest.fn(),
}));

jest.mock('webextension-polyfill', () => {
  return {
    runtime: {
      reload: jest.fn(),
    },
  };
});

const enMessages: I18NMessageDict = {
  troubleStartingTitle: { message: 'MetaMask had trouble starting.' },
  troubleStartingMessage: {
    message:
      'This error could be intermittent, so try restarting the extension.',
  },
  somethingIsWrong: { message: 'Something is wrong.' },
  restartMetamask: { message: 'Restart MetaMask' },
  stillGettingMessage: { message: 'Still getting this message?' },
  errorPageContactSupport: { message: 'Contact support' },
  errorDetails: { message: 'Error details' },
  reportThisError: { message: 'Report this error' },
  errorLegalTextSummary: { message: 'Legal summary' },
  errorLegalTextFirstInfo: { message: 'First legal info' },
  errorLegalTextSecondInfo: { message: 'Second legal info' },
  errorLegalTextNoPersonalInfo: { message: 'No personal info' },
};

describe('Error utils Tests', function () {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // Clear the memoize cache so each test gets fresh setupLocale calls
    setupLocale.cache.clear?.();

    (global as Record<string, unknown>).platform = {
      openTab: jest.fn(),
    };
  });

  afterAll(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    delete (global as Record<string, unknown>).platform;
  });

  describe('getLocaleContext', () => {
    it('returns the message from currentLocaleMessages when the key exists', () => {
      const current: I18NMessageDict = { greeting: { message: 'Hola' } };
      const en: I18NMessageDict = { greeting: { message: 'Hello' } };
      const t = getLocaleContext(current, en);
      expect(t('greeting')).toBe('Hola');
    });

    it('falls back to enLocaleMessages when key is missing from currentLocaleMessages', () => {
      const current: I18NMessageDict = {};
      const en: I18NMessageDict = { greeting: { message: 'Hello' } };
      const t = getLocaleContext(current, en);
      expect(t('greeting')).toBe('Hello');
    });

    it('returns undefined when the key is missing from both message dicts', () => {
      const t = getLocaleContext({}, {});
      expect(t('nonExistentKey')).toBeUndefined();
    });
  });

  describe('setupLocale', () => {
    it('reuses the en locale for currentLocaleMessages when currentLocale is "en"', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const result = await setupLocale('en');

      // fetchLocale should only be called once (for 'en'); the same promise is reused
      expect(fetchLocale).toHaveBeenCalledTimes(1);
      expect(fetchLocale).toHaveBeenCalledWith('en');
      expect(result.enLocaleMessages).toBe(result.currentLocaleMessages);
    });

    it('fetches a separate locale when currentLocale differs from "en"', async () => {
      const esMessages: I18NMessageDict = {
        troubleStartingTitle: { message: 'MetaMask tuvo problemas.' },
      };
      jest
        .mocked(fetchLocale)
        .mockResolvedValueOnce(enMessages) // en fetch
        .mockResolvedValueOnce(esMessages); // es fetch
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const result = await setupLocale('es_419');

      expect(fetchLocale).toHaveBeenCalledWith('en');
      expect(fetchLocale).toHaveBeenCalledWith('es_419');
      expect(result.enLocaleMessages).toStrictEqual(enMessages);
      expect(result.currentLocaleMessages).toStrictEqual(esMessages);
    });

    it('returns an empty object for currentLocaleMessages when currentLocale is undefined', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const result = await setupLocale(undefined);

      expect(result.currentLocaleMessages).toStrictEqual({});
      expect(result.enLocaleMessages).toStrictEqual(enMessages);
    });
  });

  describe('maybeGetLocaleContext', () => {
    it('uses getFirstPreferredLangCode when no currentLocale is provided', async () => {
      jest.mocked(getFirstPreferredLangCode).mockResolvedValue('fr');
      const frMessages: I18NMessageDict = {
        greeting: { message: 'Bonjour' },
      };
      jest
        .mocked(fetchLocale)
        .mockResolvedValueOnce(enMessages) // en fetch
        .mockResolvedValueOnce(frMessages); // fr fetch
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const context = await maybeGetLocaleContext();

      expect(getFirstPreferredLangCode).toHaveBeenCalledTimes(1);
      expect(context.preferredLocale).toBe('fr');
      expect(context.t('greeting')).toBe('Bonjour');
    });

    it('falls back gracefully and returns an identity t function when an error occurs', async () => {
      jest.mocked(fetchLocale).mockRejectedValue(new Error('Network failure'));
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);
      jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const context = await maybeGetLocaleContext('en');

      expect(console.error).toHaveBeenCalled();
      expect(context.preferredLocale).toBe('en');
      expect(context.t('anyKey')).toBe('anyKey');
    });

    it('falls back to "en" as preferredLocale when locale detection also fails', async () => {
      jest
        .mocked(getFirstPreferredLangCode)
        .mockRejectedValue(new Error('Detection failure'));
      jest.mocked(fetchLocale).mockRejectedValue(new Error('Network failure'));
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);
      jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const context = await maybeGetLocaleContext();

      expect(context.preferredLocale).toBe('en');
    });
  });

  describe('getErrorHtmlBase', () => {
    it('wraps content in the critical-error container markup', () => {
      const html = getErrorHtmlBase('<p>test body</p>');
      expect(html).toContain('critical-error__container');
      expect(html).toContain('critical-error');
      expect(html).toContain('<p>test body</p>');
    });
  });

  describe('getErrorHtml', () => {
    it('renders the troubleStarting error with support link and error details', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const error = new Error('Test error');
      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml(
        'troubleStarting',
        error,
        localeContext,
        SUPPORT_LINK,
      );

      expect(html).toContain(enMessages.troubleStartingTitle.message);
      expect(html).toContain(enMessages.troubleStartingMessage.message);
      expect(html).toContain(enMessages.restartMetamask.message);
      expect(html).toContain(enMessages.stillGettingMessage.message);
      expect(html).toContain(enMessages.errorPageContactSupport.message);
      expect(html).toContain('Test error');
    });

    it('renders the somethingIsWrong error message when errorKey is "somethingIsWrong"', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml('somethingIsWrong', undefined, localeContext);

      expect(html).toContain(enMessages.somethingIsWrong.message);
    });

    it('omits the support link footer when supportLink is not provided', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml('troubleStarting', undefined, localeContext);

      expect(html).not.toContain('critical-error__footer');
      expect(html).not.toContain(enMessages.stillGettingMessage.message);
    });

    it('omits the error details section when error has no message', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml('troubleStarting', undefined, localeContext);

      expect(html).not.toContain('critical-error__details');
    });

    it('includes the error details section when the error has a message', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const error = new Error('Something broke');
      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml('troubleStarting', error, localeContext);

      expect(html).toContain('critical-error__details');
      expect(html).toContain('Something broke');
    });

    it('includes attempt recovery link when hasBackup is true', async () => {
      const messagesWithBackup: I18NMessageDict = {
        ...enMessages,
        criticalErrorFooter: { message: '$1 $2 or $3' },
        criticalErrorAttemptRecovery: {
          message: 'Attempt recovery',
        },
      };
      jest.mocked(fetchLocale).mockResolvedValue(messagesWithBackup);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const error = new Error('Test error');
      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml(
        'troubleStarting',
        error,
        localeContext,
        SUPPORT_LINK,
        true,
      );

      expect(html).toContain('critical-error-restore-link');
      expect(html).toContain('Attempt recovery');
    });
  });
});
