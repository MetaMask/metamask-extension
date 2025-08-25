import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { setupLocale } from '../shared/lib/error-utils';
import { getCleanAppState } from '.';

const enMessages = {
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

const esMessages = {
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

jest.mock('../shared/modules/i18n', () => ({
  fetchLocale: jest.fn((locale) => (locale === 'en' ? enMessages : esMessages)),
  loadRelativeTimeFormatLocaleData: jest.fn(),
}));

describe('Index Tests', () => {
  afterAll(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should get locale messages by calling setupLocale', async () => {
    let result = await setupLocale('en');
    const { currentLocaleMessages: clm, enLocaleMessages: elm } = result;
    expect(clm).toBeDefined();
    expect(elm).toBeDefined();
    expect(clm.troubleStarting).toStrictEqual(enMessages.troubleStarting);

    expect(clm.restartMetamask).toStrictEqual(enMessages.restartMetamask);

    expect(clm.stillGettingMessage).toStrictEqual(
      enMessages.stillGettingMessage,
    );

    expect(clm.sendBugReport).toStrictEqual(enMessages.sendBugReport);

    result = await setupLocale('es');

    const { currentLocaleMessages: clm2, enLocaleMessages: elm2 } = result;
    expect(clm2).toBeDefined();
    expect(elm2).toBeDefined();

    expect(clm2.troubleStarting).toStrictEqual(esMessages.troubleStarting);

    expect(clm2.restartMetamask).toStrictEqual(esMessages.restartMetamask);

    expect(clm2.stillGettingMessage).toBeUndefined();
    expect(elm2.stillGettingMessage).toStrictEqual(
      enMessages.stillGettingMessage,
    );

    expect(clm2.sendBugReport).toStrictEqual(esMessages.sendBugReport);
  });

  it('should get clean app state with socialLoginEmail undefined', async () => {
    const mockVersion = '1.0.0';
    const mockUserAgent = 'test-user-agent';

    jest.spyOn(global.platform, 'getVersion').mockReturnValue(mockVersion);
    jest
      .spyOn(window.navigator, 'userAgent', 'get')
      .mockReturnValue(mockUserAgent);

    const mockState = {
      metamask: {
        currentLocale: 'en',
        completedOnboarding: true,
        socialLoginEmail: 'test@test.com',
      },
    };
    const store = configureMockStore([thunk])({
      ...mockState,
    });

    const cleanAppState = await getCleanAppState(store);
    expect(cleanAppState).toStrictEqual({
      metamask: {
        ...mockState.metamask,
        socialLoginEmail: undefined,
      },
      version: mockVersion,
      browser: mockUserAgent,
    });
  });
});
