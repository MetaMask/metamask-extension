import {
  CriticalErrorRepairAction,
  CriticalErrorType,
} from '../constants/state-corruption';
import {
  INACCESSIBLE_DATABASE_ERROR,
  MISSING_VAULT_ERROR,
} from '../constants/errors';
import {
  type I18NMessageDict,
  fetchLocale,
  loadRelativeTimeFormatLocaleData,
} from './i18n';
import { REINSTALL_METAMASK_RECOVERY_LINK, SUPPORT_LINK } from './ui-utils';
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
  errorPageContactSupport: { message: 'Contact support' },
  reportThisError: { message: 'Report this error' },
  errorLegalTextSummary: { message: 'Legal summary' },
  errorLegalTextFirstInfo: { message: 'First legal info' },
  errorLegalTextSecondInfo: { message: 'Second legal info' },
  errorLegalTextNoPersonalInfo: { message: 'No personal info' },
  criticalErrorAttemptRecovery: { message: 'Attempt recovery' },
  criticalErrorRecoverAccounts: { message: 'Recover accounts' },
  criticalErrorReinstallMetamask: { message: 'Reinstall MetaMask' },
  criticalErrorStillHavingIssues: { message: 'Still having issues?' },
  criticalErrorStateCorruptionRecoverMessage: {
    message:
      'Recovering accounts will delete your current settings and preferences.',
  },
  criticalErrorStateCorruptionResetMessage: {
    message:
      'Resetting MetaMask state will delete your current accounts, settings and preferences.',
  },
  criticalErrorResetMetaMaskState: { message: 'Reset MetaMask State' },
  criticalErrorFooterContactSupport: {
    message: 'If none of the above works, $1',
  },
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
      expect(html).toContain('critical-error__inner');
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
      expect(html).toContain('critical-error__body');
      expect(html).toContain('critical-error__footer-actions');
      expect(html).toContain('width="20"');
      expect(html).toContain('height="20"');
      expect(html).toContain(enMessages.restartMetamask.message);
      expect(html).toContain('If none of the above works,');
      expect(html).toContain(
        enMessages.errorPageContactSupport.message.toLowerCase(),
      );
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

      expect(html).not.toContain('class="critical-error__footer"');
      expect(html).not.toContain('If none of the above works,');
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

    it('includes repair button when repairAction is recover', async () => {
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
        CriticalErrorRepairAction.Recover,
      );

      expect(html).toContain('critical-error-repair-button');
      expect(html).toContain(enMessages.criticalErrorAttemptRecovery.message);
      expect(html).not.toContain(
        enMessages.criticalErrorRecoverAccounts.message,
      );
      expect(html).toContain('critical-error__button-secondary');

      const container = document.createElement('div');
      container.innerHTML = html;
      const repairButton = container.querySelector<HTMLButtonElement>(
        '#critical-error-repair-button',
      );
      expect(repairButton?.disabled).toBe(true);
      expect(repairButton?.classList).toContain(
        'critical-error__button-secondary',
      );
      expect(repairButton?.classList).not.toContain('btn-primary');
    });

    it('uses recover accounts button copy for state corruption recover action', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml(
        'troubleStarting',
        { message: MISSING_VAULT_ERROR },
        localeContext,
        SUPPORT_LINK,
        CriticalErrorRepairAction.Recover,
        CriticalErrorType.MissingVaultInDatabase,
      );

      expect(html).toContain('critical-error-repair-button');
      expect(html).toContain(enMessages.criticalErrorRecoverAccounts.message);
      expect(html).not.toContain(
        enMessages.criticalErrorAttemptRecovery.message,
      );
    });

    it('uses attempt recovery button copy for inaccessible database recover action', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml(
        'troubleStarting',
        { message: INACCESSIBLE_DATABASE_ERROR },
        localeContext,
        SUPPORT_LINK,
        CriticalErrorRepairAction.Recover,
        CriticalErrorType.InaccessibleDatabase,
      );

      expect(html).toContain('critical-error-repair-button');
      expect(html).toContain(enMessages.criticalErrorAttemptRecovery.message);
      expect(html).not.toContain(
        enMessages.criticalErrorRecoverAccounts.message,
      );
    });

    it('uses state corruption intro copy for state corruption errors', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml(
        'troubleStarting',
        undefined,
        localeContext,
        SUPPORT_LINK,
        CriticalErrorRepairAction.Recover,
        CriticalErrorType.MissingVaultInDatabase,
      );

      expect(html).toContain(
        enMessages.criticalErrorStateCorruptionRecoverMessage.message,
      );
      expect(html).not.toContain(
        enMessages.criticalErrorStateCorruptionResetMessage.message,
      );
      expect(html).not.toContain(enMessages.troubleStartingMessage.message);
    });

    it('includes reset state button when repairAction is reset', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml(
        'troubleStarting',
        undefined,
        localeContext,
        SUPPORT_LINK,
        CriticalErrorRepairAction.Reset,
        CriticalErrorType.MissingVaultInDatabase,
      );

      expect(html).toContain('critical-error-repair-button');
      expect(html).toContain(
        enMessages.criticalErrorResetMetaMaskState.message,
      );
      expect(html).toContain(
        enMessages.criticalErrorStateCorruptionResetMessage.message,
      );
      expect(html).not.toContain(
        enMessages.criticalErrorStateCorruptionRecoverMessage.message,
      );
      expect(html).not.toContain(
        enMessages.criticalErrorAttemptRecovery.message,
      );

      const container = document.createElement('div');
      container.innerHTML = html;
      const repairButton = container.querySelector<HTMLButtonElement>(
        '#critical-error-repair-button',
      );
      expect(repairButton?.disabled).toBe(true);
    });

    it('omits the restart button and divider for state corruption errors', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml(
        'troubleStarting',
        undefined,
        localeContext,
        SUPPORT_LINK,
        CriticalErrorRepairAction.Recover,
        CriticalErrorType.MissingVaultInDatabase,
      );

      const container = document.createElement('div');
      container.innerHTML = html;

      expect(container.querySelector('#critical-error-button')).toBeNull();
      expect(container.querySelector('.critical-error__divider')).toBeNull();
      expect(
        container.querySelector('#critical-error-repair-button')?.classList,
      ).toContain('btn-primary');
      expect(html).not.toContain(enMessages.restartMetamask.message);
      expect(html).not.toContain(
        enMessages.criticalErrorStillHavingIssues.message,
      );
    });

    it('omits the repair button when repairAction is none', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml(
        'troubleStarting',
        undefined,
        localeContext,
        SUPPORT_LINK,
        CriticalErrorRepairAction.None,
      );

      expect(html).not.toContain('critical-error-repair-button');
      expect(html).not.toContain(
        enMessages.criticalErrorAttemptRecovery.message,
      );
    });

    it('omits the state corruption intro copy when repairAction is none', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml(
        'troubleStarting',
        undefined,
        localeContext,
        SUPPORT_LINK,
        CriticalErrorRepairAction.None,
        CriticalErrorType.MissingVaultInDatabase,
      );

      expect(html).not.toContain(
        enMessages.criticalErrorStateCorruptionRecoverMessage.message,
      );
      expect(html).not.toContain(
        enMessages.criticalErrorStateCorruptionResetMessage.message,
      );
      expect(html).not.toContain(enMessages.troubleStartingMessage.message);
    });

    it('always renders the reinstall MetaMask button with the SRP recovery link', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml(
        'troubleStarting',
        undefined,
        localeContext,
        SUPPORT_LINK,
        CriticalErrorRepairAction.None,
      );

      expect(html).toContain('critical-error-reinstall-link');
      expect(html).toContain(enMessages.criticalErrorReinstallMetamask.message);
      expect(html).toContain(REINSTALL_METAMASK_RECOVERY_LINK);
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('critical-error__external-icon');
    });

    it('renders the "Still having issues?" divider above the secondary actions', async () => {
      jest.mocked(fetchLocale).mockResolvedValue(enMessages);
      jest
        .mocked(loadRelativeTimeFormatLocaleData)
        .mockResolvedValue(undefined);

      const localeContext = await maybeGetLocaleContext('en');
      const html = getErrorHtml(
        'troubleStarting',
        undefined,
        localeContext,
        SUPPORT_LINK,
        CriticalErrorRepairAction.None,
      );

      expect(html).toContain('critical-error__divider');
      expect(html).toContain(enMessages.criticalErrorStillHavingIssues.message);
    });
  });
});
