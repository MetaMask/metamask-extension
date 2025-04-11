import type { NftControllerMessenger } from '@metamask/assets-controllers';
import { NftController } from '@metamask/assets-controllers';
import { Messenger } from '@metamask/base-controller';

import { getNftControllerMessenger } from '../messengers/assets';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
import { NftControllerInit } from './nft-controller-init';

jest.mock('@metamask/assets-controllers');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<NftControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNftControllerMessenger(baseControllerMessenger),
    initMessenger: undefined,
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
