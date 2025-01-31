import { SnapInsightsController } from '@metamask/snaps-controllers';
import { ControllerMessenger } from '@metamask/base-controller';
import { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  getSnapInsightsControllerMessenger,
  SnapInsightsControllerMessenger,
} from './snap-insights-controller-messenger';
import { SnapInsightsControllerInit } from './snap-insights-controller-init';

jest.mock('@metamask/snaps-controllers');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<SnapInsightsControllerMessenger>
> {
  const baseControllerMessenger = new ControllerMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getSnapInsightsControllerMessenger(
      baseControllerMessenger,
    ),
  };

  return requestMock;
}

describe('SnapControllerInit', () => {
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
