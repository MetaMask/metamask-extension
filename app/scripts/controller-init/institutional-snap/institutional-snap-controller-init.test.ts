import { Messenger } from '@metamask/base-controller';

import type { InstitutionalSnapControllerMessenger } from '../../controllers/institutional-snap/InstitutionalSnapController';
import { InstitutionalSnapController } from '../../controllers/institutional-snap/InstitutionalSnapController';
import { getInstitutionalSnapControllerMessenger } from '../messengers/accounts/institutional-snap-controller-messenger';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
import { InstitutionalSnapControllerInit } from './institutional-snap-controller-init';

jest.mock('../../controllers/institutional-snap/InstitutionalSnapController');

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
  const institutionalSnapControllerClassMock = jest.mocked(
    InstitutionalSnapController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      InstitutionalSnapControllerInit(requestMock).controller,
    ).toBeInstanceOf(InstitutionalSnapController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    InstitutionalSnapControllerInit(requestMock);

    expect(institutionalSnapControllerClassMock).toHaveBeenCalled();
  });
});
