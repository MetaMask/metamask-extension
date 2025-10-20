import {
  TokenRatesController,
  TokenRatesControllerMessenger,
} from '@metamask/assets-controllers';
import { ActionConstraint, Messenger } from '@metamask/base-controller';
import { PreferencesController } from '@metamask/preferences-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getTokenRatesControllerInitMessenger,
  getTokenRatesControllerMessenger,
  TokenRatesControllerInitMessenger,
} from '../messengers/assets';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { TokenRatesControllerInit } from './token-rates-controller-init';

jest.mock('@metamask/assets-controllers');

/**
 * Build a mock PreferencesController.
 * This returns a partial mock that includes the state property expected by the TokenRatesController (for example, `useCurrencyRateCheck`).
 *
 * @param {Partial<PreferencesController>} partialMock - The partial mock to be merged with the default mock.
 * @returns {PreferencesController} The mock PreferencesController.
 */

function buildControllerMock(
  partialMock?: Partial<PreferencesController>,
): PreferencesController {
  const defaultPreferencesControllerMock = {
    state: { useCurrencyRateCheck: true },
  };

  // @ts-expect-error Incomplete mock, just includes properties used by code-under-test.
  return {
    ...defaultPreferencesControllerMock,
    ...partialMock,
  };
}

/**
 * Build a mock init request.
 *
 * Notice that we also mock the getController method to return the
 * stubbed PreferencesController.
 */
function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    TokenRatesControllerMessenger,
    TokenRatesControllerInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger<
    PreferencesControllerGetStateAction | ActionConstraint,
    never
  >();

  baseControllerMessenger.registerActionHandler(
    'PreferencesController:getState',
    jest.fn().mockReturnValue({ useCurrencyRateCheck: true }),
  );

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTokenRatesControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getTokenRatesControllerInitMessenger(
      baseControllerMessenger,
    ),
  };

  // @ts-expect-error Incomplete mock, just includes properties used by code-under-test.
  requestMock.getController.mockReturnValue(buildControllerMock());

  return requestMock;
}

describe('TokenRatesControllerInit', () => {
  const tokenRatesControllerClassMock = jest.mocked(TokenRatesController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(TokenRatesControllerInit(requestMock).controller).toBeInstanceOf(
      TokenRatesController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    TokenRatesControllerInit(requestMock);

    expect(tokenRatesControllerClassMock).toHaveBeenCalled();
  });
});
