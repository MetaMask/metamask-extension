import {
  SnapInsightsController,
  SnapInsightsControllerMessenger,
} from '@metamask/snaps-controllers';
import { MessengerClientInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { getSnapInsightsControllerMessenger } from '../messengers/snaps';
import { getRootMessenger } from '../../lib/messenger';
import { SnapInsightsControllerInit } from './snap-insights-controller-init';

jest.mock('@metamask/snaps-controllers');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<SnapInsightsControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapInsightsControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('SnapInsightsControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } =
      SnapInsightsControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(SnapInsightsController);
  });

  it('passes the proper arguments to the controller', () => {
    SnapInsightsControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SnapInsightsController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
    });
  });
});
