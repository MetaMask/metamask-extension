import { setupLocale } from '../shared/lib/error-utils';

const mockENMessages = {
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
};

const mockESMessages = {
  troubleStarting: {
    message:
      'MetaMask tuvo problemas para iniciarse. Este error podría ser intermitente, así que intente reiniciar la extensión.',
  },
  restartMetamask: {
    message: 'Reiniciar metamáscara',
  },
  sendBugReport: {
    message: 'Envíenos un informe de errores.',
  },
};

jest.mock('./helpers/utils/i18n-helper', () => ({
  fetchLocale: jest.fn((locale) =>
    locale === 'en' ? mockENMessages : mockESMessages,
  ),
  loadRelativeTimeFormatLocaleData: jest.fn(),
}));

describe('Index Tests', () => {
  it('should get locale messages by calling setupLocale', async () => {
    let result = await setupLocale('en');
    const { currentLocaleMessages: clm, enLocaleMessages: elm } = result;
    expect(clm).toBeDefined();
    expect(elm).toBeDefined();
    expect(clm.troubleStarting).toStrictEqual(mockENMessages.troubleStarting);

    expect(clm.restartMetamask).toStrictEqual(mockENMessages.restartMetamask);

    expect(clm.stillGettingMessage).toStrictEqual(
      mockENMessages.stillGettingMessage,
    );

    expect(clm.sendBugReport).toStrictEqual(mockENMessages.sendBugReport);

    result = await setupLocale('es');

    const { currentLocaleMessages: clm2, enLocaleMessages: elm2 } = result;
    expect(clm2).toBeDefined();
    expect(elm2).toBeDefined();

    expect(clm2.troubleStarting).toStrictEqual(mockESMessages.troubleStarting);

    expect(clm2.restartMetamask).toStrictEqual(mockESMessages.restartMetamask);

    expect(clm2.stillGettingMessage).toBeUndefined();
    expect(elm2.stillGettingMessage).toStrictEqual(
      mockENMessages.stillGettingMessage,
    );

    expect(clm2.sendBugReport).toStrictEqual(mockESMessages.sendBugReport);
  });
});
