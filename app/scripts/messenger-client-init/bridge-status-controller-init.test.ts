import {
  BridgeStatusController,
  BridgeStatusControllerMessenger,
  QuoteStatusGetError,
  QuoteStatusUpdateError,
} from '@metamask/bridge-status-controller';
import { TransactionController } from '@metamask/transaction-controller';
import { BRIDGE_API_BASE_URL } from '../../../shared/constants/bridge';
import { captureException } from '../../../shared/lib/sentry';
import { traceBackgroundPoll } from '../../../shared/lib/trace';
import { getRootMessenger } from '../lib/messenger';
import { MessengerClientInitRequest, MessengerClientName } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import { getBridgeStatusControllerMessenger } from './messengers';
import { BridgeStatusControllerInit } from './bridge-status-controller-init';

jest.mock('@metamask/bridge-status-controller', () => ({
  ...jest.requireActual('@metamask/bridge-status-controller'),
  BridgeStatusController: jest.fn(),
}));
jest.mock('../../../shared/lib/sentry');

jest.mock('../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../shared/lib/trace'),
  traceBackgroundPoll: jest.fn((_controllerName: string, fn: () => unknown) =>
    fn(),
  ),
}));

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      clientProduct: 'metamask-extension',
      clientVersion: 'MOCK_VERSION',
      config: {
        customBridgeApiBaseUrl: BRIDGE_API_BASE_URL,
      },
      addTransactionBatchFn: expect.any(Function),
      fetchFn: expect.any(Function),
      traceFn: expect.any(Function),
      onQuoteStatusManagerError: expect.any(Function),
      isQuoteStatusManagerEnabled: expect.any(Function),
    });
  });

  it('roots bridge status polling cycles in their own traces', async () => {
    const executePoll = jest.fn().mockResolvedValue(undefined);
    jest.mocked(BridgeStatusController).mockImplementationOnce(
      () =>
        // eslint-disable-next-line @typescript-eslint/naming-convention -- _executePoll is BridgeStatusController's private polling method
        ({ _executePoll: executePoll }) as unknown as BridgeStatusController,
    );

    const { messengerClient } =
      BridgeStatusControllerInit(getInitRequestMock());

    await (
      messengerClient as unknown as {
        _executePoll: (input: unknown) => Promise<void>;
      }
    )._executePoll({ bridgeTxMetaId: '0x1' });

    expect(traceBackgroundPoll).toHaveBeenCalledWith(
      'BridgeStatusController',
      expect.any(Function),
    );
    expect(executePoll).toHaveBeenCalledWith({ bridgeTxMetaId: '0x1' });
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
  describe('onQuoteStatusManagerError', () => {
    function getOnQuoteStatusManagerError() {
      BridgeStatusControllerInit(getInitRequestMock());
      const controllerMock = jest.mocked(BridgeStatusController);
      const { onQuoteStatusManagerError } =
        controllerMock.mock.calls[controllerMock.mock.calls.length - 1][0];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return onQuoteStatusManagerError!;
    }

    it('calls captureException for QuoteStatusUpdateError', () => {
      const onQuoteStatusManagerError = getOnQuoteStatusManagerError();
      const error = new QuoteStatusUpdateError('update failed', {
        quoteId: 'quote-1',
      });
      onQuoteStatusManagerError(error);
      expect(captureException).toHaveBeenCalledWith(error);
    });

    it('does not call captureException for QuoteStatusGetError', () => {
      const onQuoteStatusManagerError = getOnQuoteStatusManagerError();
      const error = new QuoteStatusGetError('get failed', {
        quoteId: 'quote-1',
      });
      onQuoteStatusManagerError(error);
      expect(captureException).not.toHaveBeenCalled();
    });
  });

  describe('isQuoteStatusManagerEnabled', () => {
    function getIsQuoteStatusManagerEnabled(
      bridgeQuoteStatusManager: { enabled?: boolean } | undefined,
    ) {
      const requestMock = getInitRequestMock();
      requestMock.getMessengerClient.mockImplementation(((
        name: MessengerClientName,
      ) => {
        if (name === 'RemoteFeatureFlagController') {
          return {
            state: {
              remoteFeatureFlags: { bridgeQuoteStatusManager },
            },
          };
        }
        return undefined;
      }) as unknown as MessengerClientInitRequest<BridgeStatusControllerMessenger>['getMessengerClient']);

      BridgeStatusControllerInit(requestMock);
      const controllerMock = jest.mocked(BridgeStatusController);
      const { isQuoteStatusManagerEnabled } =
        controllerMock.mock.calls[controllerMock.mock.calls.length - 1][0];
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return isQuoteStatusManagerEnabled!;
    }

    it('returns true when the remote feature flag is enabled', () => {
      const isQuoteStatusManagerEnabled = getIsQuoteStatusManagerEnabled({
        enabled: true,
      });
      expect(isQuoteStatusManagerEnabled()).toBe(true);
    });

    it('returns false when the remote feature flag is disabled', () => {
      const isQuoteStatusManagerEnabled = getIsQuoteStatusManagerEnabled({
        enabled: false,
      });
      expect(isQuoteStatusManagerEnabled()).toBe(false);
    });

    it('returns false when the remote feature flag is not set', () => {
      const isQuoteStatusManagerEnabled =
        getIsQuoteStatusManagerEnabled(undefined);
      expect(isQuoteStatusManagerEnabled()).toBe(false);
    });
  });
});
