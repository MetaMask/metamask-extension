import {
  PPOMController,
  PPOMControllerMessenger,
} from '@metamask/ppom-validator';
import { Messenger } from '@metamask/base-controller';
import { PreferencesController } from '../../controllers/preferences-controller';
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

/**
 * Build a mock PreferencesController.
 *
 * @param partialMock - A partial mock object for the PreferencesController, merged
 * with the default mock.
 * @returns A mock PreferencesController.
 */
function buildControllerMock(
  partialMock?: Partial<PreferencesController>,
): PreferencesController {
  const defaultPreferencesControllerMock = {
    state: { securityAlertsEnabled: true },
  };

  // @ts-expect-error Incomplete mock, just includes properties used by code-under-test.
  return {
    ...defaultPreferencesControllerMock,
    ...partialMock,
  };
}

function buildInitRequestMock(): jest.Mocked<
  // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
  ControllerInitRequest<PPOMControllerMessenger, PPOMControllerInitMessenger>
> {
  const baseControllerMessenger = new Messenger();

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
   * @param dependencyProperties - Any properties required on the controller dependencies.
   * @returns The extracted option.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  function testConstructorOption<T extends keyof PPOMControllerOptions>(
    option: T,
    dependencyProperties?: Record<string, unknown>,
  ): PPOMControllerOptions[T] {
    const requestMock = buildInitRequestMock();

    requestMock.getController.mockReturnValue(
      buildControllerMock(dependencyProperties),
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
