import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import { SUPPORT_LINK } from '../constants/common';
import { getErrorHtml } from './error-utils';

const defaultState = {
  localeMessages: {
    current: {
      troubleStarting: {
        message:
          'MetaMask had trouble starting. This error could be intermittent, so try restarting the extension.',
      },
      restartMetamask: {
        message: 'Restart Metamask',
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

const middleware = [thunk];
const mockStore = (state = defaultState) => configureStore(middleware)(state);

jest.mock('../..', () => ({
  setupLocale: jest.fn(() => {
    const { localeMessages } = defaultState;
    return {
      currentLocaleMessages: localeMessages.current,
      enLocaleMessages: localeMessages.current,
    };
  }),
}));

describe('Error utils Tests', () => {
  it('should get error html', async () => {
    const store = mockStore();
    const errorHtml = await getErrorHtml(
      SUPPORT_LINK,
      store.getState().metamask,
    );
    const currentLocale = store.getState().localeMessages.current;
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
});
