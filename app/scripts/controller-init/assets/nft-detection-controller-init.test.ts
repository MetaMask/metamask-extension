import {
  NftDetectionController,
  NftDetectionControllerMessenger,
} from '@metamask/assets-controllers';
import { Messenger } from '@metamask/base-controller';
import { PreferencesController } from '@metamask/preferences-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import { getNftDetectionControllerMessenger } from '../messengers/assets';
import { NftDetectionControllerInit } from './nft-detection-controller-init';

jest.mock('@metamask/assets-controllers');

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
    state: { useNftDetection: true },
  };

  // @ts-expect-error Incomplete mock, just includes properties used by code-under-test.
  return {
    ...defaultPreferencesControllerMock,
    ...partialMock,
  };
}

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<NftDetectionControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNftDetectionControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
  // @ts-expect-error Incomplete mock, just includes properties used by code-under-test.
  requestMock.getController.mockReturnValue(buildControllerMock());

  return requestMock;
}

describe('NftDetectionControllerInit', () => {
  const nftDetectionControllerClassMock = jest.mocked(NftDetectionController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(NftDetectionControllerInit(requestMock).controller).toBeInstanceOf(
      NftDetectionController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    NftDetectionControllerInit(requestMock);

    expect(nftDetectionControllerClassMock).toHaveBeenCalled();
  });
});
