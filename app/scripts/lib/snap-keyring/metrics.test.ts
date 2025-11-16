import { getSnapAndHardwareInfoForMetrics } from './metrics';

describe('getSnapAndHardwareInfoForMetrics', () => {
  let getAccountType: jest.Mock;
  let getDeviceModel: jest.Mock;
  let getHardwareTypeForMetric: jest.Mock;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let messenger: any;

  beforeEach(() => {
    getAccountType = jest.fn();
    getDeviceModel = jest.fn();
    getHardwareTypeForMetric = jest.fn();
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
      getHardwareTypeForMetric,
      // @ts-expect-error - We're testing the case where messenger is null
      null,
    );
    expect(result).toEqual({});
  });

  describe('when the wallet is unlocked', () => {
    it('resolves keyring and device info for a HD account', async () => {
      getAccountType.mockResolvedValue('accountType');
      getDeviceModel.mockResolvedValue('deviceModel');
      getHardwareTypeForMetric.mockResolvedValue('hardwareType');
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
            'eth_signTransaction',
            'eth_signTypedData_v1',
            'eth_signTypedData_v3',
            'eth_signTypedData_v4',
          ],
          type: 'eip155:eoa',
        })
        .mockReturnValueOnce({ isUnlocked: true });

      const result = await getSnapAndHardwareInfoForMetrics(
        getAccountType,
        getDeviceModel,
        getHardwareTypeForMetric,
        messenger,
      );

      expect(getAccountType).toHaveBeenCalledWith('0x123');
      expect(getDeviceModel).toHaveBeenCalledWith('0x123');
      expect(getHardwareTypeForMetric).toHaveBeenCalledWith('0x123');
      expect(messenger.call).toHaveBeenNthCalledWith(
        1,
        'AccountsController:getSelectedAccount',
      );
      expect(messenger.call).toHaveBeenNthCalledWith(
        2,
        'KeyringController:getState',
      );
      expect(result).toEqual({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: 'accountType',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        device_model: 'deviceModel',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_hardware_type: 'hardwareType',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_snap_type: undefined,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_snap_version: undefined,
      });
    });

    it('resolves keyring, device, and snap info for a snap account', async () => {
      getAccountType.mockResolvedValue('accountType');
      getDeviceModel.mockResolvedValue('deviceModel');
      getHardwareTypeForMetric.mockResolvedValue('hardwareType');
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
            'eth_signTransaction',
            'eth_signTypedData_v1',
            'eth_signTypedData_v3',
            'eth_signTypedData_v4',
          ],
          type: 'eip155:eoa',
        })
        .mockReturnValueOnce({ id: 'snapId', version: 'snapVersion' })
        .mockReturnValueOnce({ isUnlocked: true });

      const result = await getSnapAndHardwareInfoForMetrics(
        getAccountType,
        getDeviceModel,
        getHardwareTypeForMetric,
        messenger,
      );

      expect(getAccountType).toHaveBeenCalledWith('0x123');
      expect(getDeviceModel).toHaveBeenCalledWith('0x123');
      expect(getHardwareTypeForMetric).toHaveBeenCalledWith('0x123');
      expect(messenger.call).toHaveBeenNthCalledWith(
        1,
        'AccountsController:getSelectedAccount',
      );
      expect(messenger.call).toHaveBeenNthCalledWith(
        2,
        'SnapController:get',
        'snapId',
      );
      expect(messenger.call).toHaveBeenNthCalledWith(
        3,
        'KeyringController:getState',
      );
      expect(result).toEqual({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: 'accountType',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        device_model: 'deviceModel',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_hardware_type: 'hardwareType',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_snap_type: 'snapId',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_snap_version: 'snapVersion',
      });
    });
  });

  describe('when the wallet is locked', () => {
    it('does not resolve keyring and device info for a HD account', async () => {
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
            'eth_signTransaction',
            'eth_signTypedData_v1',
            'eth_signTypedData_v3',
            'eth_signTypedData_v4',
          ],
          type: 'eip155:eoa',
        })
        .mockReturnValueOnce({ isUnlocked: false });

      const result = await getSnapAndHardwareInfoForMetrics(
        getAccountType,
        getDeviceModel,
        getHardwareTypeForMetric,
        messenger,
      );

      expect(getAccountType).not.toHaveBeenCalled();
      expect(getDeviceModel).not.toHaveBeenCalled();
      expect(getHardwareTypeForMetric).not.toHaveBeenCalled();
      expect(messenger.call).toHaveBeenNthCalledWith(
        1,
        'AccountsController:getSelectedAccount',
      );
      expect(messenger.call).toHaveBeenNthCalledWith(
        2,
        'KeyringController:getState',
      );
      expect(result).toEqual({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_snap_type: undefined,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_snap_version: undefined,
      });
    });

    it('resolves only snap info for a snap account', async () => {
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
            'eth_signTransaction',
            'eth_signTypedData_v1',
            'eth_signTypedData_v3',
            'eth_signTypedData_v4',
          ],
          type: 'eip155:eoa',
        })
        .mockReturnValueOnce({ id: 'snapId', version: 'snapVersion' })
        .mockReturnValueOnce({ isUnlocked: false });

      const result = await getSnapAndHardwareInfoForMetrics(
        getAccountType,
        getDeviceModel,
        getHardwareTypeForMetric,
        messenger,
      );

      expect(getAccountType).not.toHaveBeenCalled();
      expect(getDeviceModel).not.toHaveBeenCalled();
      expect(getHardwareTypeForMetric).not.toHaveBeenCalled();
      expect(messenger.call).toHaveBeenNthCalledWith(
        1,
        'AccountsController:getSelectedAccount',
      );
      expect(messenger.call).toHaveBeenNthCalledWith(
        2,
        'SnapController:get',
        'snapId',
      );
      expect(messenger.call).toHaveBeenNthCalledWith(
        3,
        'KeyringController:getState',
      );
      expect(result).toEqual({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_snap_type: 'snapId',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_snap_version: 'snapVersion',
      });
    });
  });
});
