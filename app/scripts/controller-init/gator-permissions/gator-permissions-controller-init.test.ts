import { GatorPermissionsController } from '@metamask/gator-permissions-controller';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
import { isGatorPermissionsFeatureEnabled } from '../../../../shared/modules/environment';
import {
  getGatorPermissionsControllerMessenger,
  GatorPermissionsControllerMessenger,
} from '../messengers/gator-permissions';
import { GatorPermissionsControllerInit } from './gator-permissions-controller-init';

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
  const MOCK_GATOR_PERMISSIONS_PROVIDER_SNAP_ID = 'local:http://localhost:8082';
  const GatorPermissionsControllerClassMock = jest.mocked(
    GatorPermissionsController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(isGatorPermissionsFeatureEnabled).mockReturnValue(true);
    process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID =
      MOCK_GATOR_PERMISSIONS_PROVIDER_SNAP_ID;
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      GatorPermissionsControllerInit(requestMock).controller,
    ).toBeInstanceOf(GatorPermissionsController);
  });

  it('initializes with correct messenger and state(gator permissions feature enabled)', () => {
    const requestMock = buildInitRequestMock();
    jest.mocked(isGatorPermissionsFeatureEnabled).mockReturnValue(true);
    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: {
        isGatorPermissionsEnabled: true,
        gatorPermissionsProviderSnapId: MOCK_GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
        ...requestMock.persistedState.GatorPermissionsController,
      },
    });
  });

  it('initializes with correct messenger and state(gator permissions feature disabled)', () => {
    const requestMock = buildInitRequestMock();
    jest.mocked(isGatorPermissionsFeatureEnabled).mockReturnValue(false);
    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: {
        isGatorPermissionsEnabled: false,
        gatorPermissionsProviderSnapId: MOCK_GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
        ...requestMock.persistedState.GatorPermissionsController,
      },
    });
  });

  it('returns correct API methods', () => {
    const requestMock = buildInitRequestMock();
    const result = GatorPermissionsControllerInit(requestMock);

    expect(result.api).toEqual({
      fetchAndUpdateGatorPermissions: expect.any(Function),
    });
  });

  it('handles undefined persistedState.GatorPermissionsController', () => {
    const requestMock = buildInitRequestMock();
    requestMock.persistedState.GatorPermissionsController = undefined;
    jest.mocked(isGatorPermissionsFeatureEnabled).mockReturnValue(true);

    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: {
        isGatorPermissionsEnabled: true,
        gatorPermissionsProviderSnapId: MOCK_GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
      },
    });
  });

  describe('GATOR_PERMISSIONS_PROVIDER_SNAP_ID being set to invalid format', () => {
    it('throws error for empty string GATOR_PERMISSIONS_PROVIDER_SNAP_ID', () => {
      const requestMock = buildInitRequestMock();
      process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID = '';
      jest.mocked(isGatorPermissionsFeatureEnabled).mockReturnValue(true);

      expect(() => GatorPermissionsControllerInit(requestMock)).toThrow(
        'Invalid snapId',
      );
    });

    it('throws error for undefined GATOR_PERMISSIONS_PROVIDER_SNAP_ID', () => {
      const requestMock = buildInitRequestMock();
      delete process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID;
      jest.mocked(isGatorPermissionsFeatureEnabled).mockReturnValue(true);

      expect(() => GatorPermissionsControllerInit(requestMock)).toThrow(
        'Invalid snapId',
      );
    });

    it('throws error for invalid GATOR_PERMISSIONS_PROVIDER_SNAP_ID format', () => {
      const requestMock = buildInitRequestMock();
      process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID = 'invalid-snap-id';
      jest.mocked(isGatorPermissionsFeatureEnabled).mockReturnValue(true);

      expect(() => GatorPermissionsControllerInit(requestMock)).toThrow(
        'Invalid snapId',
      );
    });

    it('throws error for whitespace-only GATOR_PERMISSIONS_PROVIDER_SNAP_ID', () => {
      const requestMock = buildInitRequestMock();
      process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID = '   ';
      jest.mocked(isGatorPermissionsFeatureEnabled).mockReturnValue(true);

      expect(() => GatorPermissionsControllerInit(requestMock)).toThrow(
        'Invalid snapId',
      );
    });
  });
});
