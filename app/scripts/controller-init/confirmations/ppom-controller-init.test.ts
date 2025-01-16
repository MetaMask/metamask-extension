import { PPOMController } from '@metamask/ppom-validator';
import { buildControllerInitRequestMock, CHAIN_ID_MOCK } from '../test/utils';
import { PPOMControllerInit } from './ppom-controller-init';

type PPOMControllerOptions = ConstructorParameters<typeof PPOMController>[0];

jest.mock('@metamask/ppom-validator');

function buildInitRequestMock() {
  const requestMock = buildControllerInitRequestMock();

  // @ts-expect-error Mocked subset of full state object
  requestMock.getController.mockReturnValue({
    state: { securityAlertsEnabled: true },
  });

  return requestMock;
}

describe('PPOM Controller Init', () => {
  const ppomControllerClassMock = jest.mocked(PPOMController);

  function testConstructorProperty<T extends keyof PPOMControllerOptions>(
    property: T,
    controllerProperties: Record<string, unknown> = {},
  ): PPOMControllerOptions[T] {
    const requestMock = buildInitRequestMock();

    // @ts-expect-error Mocked subset of full state object
    requestMock.getController.mockReturnValue({
      state: { securityAlertsEnabled: true },
      ...controllerProperties,
    });

    PPOMControllerInit(requestMock);

    return ppomControllerClassMock.mock.calls[0][0][property];
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
    const securityAlertsEnabled = testConstructorProperty(
      'securityAlertsEnabled',
      {
        state: { securityAlertsEnabled: true },
      },
    );

    expect(securityAlertsEnabled).toBe(true);
  });

  it('sets chain ID to global chain ID', () => {
    const chainId = testConstructorProperty('chainId');
    expect(chainId).toBe(CHAIN_ID_MOCK);
  });
});
