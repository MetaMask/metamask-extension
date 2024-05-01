import { getSnapAndHardwareInfoForMetrics } from './metrics';

describe('getSnapAndHardwareInfoForMetrics', () => {
  let getAccountType: jest.Mock;
  let getDeviceModel: jest.Mock;
  let messenger: any;

  beforeEach(() => {
    getAccountType = jest.fn();
    getDeviceModel = jest.fn();
    messenger = {
      call: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty object if no messenger is provided', async () => {
    const result = await getSnapAndHardwareInfoForMetrics(
      getAccountType,
      getDeviceModel,
      // @ts-expect-error - We're testing the case where messenger is null
      null,
    );
    expect(result).toEqual({});
  });

  it('should call the appropriate functions with the correct arguments', async () => {
    getAccountType.mockResolvedValue('accountType');
    getDeviceModel.mockResolvedValue('deviceModel');
    messenger.call
      .mockReturnValueOnce({
        address: '0x123',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          name: 'Account 1',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        methods: [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
      })
      .mockResolvedValueOnce({ id: 'snapId', version: 'snapVersion' });

    const result = await getSnapAndHardwareInfoForMetrics(
      getAccountType,
      getDeviceModel,
      messenger,
    );

    expect(getAccountType).toHaveBeenCalledWith('0x123');
    expect(getDeviceModel).toHaveBeenCalledWith('0x123');
    expect(messenger.call).toHaveBeenNthCalledWith(
      1,
      'AccountsController:getSelectedAccount',
    );
    expect(result).toEqual({
      account_type: 'accountType',
      device_model: 'deviceModel',
      account_hardware_type: undefined,
      account_snap_type: undefined,
      account_snap_version: undefined,
    });
  });

  it('should call the appropriate functions with the correct arguments the account is a snap account', async () => {
    getAccountType.mockResolvedValue('accountType');
    getDeviceModel.mockResolvedValue('deviceModel');
    messenger.call
      .mockReturnValueOnce({
        address: '0x123',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          name: 'Account 1',
          keyring: {
            type: 'Snap Keyring',
          },
          snap: {
            id: 'snapId',
            name: 'mock-name',
            enabled: true,
          },
        },
        options: {},
        methods: [
          'personal_sign',
          'eth_sign',
          'eth_signTransaction',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4',
        ],
        type: 'eip155:eoa',
      })
      .mockReturnValueOnce({ id: 'snapId', version: 'snapVersion' });

    const result = await getSnapAndHardwareInfoForMetrics(
      getAccountType,
      getDeviceModel,
      messenger,
    );

    expect(getAccountType).toHaveBeenCalledWith('0x123');
    expect(getDeviceModel).toHaveBeenCalledWith('0x123');
    expect(messenger.call).toHaveBeenNthCalledWith(
      1,
      'AccountsController:getSelectedAccount',
    );
    expect(messenger.call).toHaveBeenNthCalledWith(
      2,
      'SnapController:get',
      'snapId',
    );
    expect(result).toEqual({
      account_type: 'accountType',
      device_model: 'deviceModel',
      account_hardware_type: undefined,
      account_snap_type: 'snapId',
      account_snap_version: 'snapVersion',
    });
  });
});
