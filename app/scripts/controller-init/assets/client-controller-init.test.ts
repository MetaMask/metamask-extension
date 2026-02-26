import { ClientController } from '@metamask/client-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { getRootMessenger } from '../../lib/messenger';
import { getClientControllerMessenger } from '../messengers/assets';
import { ClientControllerInit } from './client-controller-init';

describe('ClientControllerInit', () => {
  it('returns a ClientController instance', () => {
    const baseMessenger = getRootMessenger<never, never>();
    const request = {
      ...buildControllerInitRequestMock(),
      controllerMessenger: getClientControllerMessenger(baseMessenger),
      initMessenger: undefined,
      persistedState: {},
    };

    const result = ClientControllerInit(request);

    expect(result.controller).toBeInstanceOf(ClientController);
  });

  it('initializes with persisted state when provided', () => {
    const baseMessenger = getRootMessenger<never, never>();
    const request = {
      ...buildControllerInitRequestMock(),
      controllerMessenger: getClientControllerMessenger(baseMessenger),
      initMessenger: undefined,
      persistedState: {
        ClientController: { isUiOpen: true },
      },
    };

    const result = ClientControllerInit(request);

    expect(result.controller.state.isUiOpen).toBe(true);
  });
});
