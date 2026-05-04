import {
  BridgeStatusController,
  BridgeStatusControllerMessenger,
} from '@metamask/bridge-status-controller';
import { TransactionController } from '@metamask/transaction-controller';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { captureException } from '../../../shared/lib/sentry';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest, MessengerClientName } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getBridgeStatusControllerMessenger } from './messengers';
import { BridgeStatusControllerInit } from './bridge-status-controller-init';

jest.mock('@metamask/bridge-status-controller');
jest.mock('../../../shared/lib/sentry');

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<BridgeStatusControllerMessenger>
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
    const { messengerClient } =
      BridgeStatusControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(BridgeStatusController);
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
      addTransactionBatchFn: expect.any(Function),
      fetchFn: expect.any(Function),
      traceFn: expect.any(Function),
      onQuoteStatusUpdateError: expect.any(Function),
      isQuoteStatusUpdateEnabled: expect.any(Function),
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
      requestMock.getMessengerClient.mockImplementation(((
        name: MessengerClientName,
      ) => {
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
        if (name === 'RemoteFeatureFlagController') {
          return { state: { remoteFeatureFlags: {} } };
        }
        return undefined;
      }) as unknown as MessengerClientInitRequest<BridgeStatusControllerMessenger>['getMessengerClient']);

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

  describe('onQuoteStatusUpdateError', () => {
    function getOnQuoteStatusUpdateError() {
      BridgeStatusControllerInit(getInitRequestMock());
      const controllerMock = jest.mocked(BridgeStatusController);
      const { onQuoteStatusUpdateError } =
        controllerMock.mock.calls[controllerMock.mock.calls.length - 1][0];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return onQuoteStatusUpdateError!;
    }

    it('calls captureException with the error', () => {
      const onQuoteStatusUpdateError = getOnQuoteStatusUpdateError();
      const error = new Error('bridge quote status update failed');
      onQuoteStatusUpdateError(error);
      expect(captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('isQuoteStatusUpdateEnabled', () => {
    function getIsQuoteStatusUpdateEnabled(
      bridgeQuoteStatusUpdateEnabled: unknown,
    ) {
      const requestMock = getInitRequestMock();
      requestMock.getMessengerClient.mockImplementation(((
        name: MessengerClientName,
      ) => {
        if (name === 'RemoteFeatureFlagController') {
          return {
            state: {
              remoteFeatureFlags: { bridgeQuoteStatusUpdateEnabled },
            },
          };
        }
        return undefined;
      }) as unknown as MessengerClientInitRequest<BridgeStatusControllerMessenger>['getMessengerClient']);

      BridgeStatusControllerInit(requestMock);
      const controllerMock = jest.mocked(BridgeStatusController);
      const { isQuoteStatusUpdateEnabled } =
        controllerMock.mock.calls[controllerMock.mock.calls.length - 1][0];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return isQuoteStatusUpdateEnabled!;
    }

    it('returns true when the remote feature flag is enabled', () => {
      const isQuoteStatusUpdateEnabled = getIsQuoteStatusUpdateEnabled(true);
      expect(isQuoteStatusUpdateEnabled()).toBe(true);
    });

    it('returns false when the remote feature flag is disabled', () => {
      const isQuoteStatusUpdateEnabled = getIsQuoteStatusUpdateEnabled(false);
      expect(isQuoteStatusUpdateEnabled()).toBe(false);
    });

    it('returns false when the remote feature flag is not set', () => {
      const isQuoteStatusUpdateEnabled =
        getIsQuoteStatusUpdateEnabled(undefined);
      expect(isQuoteStatusUpdateEnabled()).toBe(false);
    });
  });
});
