import { getSnapAndHardwareInfoForMetrics } from './metrics';

describe('getSnapAndHardwareInfoForMetrics', () => {
  let getSelectedAddress: jest.Mock;
  let getAccountType: jest.Mock;
  let getDeviceModel: jest.Mock;
  let messenger;

  beforeEach(() => {
    getSelectedAddress = jest.fn();
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
      getSelectedAddress,
      getAccountType,
      getDeviceModel,
      // @ts-expect-error - We're testing the case where messenger is null
      null,
    );
    expect(result).toEqual({});
  });

  it('should call the appropriate functions with the correct arguments when the keyring exposes the listAccounts method', async () => {
    getSelectedAddress.mockReturnValue('0x123');
    getAccountType.mockResolvedValue('accountType');
    getDeviceModel.mockResolvedValue('deviceModel');
    messenger.call
      .mockResolvedValueOnce({
        listAccounts: () => [
          { address: '0x123', metadata: { snap: { id: 'snapId' } } },
        ],
      })
      .mockResolvedValueOnce({ id: 'snapId', version: 'snapVersion' });

    const result = await getSnapAndHardwareInfoForMetrics(
      getSelectedAddress,
      getAccountType,
      getDeviceModel,
      messenger,
    );

    expect(getSelectedAddress).toHaveBeenCalled();
    expect(getAccountType).toHaveBeenCalledWith('0x123');
    expect(getDeviceModel).toHaveBeenCalledWith('0x123');
    expect(messenger.call).toHaveBeenCalledWith(
      'KeyringController:getKeyringForAccount',
      '0x123',
    );
    expect(messenger.call).toHaveBeenCalledWith('SnapController:get', 'snapId');
    expect(result).toEqual({
      account_type: 'accountType',
      device_model: 'deviceModel',
      account_hardware_type: undefined,
      account_snap_type: 'snapId',
      account_snap_version: 'snapVersion',
    });
  });

  it('should call the appropriate functions with the correct arguments when the keyring does not have the listAccounts method', async () => {
    getSelectedAddress.mockReturnValue('0x123');
    getAccountType.mockResolvedValue('accountType');
    getDeviceModel.mockResolvedValue('deviceModel');
    messenger.call
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ id: 'snapId', version: 'snapVersion' });

    const result = await getSnapAndHardwareInfoForMetrics(
      getSelectedAddress,
      getAccountType,
      getDeviceModel,
      messenger,
    );

    expect(getSelectedAddress).toHaveBeenCalled();
    expect(getAccountType).toHaveBeenCalledWith('0x123');
    expect(getDeviceModel).toHaveBeenCalledWith('0x123');
    expect(messenger.call).toHaveBeenCalledWith(
      'KeyringController:getKeyringForAccount',
      '0x123',
    );
    expect(messenger.call).toHaveBeenCalledWith(
      'SnapController:get',
      undefined,
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
