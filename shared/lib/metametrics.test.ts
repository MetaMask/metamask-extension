import { Provider } from '@metamask/network-controller';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { createTestProviderTools } from '../../test/stub/provider';
import { CHAIN_IDS } from '../constants/network';
import { TransactionMetricsRequest } from '../types/metametrics';
import { getSmartTransactionMetricsProperties } from './metametrics';

const txHash =
  '0x0302b75dfb9fd9eb34056af031efcaee2a8cbd799ea054a85966165cd82a7356';
const address = '0x1678a085c290ebd122dc42cba69373b5953b831d';
const providerResultStub = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  eth_getCode: '0x123',
};
const { provider } = createTestProviderTools({
  scaffold: providerResultStub,
  chainId: CHAIN_IDS.MAINNET,
});

const createTransactionMetricsRequest = (customProps = {}) => {
  return {
    getTransactionUIMetricsFragment: jest.fn(),
    upsertTransactionUIMetricsFragment: jest.fn(),
    getAccountBalance: jest.fn(),
    getAccountType: jest.fn(),
    getDeviceModel: jest.fn(),
    getHardwareTypeForMetric: jest.fn(),
    getEIP1559GasFeeEstimates: jest.fn(),
    getSelectedAddress: jest.fn(),
    getParticipateInMetrics: jest.fn(),
    getTokenStandardAndDetails: jest.fn(),
    getTransaction: jest.fn(),
    provider: provider as unknown as Provider,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    snapAndHardwareMessenger: jest.fn() as any,
    trackEvent: jest.fn(),
    getIsSmartTransaction: jest.fn().mockReturnValue(false),
    getSmartTransactionsPreferenceEnabled: jest.fn(),
    getSmartTransactionsEnabled: jest.fn(),
    getSmartTransactionByMinedTxHash: jest.fn(),
    getMethodData: jest.fn(),
    getIsConfirmationAdvancedDetailsOpen: jest.fn(),
    getHDEntropyIndex: jest.fn(),
    getNetworkRpcUrl: jest.fn(),
    getFeatureFlags: jest.fn(),
    getPna25Acknowledged: jest.fn(),
    getAddressSecurityAlertResponse: jest.fn(),
    getSecurityAlertsEnabled: jest.fn(),
    ...customProps,
  } as TransactionMetricsRequest;
};

const createTransactionMeta = () => {
  return {
    id: '1',
    status: TransactionStatus.unapproved,
    txParams: {
      from: address,
      to: address,
      gasPrice: '0x77359400',
      gas: '0x7b0d',
      nonce: '0x4b',
    },
    type: TransactionType.simpleSend,
    chainId: CHAIN_IDS.MAINNET,
    time: 1624408066355,
    defaultGasEstimates: {
      gas: '0x7b0d',
      gasPrice: '0x77359400',
    },
    securityProviderResponse: {
      flagAsDangerous: 0,
    },
    hash: txHash,
    error: null,
  };
};

describe('getSmartTransactionMetricsProperties', () => {
  it('returns all smart transaction properties when STX is active', () => {
    const transactionMetricsRequest = createTransactionMetricsRequest({
      getIsSmartTransaction: () => true,
      getSmartTransactionsPreferenceEnabled: () => true,
      getSmartTransactionsEnabled: () => true,
      getSmartTransactionByMinedTxHash: () => {
        return {
          uuid: 'uuid',
          status: 'success',
          cancellable: false,
          statusMetadata: {
            cancellationFeeWei: 36777567771000,
            cancellationReason: 'not_cancelled',
            originalTransactionStatus: 'pending',
            deadlineRatio: 0.6400288486480713,
            minedHash: txHash,
            timedOut: true,
            proxied: true,
            minedTx: 'success',
          },
        };
      },
    });
    const transactionMeta = createTransactionMeta();

    const result = getSmartTransactionMetricsProperties(
      transactionMetricsRequest,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transactionMeta as any,
    );

    expect(result).toStrictEqual({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_smart_transactions_user_opt_in: true,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_smart_transactions_available: true,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_smart_transaction: true,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      stx_original_transaction_status: 'pending',
    });
  });

  it('returns correct properties when user has not opted in', () => {
    const transactionMetricsRequest = createTransactionMetricsRequest({
      getIsSmartTransaction: () => false,
      getSmartTransactionsPreferenceEnabled: () => false,
      getSmartTransactionsEnabled: () => true,
    });
    const transactionMeta = createTransactionMeta();

    const result = getSmartTransactionMetricsProperties(
      transactionMetricsRequest,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transactionMeta as any,
    );

    expect(result).toStrictEqual({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_smart_transactions_user_opt_in: false,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_smart_transactions_available: true,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_smart_transaction: false,
    });
  });

  it('returns correct properties when STX is not available for the chain', () => {
    const transactionMetricsRequest = createTransactionMetricsRequest({
      getIsSmartTransaction: () => false,
      getSmartTransactionsPreferenceEnabled: () => true,
      getSmartTransactionsEnabled: () => false,
    });
    const transactionMeta = createTransactionMeta();

    const result = getSmartTransactionMetricsProperties(
      transactionMetricsRequest,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transactionMeta as any,
    );

    expect(result).toStrictEqual({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_smart_transactions_user_opt_in: true,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_smart_transactions_available: false,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_smart_transaction: false,
    });
  });

  it('returns both new properties plus stx_original_transaction_status when statusMetadata is present', () => {
    const transactionMetricsRequest = createTransactionMetricsRequest({
      getIsSmartTransaction: () => true,
      getSmartTransactionsPreferenceEnabled: () => true,
      getSmartTransactionsEnabled: () => true,
      getSmartTransactionByMinedTxHash: () => {
        return {
          statusMetadata: {
            originalTransactionStatus: 'pending',
            timedOut: true,
            proxied: true,
          },
        };
      },
    });
    const transactionMeta = createTransactionMeta();

    const result = getSmartTransactionMetricsProperties(
      transactionMetricsRequest,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transactionMeta as any,
    );

    expect(result).toStrictEqual({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_smart_transactions_user_opt_in: true,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_smart_transactions_available: true,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_smart_transaction: true,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      stx_original_transaction_status: 'pending',
    });
  });
});
