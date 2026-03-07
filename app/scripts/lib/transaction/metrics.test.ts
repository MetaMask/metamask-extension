/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventUiCustomization,
} from '../../../../shared/constants/metametrics';
import { hexWEIToDecGWEI } from '../../../../shared/modules/conversion.utils';
import { TransactionMetaMetricsEvent } from '../../../../shared/constants/transaction';
import type { TransactionMetricsRequest } from '../../../../shared/types/metametrics';
import {
  handleTransactionAdded,
  handleTransactionApproved,
  handleTransactionConfirmed,
  handleTransactionDropped,
  handleTransactionFailed,
  handlePostTransactionBalanceUpdate,
  handleTransactionRejected,
  handleTransactionSubmitted,
} from './metrics';

jest.mock('../../../../shared/modules/transaction.utils', () => ({
  ...jest.requireActual('../../../../shared/modules/transaction.utils'),
  determineTransactionAssetType: jest.fn().mockResolvedValue({
    assetType: 'native',
    tokenStandard: null,
  }),
}));

jest.mock('../snap-keyring/metrics', () => ({
  getSnapAndHardwareInfoForMetrics: jest.fn().mockResolvedValue({}),
}));

const createRequest = () => {
  return {
    getTransactionUIMetricsFragment: jest.fn(),
    upsertTransactionUIMetricsFragment: jest.fn(),
    getAccountBalance: jest.fn().mockReturnValue('0xffffffffffffffff'),
    getAccountType: jest.fn().mockResolvedValue('MetaMask'),
    getDeviceModel: jest.fn().mockResolvedValue('N/A'),
    getHardwareTypeForMetric: jest.fn(),
    getEIP1559GasFeeEstimates: jest
      .fn()
      .mockResolvedValue({ gasFeeEstimates: {} }),
    getSelectedAddress: jest
      .fn()
      .mockReturnValue('0x1111111111111111111111111111111111111111'),
    getParticipateInMetrics: jest.fn().mockReturnValue(true),
    getTokenStandardAndDetails: jest.fn(),
    getTransaction: jest.fn(),
    provider: {} as any,
    snapAndHardwareMessenger: {} as any,
    trackEvent: jest.fn(),
    getIsSmartTransaction: jest.fn().mockReturnValue(false),
    getSmartTransactionByMinedTxHash: jest.fn(),
    getMethodData: jest.fn().mockResolvedValue({ name: 'transfer' }),
    getIsConfirmationAdvancedDetailsOpen: jest.fn().mockReturnValue(false),
    getHDEntropyIndex: jest.fn().mockReturnValue(0),
    getNetworkRpcUrl: jest
      .fn()
      .mockReturnValue('https://rpc.test.example/path'),
    getFeatureFlags: jest.fn().mockReturnValue({ extensionUxPna25: true }),
    getPna25Acknowledged: jest.fn().mockReturnValue(true),
    getAddressSecurityAlertResponse: jest.fn(),
    getSecurityAlertsEnabled: jest.fn().mockReturnValue(true),
  } as unknown as TransactionMetricsRequest;
};

const createTxMeta = (overrides = {}) =>
  ({
    id: '1',
    chainId: '0x1',
    origin: 'metamask',
    status: TransactionStatus.unapproved,
    type: TransactionType.simpleSend,
    time: Date.now(),
    txParams: {
      from: '0x1111111111111111111111111111111111111111',
      to: '0x2222222222222222222222222222222222222222',
      gas: '0x5208',
      gasPrice: '0x3b9aca00',
      value: '0x0',
      data: '0xa9059cbb',
    },
    ...overrides,
  }) as any;

