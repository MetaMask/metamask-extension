import { InstitutionalSnapController } from '../../lib/transaction/institutional-snap/InstitutionalSnapController';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import { InstitutionalSnapControllerInit } from './institutional-snap-controller-init';
import { InstitutionalSnapControllerMessenger } from '../../lib/transaction/institutional-snap/InstitutionalSnapController';
import { getInstitutionalSnapControllerMessenger } from '../messengers/accounts/institutional-snap-controller-messenger';

jest.mock('@metamask/institutional-snap-controllers');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<InstitutionalSnapControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getInstitutionalSnapControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('InstitutionalSnapControllerInit', () => {
  const institutionalSnapControllerClassMock = jest.mocked(InstitutionalSnapController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(InstitutionalSnapControllerInit(requestMock).controller).toBeInstanceOf(
      InstitutionalSnapController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    InstitutionalSnapControllerInit(requestMock);

    expect(institutionalSnapControllerClassMock).toHaveBeenCalled();
  });
});
