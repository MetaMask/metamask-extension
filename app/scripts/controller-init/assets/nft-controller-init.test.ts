import {
  NftController,
  NftControllerMessenger,
} from '@metamask/assets-controllers';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getNftControllerInitMessenger,
  getNftControllerMessenger,
  NftControllerInitMessenger,
} from '../messengers/assets';
import { NftControllerInit } from './nft-controller-init';

jest.mock('@metamask/assets-controllers');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<NftControllerMessenger, NftControllerInitMessenger>
> {
  const baseControllerMessenger = new Messenger();

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
    expect(NftControllerInit(requestMock).controller).toBeInstanceOf(
      NftController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    NftControllerInit(requestMock);

    expect(nftControllerClassMock).toHaveBeenCalled();
  });
});
