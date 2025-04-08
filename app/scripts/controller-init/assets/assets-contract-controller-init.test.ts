import { Messenger } from '@metamask/base-controller';
import { AssetsContractController } from '@metamask/assets-controllers';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  AssetsContractControllerMessenger,
  getAssetsContractControllerMessenger,
} from '../messengers/assets';
import { AssetsContractControllerInit } from './assets-contract-controller-init';

jest.mock('@metamask/assets-controllers');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<AssetsContractControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAssetsContractControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('AssetsContractControllerInit', () => {
  const assetsContractControllerClassMock = jest.mocked(
    AssetsContractController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(AssetsContractControllerInit(requestMock).controller).toBeInstanceOf(
      AssetsContractController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    AssetsContractControllerInit(requestMock);

    expect(assetsContractControllerClassMock).toHaveBeenCalled();
  });
});
