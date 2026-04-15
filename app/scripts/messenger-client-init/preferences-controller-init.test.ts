import {
  PreferencesController,
  PreferencesControllerMessenger,
} from '../controllers/preferences-controller';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getPreferencesControllerMessenger } from './messengers';
import { PreferencesControllerInit } from './preferences-controller-init';

jest.mock('../controllers/preferences-controller');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<PreferencesControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getPreferencesControllerMessenger(baseMessenger),
    initMessenger: undefined,
    initLangCode: 'en-US',
  };

  return requestMock;
}

describe('PreferencesControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = PreferencesControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(PreferencesController);
  });

  it('passes the proper arguments to the controller', () => {
    PreferencesControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(PreferencesController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: {
        currentLocale: 'en-US',
      },
    });
  });
});
