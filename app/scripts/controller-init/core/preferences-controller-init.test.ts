import { Messenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getPreferencesControllerMessenger,
  PreferencesControllerMessenger,
} from '../messengers/core';
import { PreferencesController } from '../../controllers/preferences-controller';
import { PreferencesControllerInit } from './preferences-controller-init';

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
    expect(controller.state).toStrictEqual(
      expect.objectContaining({
        currentLocale: 'en-US',
      }),
    );
  });
});
