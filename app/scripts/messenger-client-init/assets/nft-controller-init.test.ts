import {
  NftController,
  NftControllerMessenger,
} from '@metamask/assets-controllers';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getNftControllerInitMessenger,
  getNftControllerMessenger,
  NftControllerInitMessenger,
} from '../messengers/assets';
import { getRootMessenger } from '../../lib/messenger';
import { NftControllerInit } from './nft-controller-init';

jest.mock('@metamask/assets-controllers');

function buildInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<NftControllerMessenger, NftControllerInitMessenger>
> {
  const baseControllerMessenger = getRootMessenger<never, never>();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNftControllerMessenger(baseControllerMessenger),
    initMessenger: getNftControllerInitMessenger(baseControllerMessenger),
  };
}

describe('NftControllerInit', () => {
  const nftControllerClassMock = jest.mocked(NftController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(NftControllerInit(requestMock).messengerClient).toBeInstanceOf(
      NftController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    NftControllerInit(requestMock);

    expect(nftControllerClassMock).toHaveBeenCalled();
  });
});
