import { Messenger } from '@metamask/base-controller';
import { SnapInsightsController } from '@metamask/snaps-controllers';

import type { SnapInsightsControllerMessenger } from '../messengers/snaps';
import { getSnapInsightsControllerMessenger } from '../messengers/snaps';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
import { SnapInsightsControllerInit } from './snap-insights-controller-init';

jest.mock('@metamask/snaps-controllers');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SnapInsightsControllerMessenger>
> {
  const baseMessenger = new Messenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapInsightsControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('SnapInsightsControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = SnapInsightsControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(SnapInsightsController);
  });

  it('passes the proper arguments to the controller', () => {
    SnapInsightsControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(SnapInsightsController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
    });
  });
});
