import {
  NftDetectionController,
  NftDetectionControllerMessenger,
} from '@metamask/assets-controllers';
import { PreferencesController } from '@metamask/preferences-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import { getNftDetectionControllerMessenger } from '../messengers/assets';
import { getRootMessenger } from '../../lib/messenger';
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
  MessengerClientInitRequest<NftDetectionControllerMessenger>
> {
  const baseControllerMessenger = getRootMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNftDetectionControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
  // @ts-expect-error Incomplete mock, just includes properties used by code-under-test.
  requestMock.getMessengerClient.mockReturnValue(buildControllerMock());

  return requestMock;
}

describe('NftDetectionControllerInit', () => {
  const nftDetectionControllerClassMock = jest.mocked(NftDetectionController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      NftDetectionControllerInit(requestMock).messengerClient,
    ).toBeInstanceOf(NftDetectionController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    NftDetectionControllerInit(requestMock);

    expect(nftDetectionControllerClassMock).toHaveBeenCalled();
  });

  it('passes the NftController methods to the controller', () => {
    const requestMock = buildInitRequestMock();
    NftDetectionControllerInit(requestMock);

    expect(nftDetectionControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        addNfts: expect.any(Function),
        removeNft: expect.any(Function),
      }),
    );
  });

  it('delegates removeNft to the NftController', () => {
    const removeNft = jest.fn();
    const requestMock = buildInitRequestMock();
    requestMock.getMessengerClient.mockReturnValue({
      ...buildControllerMock(),
      removeNft,
    } as never);
    NftDetectionControllerInit(requestMock);

    const { removeNft: passedRemoveNft } =
      nftDetectionControllerClassMock.mock.calls[0][0];
    passedRemoveNft('0xabc', '1', 'mainnet', { userAddress: '0x1' });

    expect(removeNft).toHaveBeenCalledWith('0xabc', '1', 'mainnet', {
      userAddress: '0x1',
    });
  });
});
