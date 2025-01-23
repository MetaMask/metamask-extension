import { Provider } from '@metamask/network-controller';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { createTestProviderTools } from '../../test/stub/provider';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { TransactionMetricsRequest } from '../../app/scripts/lib/transaction/metrics';
import { CHAIN_IDS } from '../constants/network';
import { getSmartTransactionMetricsProperties } from './metametrics';

const txHash =
  '0x0302b75dfb9fd9eb34056af031efcaee2a8cbd799ea054a85966165cd82a7356';
const address = '0x1678a085c290ebd122dc42cba69373b5953b831d';
const providerResultStub = {
  eth_getCode: '0x123',
};
const { provider } = createTestProviderTools({
  scaffold: providerResultStub,
  chainId: CHAIN_IDS.MAINNET,
});

const createTransactionMetricsRequest = (customProps = {}) => {
  return {
    createEventFragment: jest.fn(),
    finalizeEventFragment: jest.fn(),
    getEventFragmentById: jest.fn(),
    updateEventFragment: jest.fn(),
    getAccountType: jest.fn(),
    getDeviceModel: jest.fn(),
    getEIP1559GasFeeEstimates: jest.fn(),
    getSelectedAddress: jest.fn(),
    getParticipateInMetrics: jest.fn(),
    getTokenStandardAndDetails: jest.fn(),
    getTransaction: jest.fn(),
    provider: provider as Provider,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    snapAndHardwareMessenger: jest.fn() as any,
    trackEvent: jest.fn(),
    getIsSmartTransaction: jest.fn(),
    getSmartTransactionByMinedTxHash: jest.fn(),
    getMethodData: jest.fn(),
    getIsRedesignedConfirmationsDeveloperEnabled: jest.fn(),
    getIsConfirmationAdvancedDetailsOpen: jest.fn(),
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
    swapMetaData: {
      gas_included: true,
    },
  };
};

describe('getSmartTransactionMetricsProperties', () => {
  it('returns all smart transaction properties', () => {
    const transactionMetricsRequest = createTransactionMetricsRequest({
      getIsSmartTransaction: () => true,
      getSmartTransactionByMinedTxHash: () => {
        return {
          uuid: 'uuid',
          status: 'success',
          cancellable: false,
          statusMetadata: {
            cancellationFeeWei: 36777567771000,
            cancellationReason: 'not_cancelled',
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
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transactionMeta as any,
    );

    expect(result).toStrictEqual({
      gas_included: true,
      is_smart_transaction: true,
      smart_transaction_proxied: true,
      smart_transaction_timed_out: true,
    });
  });

  it('returns "is_smart_transaction: false" if it is not a smart transaction', () => {
    const transactionMetricsRequest = createTransactionMetricsRequest({
      getIsSmartTransaction: () => false,
    });
    const transactionMeta = createTransactionMeta();

    const result = getSmartTransactionMetricsProperties(
      transactionMetricsRequest,
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transactionMeta as any,
    );

    expect(result).toStrictEqual({
      is_smart_transaction: false,
    });
  });

  it('returns "is_smart_transaction" and "gas_included" params only if it is a smart transaction, but does not have statusMetadata', () => {
    const transactionMetricsRequest = createTransactionMetricsRequest({
      getIsSmartTransaction: () => true,
      getSmartTransactionByMinedTxHash: () => {
        return {
          statusMetadata: null,
        };
      },
    });
    const transactionMeta = createTransactionMeta();

    const result = getSmartTransactionMetricsProperties(
      transactionMetricsRequest,
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transactionMeta as any,
    );

    expect(result).toStrictEqual({
      is_smart_transaction: true,
      gas_included: true,
    });
  });
});
