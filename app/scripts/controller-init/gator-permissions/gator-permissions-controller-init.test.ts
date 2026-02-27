import {
  GatorPermissionsController,
  SupportedPermissionType,
} from '@metamask/gator-permissions-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
import { getEnabledAdvancedPermissions } from '../../../../shared/modules/environment';
import {
  getGatorPermissionsControllerMessenger,
  GatorPermissionsControllerMessenger,
} from '../messengers/gator-permissions';
import { getRootMessenger } from '../../lib/messenger';
import { GatorPermissionsControllerInit } from './gator-permissions-controller-init';

jest.mock('@metamask/gator-permissions-controller');
jest.mock('../../../../shared/modules/environment');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<GatorPermissionsControllerMessenger>
> {
  const baseControllerMessenger = getRootMessenger();

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getGatorPermissionsControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
  };
}

describe('GatorPermissionsControllerInit', () => {
  const MOCK_GATOR_PERMISSIONS_PROVIDER_SNAP_ID = 'npm:mock-snap-id';
  const GatorPermissionsControllerClassMock = jest.mocked(
    GatorPermissionsController,
  );
  const originalGatorPermissionProviderSnapId =
    process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID;

  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .mocked(getEnabledAdvancedPermissions)
      .mockReturnValue(['native-token-stream']);
    process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID =
      MOCK_GATOR_PERMISSIONS_PROVIDER_SNAP_ID;
  });

  afterEach(() => {
    if (originalGatorPermissionProviderSnapId) {
      process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID =
        originalGatorPermissionProviderSnapId;
    } else {
      delete process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID;
    }
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      GatorPermissionsControllerInit(requestMock).controller,
    ).toBeInstanceOf(GatorPermissionsController);
  });

  it('initializes with correct messenger, config, and state (gator permissions feature enabled)', () => {
    const requestMock = buildInitRequestMock();
    const supportedTypes: SupportedPermissionType[] = ['native-token-stream'];
    jest.mocked(getEnabledAdvancedPermissions).mockReturnValue(supportedTypes);
    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      config: {
        supportedPermissionTypes: supportedTypes,
        gatorPermissionsProviderSnapId: MOCK_GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
      },
      state: requestMock.persistedState.GatorPermissionsController,
    });
  });

  it('initializes with correct messenger, config, and state (gator permissions feature disabled)', () => {
    const requestMock = buildInitRequestMock();
    jest.mocked(getEnabledAdvancedPermissions).mockReturnValue([]);
    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      config: {
        supportedPermissionTypes: [],
        gatorPermissionsProviderSnapId: MOCK_GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
      },
      state: requestMock.persistedState.GatorPermissionsController,
    });
  });

  it('passes supportedPermissionTypes from getEnabledAdvancedPermissions to config', () => {
    const requestMock = buildInitRequestMock();
    const supportedTypes: SupportedPermissionType[] = [
      'native-token-stream',
      'erc20-token-stream',
      'native-token-periodic',
    ];
    jest.mocked(getEnabledAdvancedPermissions).mockReturnValue(supportedTypes);
    GatorPermissionsControllerInit(requestMock);

    const { config } = GatorPermissionsControllerClassMock.mock.calls[0][0];
    expect(config.supportedPermissionTypes).toEqual(supportedTypes);
  });

  it('returns correct API methods', () => {
    const requestMock = buildInitRequestMock();
    const result = GatorPermissionsControllerInit(requestMock);

    expect(result.api).toEqual({
      fetchAndUpdateGatorPermissions: expect.any(Function),
      addPendingRevocation: expect.any(Function),
      submitDirectRevocation: expect.any(Function),
    });
  });

  it('handles undefined persistedState.GatorPermissionsController', () => {
    const requestMock = buildInitRequestMock();
    requestMock.persistedState.GatorPermissionsController = undefined;
    jest
      .mocked(getEnabledAdvancedPermissions)
      .mockReturnValue(['native-token-stream']);

    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      config: {
        supportedPermissionTypes: ['native-token-stream'],
        gatorPermissionsProviderSnapId: MOCK_GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
      },
      state: undefined,
    });
  });

  it('resolves the default when GATOR_PERMISSIONS_PROVIDER_SNAP_ID is not specified', () => {
    const requestMock = buildInitRequestMock();

    delete process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID;

    GatorPermissionsControllerInit(requestMock);

    const calledWith = GatorPermissionsControllerClassMock.mock.calls[0][0];
    const { config } = calledWith;

    expect(calledWith.messenger).toBe(requestMock.controllerMessenger);
    expect(config.supportedPermissionTypes).toEqual(['native-token-stream']);

    // GatorPermissionsController requires that the key does not exist if the snap id is not specified
    expect(
      Object.prototype.hasOwnProperty.call(
        config,
        'gatorPermissionsProviderSnapId',
      ),
    ).toBe(false);
  });

  it('passes persisted state to controller', () => {
    const requestMock = buildInitRequestMock();
    const persistedState = {
      grantedPermissions: [],
      isFetchingGatorPermissions: false,
      pendingRevocations: [],
      lastSyncedTimestamp: -1,
    };
    requestMock.persistedState.GatorPermissionsController = persistedState;

    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      config: expect.objectContaining({
        supportedPermissionTypes: ['native-token-stream'],
        gatorPermissionsProviderSnapId: MOCK_GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
      }),
      state: persistedState,
    });
  });

  describe('GATOR_PERMISSIONS_PROVIDER_SNAP_ID incorrectly specified', () => {
    ['', '   ', 'invalid-snap-id'].forEach((invalidSnapId) => {
      it(`throws when provided invalid GATOR_PERMISSIONS_PROVIDER_SNAP_ID: ${invalidSnapId}`, () => {
        const requestMock = buildInitRequestMock();

        process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID =
          invalidSnapId as string;

        expect(() => GatorPermissionsControllerInit(requestMock)).toThrow(
          'GATOR_PERMISSIONS_PROVIDER_SNAP_ID must be set to a valid snap id',
        );

        expect(GatorPermissionsControllerClassMock).not.toHaveBeenCalled();
      });
    });
  });
});
