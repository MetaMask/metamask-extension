import { Messenger } from '@metamask/base-controller';
import { PreferencesController } from '../controllers/preferences-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getPreferencesControllerMessenger,
  PreferencesControllerMessenger,
} from './messengers';
import { PreferencesControllerInit } from './preferences-controller-init';

jest.mock('../controllers/preferences-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<PreferencesControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

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
    const { controller } = PreferencesControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(PreferencesController);
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
