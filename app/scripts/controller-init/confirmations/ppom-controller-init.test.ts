import {
  PPOMController,
  PPOMControllerMessenger,
} from '@metamask/ppom-validator';
import { ControllerMessenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock, CHAIN_ID_MOCK } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getPPOMControllerInitMessenger,
  getPPOMControllerMessenger,
  PPOMControllerInitMessenger,
} from '../messengers/ppom-controller-messenger';
import { PPOMControllerInit } from './ppom-controller-init';

type PPOMControllerOptions = ConstructorParameters<typeof PPOMController>[0];

jest.mock('@metamask/ppom-validator');

function buildControllerMock(options?: Record<string, unknown>) {
  return {
    state: { securityAlertsEnabled: true },
    ...options,
  } as unknown as PPOMController;
}

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<PPOMControllerMessenger, PPOMControllerInitMessenger>
> {
  const baseControllerMessenger = new ControllerMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getPPOMControllerMessenger(baseControllerMessenger),
    initMessenger: getPPOMControllerInitMessenger(baseControllerMessenger),
  };

  requestMock.getController.mockReturnValue(buildControllerMock());

  return requestMock;
}

describe('PPOM Controller Init', () => {
  const ppomControllerClassMock = jest.mocked(PPOMController);

  /**
   * Extract a constructor option passed to the controller.
   *
   * @param option - The option to extract.
   * @param controllerOptions - Any other controller options to initialize the controller with.
   * @returns The extracted option.
   */
  function testConstructorOption<T extends keyof PPOMControllerOptions>(
    option: T,
    controllerOptions?: Record<string, unknown>,
  ): PPOMControllerOptions[T] {
    const requestMock = buildInitRequestMock();

    requestMock.getController.mockReturnValue(
      buildControllerMock(controllerOptions),
    );

    PPOMControllerInit(requestMock);

    return ppomControllerClassMock.mock.calls[0][0][option];
  }

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(PPOMControllerInit(requestMock).controller).toBeInstanceOf(
      PPOMController,
    );
  });

  it('determines if security alerts enabled using preference', () => {
    const securityAlertsEnabled = testConstructorOption(
      'securityAlertsEnabled',
      { state: { securityAlertsEnabled: true } },
    );

    expect(securityAlertsEnabled).toBe(true);
  });

  it('sets chain ID to global chain ID', () => {
    const chainId = testConstructorOption('chainId');
    expect(chainId).toBe(CHAIN_ID_MOCK);
  });
});
