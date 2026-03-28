import { BridgeStatusController } from '@metamask/bridge-status-controller';
import { TransactionController } from '@metamask/transaction-controller';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { getRootMessenger } from '../lib/messenger';
import { ControllerInitRequest, ControllerName } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getBridgeStatusControllerMessenger,
  BridgeStatusControllerMessenger,
} from './messengers';
import { BridgeStatusControllerInit } from './bridge-status-controller-init';

jest.mock('@metamask/bridge-status-controller');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<BridgeStatusControllerMessenger>
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getBridgeStatusControllerMessenger(baseMessenger),
    initMessenger: undefined,
  };

  return requestMock;
}

describe('BridgeStatusControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = BridgeStatusControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(BridgeStatusController);
  });

  it('passes the proper arguments to the controller', () => {
    BridgeStatusControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(BridgeStatusController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      clientId: 'extension',
      state: undefined,
      config: {
        customBridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      },
      addTransactionFn: expect.any(Function),
      addTransactionBatchFn: expect.any(Function),
      updateTransactionFn: expect.any(Function),
      estimateGasFeeFn: expect.any(Function),
      fetchFn: expect.any(Function),
      traceFn: expect.any(Function),
    });
  });

  describe('addTransactionBatchFn wrapper', () => {
    function setupWithKeyring(keyringType: string, accounts: string[]) {
      const requestMock = getInitRequestMock();
      const mockAddTransactionBatch = jest.fn().mockResolvedValue({
        batchId: '0x1',
      });
      const accountsLower = accounts.map((a) => a.toLowerCase());
      const mockGetKeyringForAccount = jest
        .fn()
        .mockImplementation((addr: string) =>
          Promise.resolve(
            accountsLower.includes(addr?.toLowerCase())
              ? ({ type: keyringType } as { type: string })
              : undefined,
          ),
        );
      requestMock.getController.mockImplementation(((name: ControllerName) => {
        if (name === 'TransactionController') {
          return {
            addTransaction: jest.fn(),
            addTransactionBatch: mockAddTransactionBatch,
            estimateGasFee: jest.fn(),
            updateTransaction: jest.fn(),
          } as unknown as TransactionController;
        }
        if (name === 'KeyringController') {
          return { getKeyringForAccount: mockGetKeyringForAccount };
        }
        return undefined;
      }) as unknown as ControllerInitRequest<BridgeStatusControllerMessenger>['getController']);

      BridgeStatusControllerInit(requestMock);

      const controllerMock = jest.mocked(BridgeStatusController);
      const { addTransactionBatchFn } =
        controllerMock.mock.calls[controllerMock.mock.calls.length - 1][0];

      return { addTransactionBatchFn, mockAddTransactionBatch };
    }

    it('clears gas sponsorship flags for hardware wallet accounts', async () => {
      const { addTransactionBatchFn, mockAddTransactionBatch } =
        setupWithKeyring('Ledger Hardware', ['0xhardwareaccount']);

      await addTransactionBatchFn({
        from: '0xHardwareAccount',
        isGasFeeSponsored: true,
        isGasFeeIncluded: true,
        disable7702: false,
        networkClientId: 'test',
        transactions: [],
      });

      expect(mockAddTransactionBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          isGasFeeSponsored: false,
          isGasFeeIncluded: false,
          disable7702: true,
        }),
      );
    });

    it('preserves gas sponsorship flags for HD wallet accounts', async () => {
      const { addTransactionBatchFn, mockAddTransactionBatch } =
        setupWithKeyring('HD Key Tree', ['0xhdaccount']);

      await addTransactionBatchFn({
        from: '0xHDAccount',
        isGasFeeSponsored: true,
        isGasFeeIncluded: true,
        disable7702: false,
        networkClientId: 'test',
        transactions: [],
      });

      expect(mockAddTransactionBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          isGasFeeSponsored: true,
          isGasFeeIncluded: true,
          disable7702: false,
        }),
      );
    });
  });
});
