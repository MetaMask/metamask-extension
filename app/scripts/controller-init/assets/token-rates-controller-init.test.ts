import {
  TokenRatesController,
  TokenRatesControllerMessenger,
} from '@metamask/assets-controllers';
import { Messenger } from '@metamask/base-controller';
import { PreferencesController } from '@metamask/preferences-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import { getTokenRatesControllerMessenger } from '../messengers/assets';
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
  ControllerInitRequest<TokenRatesControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTokenRatesControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
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
