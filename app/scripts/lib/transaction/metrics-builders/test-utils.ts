/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionMetricsBuilderRequest } from './types';

export const createBuilderRequest = (
  overrides: Partial<TransactionMetricsBuilderRequest> = {},
): TransactionMetricsBuilderRequest => {
  const transactionMetricsRequest = {
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
  } as any;

  return {
    transactionMeta: {
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
    } as any,
    transactionMetricsRequest,
    eventName: 'added' as any,
    transactionEventPayload: { transactionMeta: {} as any },
    context: {
      contractMethodName: 'transfer',
      contractMethod4Byte: '0xa9059cbb',
      transactionTypeForMetrics: 'simpleSend',
      isContractInteraction: false,
      isApproveMethod: false,
      assetType: 'native',
      tokenStandard: undefined,
    },
    ...overrides,
  };
};