describe('transaction metrics handlers', () => {
  it('tracks added event', async () => {
    const request = createRequest();
    await handleTransactionAdded(request, { transactionMeta: createTxMeta() });

    expect(request.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event: TransactionMetaMetricsEvent.added,
        category: MetaMetricsEventCategory.Transactions,
      }),
    );
  });

  it('tracks approved event', async () => {
    const request = createRequest();
    await handleTransactionApproved(request, {
      transactionMeta: createTxMeta({ status: TransactionStatus.approved }),
    });

    expect(request.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: TransactionMetaMetricsEvent.approved }),
    );
  });

  it('tracks submitted event', async () => {
    const request = createRequest();
    await handleTransactionSubmitted(request, {
      transactionMeta: createTxMeta({ status: TransactionStatus.submitted }),
    });

    expect(request.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: TransactionMetaMetricsEvent.submitted }),
    );
  });

  it('tracks rejected event', async () => {
    const request = createRequest();
    const transactionMeta = createTxMeta({
      status: TransactionStatus.rejected,
    });

    await handleTransactionRejected(request, { transactionMeta });

    expect(request.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: TransactionMetaMetricsEvent.rejected }),
    );
  });

  it('tracks finalized event for failed and includes error', async () => {
    const request = createRequest();
    await handleTransactionFailed(request, {
      transactionMeta: createTxMeta({ status: TransactionStatus.failed }),
      error: 'boom',
    });

    const payload = (request.trackEvent as jest.Mock).mock.calls[0][0];
    expect(payload.event).toBe(TransactionMetaMetricsEvent.finalized);
    expect(payload.sensitiveProperties.error).toBe('boom');
  });

  it('tracks finalized event for dropped and sets dropped marker', async () => {
    const request = createRequest();
    await handleTransactionDropped(request, {
      transactionMeta: createTxMeta({ status: TransactionStatus.dropped }),
    });

    const payload = (request.trackEvent as jest.Mock).mock.calls[0][0];
    expect(payload.event).toBe(TransactionMetaMetricsEvent.finalized);
    expect(payload.sensitiveProperties.dropped).toBe(true);
  });

  it('tracks finalized event for confirmed and computes status override', async () => {
    const request = createRequest();
    const now = Date.now();
    await handleTransactionConfirmed(request, {
      ...createTxMeta({
        status: TransactionStatus.confirmed,
        submittedTime: now - 3000,
        blockTimestamp: `0x${Math.floor(now / 1000).toString(16)}`,
        txReceipt: { gasUsed: '0x5208', blockNumber: '0x10', status: '0x0' },
      }),
    } as any);

    const payload = (request.trackEvent as jest.Mock).mock.calls[0][0];
    expect(payload.event).toBe(TransactionMetaMetricsEvent.finalized);
    expect(payload.sensitiveProperties.status).toBe('failed on-chain');
    expect(payload.sensitiveProperties.gas_used).toBe(
      hexWEIToDecGWEI('0x5208'),
    );
    expect(payload.sensitiveProperties.block_number).toBe('16');
  });

  it('includes transaction hash when pna25 requirements are met', async () => {
    const request = createRequest();
    await handleTransactionFailed(request, {
      transactionMeta: createTxMeta({
        status: TransactionStatus.failed,
        hash: '0xabc',
      }),
    });

    const payload = (request.trackEvent as jest.Mock).mock.calls[0][0];
    expect(payload.properties.transaction_hash).toBe('0xabc');
  });

  it('merges confirmation metrics into event payload', async () => {
    const request = createRequest();
    (request.getTransactionUIMetricsFragment as jest.Mock).mockReturnValue({
      properties: { gas_edit_attempted: 'basic' },
      sensitiveProperties: { custom_sensitive: 'x' },
    });

    await handleTransactionAdded(request, { transactionMeta: createTxMeta() });

    const payload = (request.trackEvent as jest.Mock).mock.calls[0][0];
    expect(payload.properties.gas_edit_attempted).toBe('basic');
    expect(payload.sensitiveProperties.custom_sensitive).toBe('x');
  });

  it('does not include contract-specific fields for simple send transactions', async () => {
    const request = createRequest();

    await handleTransactionAdded(request, { transactionMeta: createTxMeta() });

    const payload = (request.trackEvent as jest.Mock).mock.calls[0][0];
    expect(
      payload.sensitiveProperties.transaction_contract_address,
    ).toStrictEqual([]);
    expect(payload.sensitiveProperties.transaction_contract_method_4byte).toBe(
      undefined,
    );
  });

  it('appends ui_customizations from fragment without dropping security flags', async () => {
    const request = createRequest();
    (request.getTransactionUIMetricsFragment as jest.Mock).mockReturnValue({
      properties: {
        ui_customizations: ['custom_ui'],
      },
    });

    await handleTransactionAdded(request, {
      transactionMeta: createTxMeta({
        securityProviderResponse: {
          flagAsDangerous: 1,
        },
      }),
    });

    const payload = (request.trackEvent as jest.Mock).mock.calls[0][0];
    expect(payload.properties.ui_customizations).toEqual(
      expect.arrayContaining([
        MetaMetricsEventUiCustomization.FlaggedAsMalicious,
        'custom_ui',
      ]),
    );
  });

  it('tracks SwapFailed in post transaction balance update', async () => {
    const request = createRequest();
    const transactionMeta = createTxMeta({
      swapMetaData: { token_to_amount: '10' },
      txReceipt: { status: '0x0' },
    });

    await handlePostTransactionBalanceUpdate(request, { transactionMeta });

    const payload = (request.trackEvent as jest.Mock).mock.calls[0][0];
    expect(payload.event).toBe(MetaMetricsEventName.SwapFailed);
  });

  it('tracks SwapCompleted in post transaction balance update', async () => {
    const request = createRequest();
    const transactionMeta = createTxMeta({
      chainId: '0x1',
      destinationTokenSymbol: 'USDC',
      destinationTokenAddress: '0xabc',
      destinationTokenDecimals: 6,
      swapMetaData: { token_to_amount: '10', estimated_gas: '100' },
      txReceipt: {
        status: '0x1',
        gasUsed: '0x64',
        effectiveGasPrice: '0x3b9aca00',
      },
    });

    await handlePostTransactionBalanceUpdate(request, { transactionMeta });

    const payload = (request.trackEvent as jest.Mock).mock.calls[0][0];
    expect(payload.event).toBe(MetaMetricsEventName.SwapCompleted);
  });

  it('preserves batch arrays without index-based merge corruption', async () => {
    const request = createRequest();
    (request.getMethodData as jest.Mock)
      .mockResolvedValueOnce({ name: 'approve' })
      .mockResolvedValueOnce({ name: 'transfer' });

    await handleTransactionAdded(request, {
      transactionMeta: createTxMeta({
        txParams: {
          ...createTxMeta().txParams,
          to: '0x9999999999999999999999999999999999999999',
          data: undefined,
        },
        nestedTransactions: [
          {
            type: TransactionType.tokenMethodApprove,
            to: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            data: '0x095ea7b3',
          },
          {
            type: TransactionType.tokenMethodTransfer,
            to: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            data: '0xa9059cbb',
          },
        ],
      }),
    });

    const payload = (request.trackEvent as jest.Mock).mock.calls[0][0];
    expect(
      payload.sensitiveProperties.transaction_contract_address,
    ).toStrictEqual([
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    ]);
    expect(payload.properties.transaction_contract_method).toStrictEqual([
      'approve',
      'transfer',
    ]);
  });

  it('does not track post transaction balance update when metrics opted out', async () => {
    const request = createRequest();
    (request.getParticipateInMetrics as jest.Mock).mockReturnValue(false);
    const transactionMeta = createTxMeta({
      swapMetaData: { token_to_amount: '10' },
      txReceipt: { status: '0x0' },
    });

    await handlePostTransactionBalanceUpdate(request, { transactionMeta });

    expect(request.trackEvent).not.toHaveBeenCalled();
  });

  it('does not track post transaction balance update when no swap metadata', async () => {
    const request = createRequest();
    const transactionMeta = createTxMeta({
      swapMetaData: undefined,
      txReceipt: { status: '0x1' },
    });

    await handlePostTransactionBalanceUpdate(request, { transactionMeta });

    expect(request.trackEvent).not.toHaveBeenCalled();
  });
});
