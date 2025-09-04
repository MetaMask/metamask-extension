import { GatorPermissionsController } from '@metamask/gator-permissions-controller';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
import { isProduction } from '../../../../shared/modules/environment';
import {
  getGatorPermissionsControllerMessenger,
  GatorPermissionsControllerMessenger,
} from '../messengers/gator-permissions';
import {
  GatorPermissionsControllerInit,
  LOCAL_GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
} from './gator-permissions-controller-init';

jest.mock('@metamask/gator-permissions-controller');
jest.mock('../../../../shared/modules/environment');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<GatorPermissionsControllerMessenger>
> {
  const baseControllerMessenger = new Messenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getGatorPermissionsControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('GatorPermissionsControllerInit', () => {
  const GatorPermissionsControllerClassMock = jest.mocked(
    GatorPermissionsController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(isProduction).mockReturnValue(true);
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      GatorPermissionsControllerInit(requestMock).controller,
    ).toBeInstanceOf(GatorPermissionsController);
  });

  it('initializes with correct messenger and state(production)', () => {
    const requestMock = buildInitRequestMock();
    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: {
        isGatorPermissionsEnabled: false,
        isFetchingGatorPermissions: false,
        ...requestMock.persistedState.GatorPermissionsController,
      },
    });
  });

  it('initializes with correct messenger and state(development)', () => {
    const requestMock = buildInitRequestMock();
    jest.mocked(isProduction).mockReturnValue(false);
    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: {
        isGatorPermissionsEnabled: false,
        isFetchingGatorPermissions: false,
        gatorPermissionsProviderSnapId:
          LOCAL_GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
        ...requestMock.persistedState.GatorPermissionsController,
      },
    });
  });

  it('returns correct API methods', () => {
    const requestMock = buildInitRequestMock();
    const result = GatorPermissionsControllerInit(requestMock);

    expect(result.api).toEqual({
      enableGatorPermissions: expect.any(Function),
      disableGatorPermissions: expect.any(Function),
      fetchAndUpdateGatorPermissions: expect.any(Function),
    });
  });

  it('handles undefined persistedState.GatorPermissionsController in production', () => {
    const requestMock = buildInitRequestMock();
    requestMock.persistedState.GatorPermissionsController = undefined;
    jest.mocked(isProduction).mockReturnValue(true);

    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: {
        isGatorPermissionsEnabled: false,
        isFetchingGatorPermissions: false,
      },
    });
  });

  it('handles undefined persistedState.GatorPermissionsController in development', () => {
    const requestMock = buildInitRequestMock();
    requestMock.persistedState.GatorPermissionsController = undefined;
    jest.mocked(isProduction).mockReturnValue(false);

    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: {
        isGatorPermissionsEnabled: false,
        isFetchingGatorPermissions: false,
        gatorPermissionsProviderSnapId:
          LOCAL_GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
      },
    });
  });
});
