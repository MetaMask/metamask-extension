import { Provider } from '@metamask/network-controller';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  createTestProviderTools,
  getTestAccounts,
} from '../../../../test/stub/provider';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import {
  AssetType,
  TokenStandard,
  TransactionMetaMetricsEvent,
} from '../../../../shared/constants/transaction';
import {
  MetaMetricsTransactionEventSource,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { TRANSACTION_ENVELOPE_TYPE_NAMES } from '../../../../shared/lib/transactions-controller-utils';
///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
///: END:ONLY_INCLUDE_IF(blockaid)
import {
  handleTransactionAdded,
  handleTransactionApproved,
  handleTransactionConfirmed,
  handleTransactionDropped,
  handleTransactionFailed,
  handleTransactionRejected,
  handleTransactionSubmitted,
  METRICS_STATUS_FAILED,
  TransactionMetricsRequest,
} from './metrics';

const providerResultStub = {
  eth_getCode: '0x123',
};
const { provider } = createTestProviderTools({
  scaffold: providerResultStub,
  networkId: '5',
  chainId: '5',
});

jest.mock('../snap-keyring/metrics', () => {
  return {
    getSnapAndHardwareInfoForMetrics: jest.fn().mockResolvedValue({
      account_snap_type: 'snaptype',
      account_snap_version: 'snapversion',
    }),
  };
});

const mockTransactionMetricsRequest = {
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
  snapAndHardwareMessenger: jest.fn() as any,
  trackEvent: jest.fn(),
} as TransactionMetricsRequest;

describe('Transaction metrics', () => {
  let fromAccount,
    mockChainId,
    mockNetworkId,
    mockTransactionMeta,
    mockTransactionMetaWithBlockaid,
    expectedProperties,
    expectedSensitiveProperties,
    mockActionId;

  beforeEach(() => {
    fromAccount = getTestAccounts()[0];
    mockChainId = '0x5';
    mockNetworkId = '5';
    mockActionId = '2';
    mockTransactionMeta = {
      id: '1',
      status: TransactionStatus.unapproved,
      txParams: {
        from: fromAccount.address,
        to: '0x1678a085c290ebd122dc42cba69373b5953b831d',
        gasPrice: '0x77359400',
        gas: '0x7b0d',
        nonce: '0x4b',
      },
      type: TransactionType.simpleSend,
      origin: ORIGIN_METAMASK,
      chainId: mockChainId,
      time: 1624408066355,
      defaultGasEstimates: {
        gas: '0x7b0d',
        gasPrice: '0x77359400',
      },
      securityProviderResponse: {
        flagAsDangerous: 0,
      },
    };

    // copy mockTransactionMeta and add blockaid data
    mockTransactionMetaWithBlockaid = {
      ...JSON.parse(JSON.stringify(mockTransactionMeta)),
      securityAlertResponse: {
        result_type: BlockaidResultType.Malicious,
        reason: BlockaidReason.maliciousDomain,
        providerRequestsCount: {
          eth_call: 5,
          eth_getCode: 3,
        },
      },
    };

    expectedProperties = {
      account_snap_type: 'snaptype',
      account_snap_version: 'snapversion',
      account_type: undefined,
      asset_type: AssetType.native,
      chain_id: mockChainId,
      device_model: undefined,
      eip_1559_version: '0',
      gas_edit_attempted: 'none',
      gas_estimation_failed: false,
      gas_edit_type: 'none',
      network: mockNetworkId,
      referrer: ORIGIN_METAMASK,
      security_alert_reason: BlockaidReason.notApplicable,
      security_alert_response: BlockaidReason.notApplicable,
      source: MetaMetricsTransactionEventSource.User,
      status: 'unapproved',
      token_standard: TokenStandard.none,
      transaction_speed_up: false,
      transaction_type: TransactionType.simpleSend,
      ui_customizations: null,
    };

    expectedSensitiveProperties = {
      default_gas: '0.000031501',
      default_gas_price: '2',
      first_seen: 1624408066355,
      gas_limit: '0x7b0d',
      gas_price: '2',
      transaction_contract_method: undefined,
      transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
      transaction_replaced: undefined,
    };

    jest.clearAllMocks();
  });

  describe('handleTransactionAdded', () => {
    it('should return if transaction meta is not defined', async () => {
      await handleTransactionAdded(mockTransactionMetricsRequest, {} as any);
      expect(
        mockTransactionMetricsRequest.createEventFragment,
      ).not.toBeCalled();
    });

    it('should create event fragment', async () => {
      await handleTransactionAdded(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta as any,
        actionId: mockActionId,
      });

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        failureEvent: TransactionMetaMetricsEvent.rejected,
        initialEvent: TransactionMetaMetricsEvent.added,
        successEvent: TransactionMetaMetricsEvent.approved,
        uniqueIdentifier: 'transaction-added-1',
        persist: true,
        properties: expectedProperties,
        sensitiveProperties: expectedSensitiveProperties,
      });
    });

    it('should create event fragment when simulation failed', async () => {
      mockTransactionMeta.simulationFails = true;

      await handleTransactionAdded(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta as any,
        actionId: mockActionId,
      });

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        failureEvent: TransactionMetaMetricsEvent.rejected,
        initialEvent: TransactionMetaMetricsEvent.added,
        successEvent: TransactionMetaMetricsEvent.approved,
        uniqueIdentifier: 'transaction-added-1',
        persist: true,
        properties: {
          ...expectedProperties,
          ui_customizations: ['gas_estimation_failed'],
          gas_estimation_failed: true,
        },
        sensitiveProperties: expectedSensitiveProperties,
      });
    });

    it('should create event fragment with blockaid', async () => {
      await handleTransactionAdded(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMetaWithBlockaid as any,
        actionId: mockActionId,
      });

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        failureEvent: TransactionMetaMetricsEvent.rejected,
        initialEvent: TransactionMetaMetricsEvent.added,
        successEvent: TransactionMetaMetricsEvent.approved,
        uniqueIdentifier: 'transaction-added-1',
        persist: true,
        properties: {
          ...expectedProperties,
          security_alert_reason: BlockaidReason.maliciousDomain,
          security_alert_response: 'Malicious',
          ui_customizations: ['flagged_as_malicious'],
          ppom_eth_call_count: 5,
          ppom_eth_getCode_count: 3,
        },
        sensitiveProperties: expectedSensitiveProperties,
      });
    });
  });

  describe('handleTransactionApproved', () => {
    it('should return if transaction meta is not defined', async () => {
      await handleTransactionApproved(mockTransactionMetricsRequest, {} as any);
      expect(
        mockTransactionMetricsRequest.createEventFragment,
      ).not.toBeCalled();
      expect(
        mockTransactionMetricsRequest.updateEventFragment,
      ).not.toBeCalled();
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).not.toBeCalled();
    });

    it('should create, update, finalize event fragment', async () => {
      await handleTransactionApproved(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta as any,
        actionId: mockActionId,
      });

      const expectedUniqueId = 'transaction-added-1';

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.approved,
        failureEvent: TransactionMetaMetricsEvent.rejected,
        uniqueIdentifier: expectedUniqueId,
        persist: true,
        properties: expectedProperties,
        sensitiveProperties: expectedSensitiveProperties,
      });

      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledWith(
        expectedUniqueId,
        {
          properties: expectedProperties,
          sensitiveProperties: expectedSensitiveProperties,
        },
      );

      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledTimes(1);
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledWith(expectedUniqueId);
    });

    it('should create, update, finalize event fragment with blockaid', async () => {
      await handleTransactionApproved(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMetaWithBlockaid as any,
        actionId: mockActionId,
      });

      const expectedUniqueId = 'transaction-added-1';

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.approved,
        failureEvent: TransactionMetaMetricsEvent.rejected,
        uniqueIdentifier: expectedUniqueId,
        persist: true,
        properties: {
          ...expectedProperties,
          ui_customizations: ['flagged_as_malicious'],
          security_alert_reason: BlockaidReason.maliciousDomain,
          security_alert_response: 'Malicious',
          ppom_eth_call_count: 5,
          ppom_eth_getCode_count: 3,
        },
        sensitiveProperties: expectedSensitiveProperties,
      });

      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledWith(
        expectedUniqueId,
        {
          properties: {
            ...expectedProperties,
            ui_customizations: ['flagged_as_malicious'],
            security_alert_reason: BlockaidReason.maliciousDomain,
            security_alert_response: 'Malicious',
            ppom_eth_call_count: 5,
            ppom_eth_getCode_count: 3,
          },
          sensitiveProperties: expectedSensitiveProperties,
        },
      );

      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledTimes(1);
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledWith(expectedUniqueId);
    });
  });

  describe('handleTransactionFailed', () => {
    it('should return if transaction meta is not defined', async () => {
      await handleTransactionFailed(mockTransactionMetricsRequest, {} as any);
      expect(
        mockTransactionMetricsRequest.createEventFragment,
      ).not.toBeCalled();
      expect(
        mockTransactionMetricsRequest.updateEventFragment,
      ).not.toBeCalled();
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).not.toBeCalled();
    });

    it('should create, update, finalize event fragment', async () => {
      const mockErrorMessage = 'Unexpected error';
      mockTransactionMeta.txReceipt = {
        gasUsed: '0x123',
        status: '0x0',
      };
      mockTransactionMeta.submittedTime = 123;

      await handleTransactionFailed(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta,
        actionId: mockActionId,
        error: mockErrorMessage,
      } as any);

      const expectedUniqueId = 'transaction-submitted-1';

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.finalized,
        uniqueIdentifier: expectedUniqueId,
        persist: true,
        properties: expectedProperties,
        sensitiveProperties: {
          ...expectedSensitiveProperties,
          error: mockErrorMessage,
        },
      });

      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledWith(
        expectedUniqueId,
        {
          properties: expectedProperties,
          sensitiveProperties: {
            ...expectedSensitiveProperties,
            error: mockErrorMessage,
          },
        },
      );

      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledTimes(1);
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledWith(expectedUniqueId);
    });

    it('should create, update, finalize event fragment with blockaid', async () => {
      const mockErrorMessage = 'Unexpected error';
      mockTransactionMetaWithBlockaid.txReceipt = {
        gasUsed: '0x123',
        status: '0x0',
      };
      mockTransactionMetaWithBlockaid.submittedTime = 123;

      await handleTransactionFailed(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMetaWithBlockaid,
        actionId: mockActionId,
        error: mockErrorMessage,
      } as any);

      const expectedUniqueId = 'transaction-submitted-1';

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.finalized,
        uniqueIdentifier: expectedUniqueId,
        persist: true,
        properties: {
          ...expectedProperties,
          ui_customizations: ['flagged_as_malicious'],
          security_alert_reason: BlockaidReason.maliciousDomain,
          security_alert_response: 'Malicious',
          ppom_eth_call_count: 5,
          ppom_eth_getCode_count: 3,
        },
        sensitiveProperties: {
          ...expectedSensitiveProperties,
          error: mockErrorMessage,
        },
      });

      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledWith(
        expectedUniqueId,
        {
          properties: {
            ...expectedProperties,
            ui_customizations: ['flagged_as_malicious'],
            security_alert_reason: BlockaidReason.maliciousDomain,
            security_alert_response: 'Malicious',
            ppom_eth_call_count: 5,
            ppom_eth_getCode_count: 3,
          },
          sensitiveProperties: {
            ...expectedSensitiveProperties,
            error: mockErrorMessage,
          },
        },
      );

      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledTimes(1);
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledWith(expectedUniqueId);
    });

    it('should append error to event properties', async () => {
      const mockErrorMessage = 'Unexpected error';

      await handleTransactionFailed(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta,
        actionId: mockActionId,
        error: mockErrorMessage,
      } as any);

      const expectedUniqueId = 'transaction-submitted-1';

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.finalized,
        uniqueIdentifier: expectedUniqueId,
        persist: true,
        properties: expectedProperties,
        sensitiveProperties: {
          ...expectedSensitiveProperties,
          error: mockErrorMessage,
        },
      });

      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledWith(
        expectedUniqueId,
        {
          properties: expectedProperties,
          sensitiveProperties: {
            ...expectedSensitiveProperties,
            error: mockErrorMessage,
          },
        },
      );

      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledTimes(1);
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledWith(expectedUniqueId);
    });
  });

  describe('handleTransactionConfirmed', () => {
    it('should return if transaction meta is not defined', async () => {
      await handleTransactionConfirmed(
        mockTransactionMetricsRequest,
        {} as any,
      );
      expect(
        mockTransactionMetricsRequest.createEventFragment,
      ).not.toBeCalled();
      expect(
        mockTransactionMetricsRequest.updateEventFragment,
      ).not.toBeCalled();
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).not.toBeCalled();
    });

    it('should create, update, finalize event fragment', async () => {
      mockTransactionMeta.txReceipt = {
        gasUsed: '0x123',
        status: '0x0',
      };
      mockTransactionMeta.submittedTime = 123;

      await handleTransactionConfirmed(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta,
        actionId: mockActionId,
      } as any);

      const expectedUniqueId = 'transaction-submitted-1';

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.finalized,
        uniqueIdentifier: expectedUniqueId,
        persist: true,
        properties: expectedProperties,
        sensitiveProperties: {
          ...expectedSensitiveProperties,
          completion_time: expect.any(String),
          gas_used: '0.000000291',
          status: METRICS_STATUS_FAILED,
        },
      });

      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledWith(
        expectedUniqueId,
        {
          properties: expectedProperties,
          sensitiveProperties: {
            ...expectedSensitiveProperties,
            completion_time: expect.any(String),
            gas_used: '0.000000291',
            status: METRICS_STATUS_FAILED,
          },
        },
      );

      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledTimes(1);
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledWith(expectedUniqueId);
    });

    it('should create, update, finalize event fragment with blockaid', async () => {
      mockTransactionMetaWithBlockaid.txReceipt = {
        gasUsed: '0x123',
        status: '0x0',
      };
      mockTransactionMetaWithBlockaid.submittedTime = 123;

      await handleTransactionConfirmed(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMetaWithBlockaid,
        actionId: mockActionId,
      } as any);

      const expectedUniqueId = 'transaction-submitted-1';

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.finalized,
        uniqueIdentifier: expectedUniqueId,
        persist: true,
        properties: {
          ...expectedProperties,
          ui_customizations: ['flagged_as_malicious'],
          security_alert_reason: BlockaidReason.maliciousDomain,
          security_alert_response: 'Malicious',
          ppom_eth_call_count: 5,
          ppom_eth_getCode_count: 3,
        },
        sensitiveProperties: {
          ...expectedSensitiveProperties,
          completion_time: expect.any(String),
          gas_used: '0.000000291',
          status: METRICS_STATUS_FAILED,
        },
      });

      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledWith(
        expectedUniqueId,
        {
          properties: {
            ...expectedProperties,
            ui_customizations: ['flagged_as_malicious'],
            security_alert_reason: BlockaidReason.maliciousDomain,
            security_alert_response: 'Malicious',
            ppom_eth_call_count: 5,
            ppom_eth_getCode_count: 3,
          },
          sensitiveProperties: {
            ...expectedSensitiveProperties,
            completion_time: expect.any(String),
            gas_used: '0.000000291',
            status: METRICS_STATUS_FAILED,
          },
        },
      );

      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledTimes(1);
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledWith(expectedUniqueId);
    });
  });

  describe('handleTransactionDropped', () => {
    it('should return if transaction meta is not defined', async () => {
      await handleTransactionDropped(mockTransactionMetricsRequest, {} as any);
      expect(
        mockTransactionMetricsRequest.createEventFragment,
      ).not.toBeCalled();
      expect(
        mockTransactionMetricsRequest.updateEventFragment,
      ).not.toBeCalled();
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).not.toBeCalled();
    });

    it('should create, update, finalize event fragment', async () => {
      await handleTransactionDropped(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta,
        actionId: mockActionId,
      } as any);

      const expectedUniqueId = 'transaction-submitted-1';

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.finalized,
        uniqueIdentifier: expectedUniqueId,
        persist: true,
        properties: expectedProperties,
        sensitiveProperties: {
          ...expectedSensitiveProperties,
          dropped: true,
          transaction_replaced: 'other',
        },
      });

      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledWith(
        expectedUniqueId,
        {
          properties: expectedProperties,
          sensitiveProperties: {
            ...expectedSensitiveProperties,
            dropped: true,
            transaction_replaced: 'other',
          },
        },
      );

      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledTimes(1);
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledWith(expectedUniqueId);
    });

    it('should create, update, finalize event fragment with blockaid', async () => {
      await handleTransactionDropped(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMetaWithBlockaid,
        actionId: mockActionId,
      } as any);

      const expectedUniqueId = 'transaction-submitted-1';

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.finalized,
        uniqueIdentifier: expectedUniqueId,
        persist: true,
        properties: {
          ...expectedProperties,
          ui_customizations: ['flagged_as_malicious'],
          security_alert_reason: BlockaidReason.maliciousDomain,
          security_alert_response: 'Malicious',
          ppom_eth_call_count: 5,
          ppom_eth_getCode_count: 3,
        },
        sensitiveProperties: {
          ...expectedSensitiveProperties,
          dropped: true,
          transaction_replaced: 'other',
        },
      });

      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledWith(
        expectedUniqueId,
        {
          properties: {
            ...expectedProperties,
            ui_customizations: ['flagged_as_malicious'],
            security_alert_reason: BlockaidReason.maliciousDomain,
            security_alert_response: 'Malicious',
            ppom_eth_call_count: 5,
            ppom_eth_getCode_count: 3,
          },
          sensitiveProperties: {
            ...expectedSensitiveProperties,
            dropped: true,
            transaction_replaced: 'other',
          },
        },
      );

      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledTimes(1);
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledWith(expectedUniqueId);
    });
  });

  describe('handleTransactionRejected', () => {
    it('should return if transaction meta is not defined', async () => {
      await handleTransactionRejected(mockTransactionMetricsRequest, {} as any);
      expect(
        mockTransactionMetricsRequest.createEventFragment,
      ).not.toBeCalled();
      expect(
        mockTransactionMetricsRequest.updateEventFragment,
      ).not.toBeCalled();
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).not.toBeCalled();
    });

    it('should create, update, finalize event fragment', async () => {
      await handleTransactionRejected(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta,
        actionId: mockActionId,
      } as any);

      const expectedUniqueId = 'transaction-added-1';

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.approved,
        failureEvent: TransactionMetaMetricsEvent.rejected,
        uniqueIdentifier: expectedUniqueId,
        persist: true,
        properties: expectedProperties,
        sensitiveProperties: expectedSensitiveProperties,
      });

      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledWith(
        expectedUniqueId,
        {
          properties: expectedProperties,
          sensitiveProperties: expectedSensitiveProperties,
        },
      );

      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledTimes(1);
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledWith(expectedUniqueId, {
        abandoned: true,
      });
    });

    it('should create, update, finalize event fragment with blockaid', async () => {
      await handleTransactionRejected(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMetaWithBlockaid,
        actionId: mockActionId,
      } as any);

      const expectedUniqueId = 'transaction-added-1';

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.approved,
        failureEvent: TransactionMetaMetricsEvent.rejected,
        uniqueIdentifier: expectedUniqueId,
        persist: true,
        properties: {
          ...expectedProperties,
          ui_customizations: ['flagged_as_malicious'],
          security_alert_reason: BlockaidReason.maliciousDomain,
          security_alert_response: 'Malicious',
          ppom_eth_call_count: 5,
          ppom_eth_getCode_count: 3,
        },
        sensitiveProperties: expectedSensitiveProperties,
      });

      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledWith(
        expectedUniqueId,
        {
          properties: {
            ...expectedProperties,
            ui_customizations: ['flagged_as_malicious'],
            security_alert_reason: BlockaidReason.maliciousDomain,
            security_alert_response: 'Malicious',
            ppom_eth_call_count: 5,
            ppom_eth_getCode_count: 3,
          },
          sensitiveProperties: expectedSensitiveProperties,
        },
      );

      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledTimes(1);
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toBeCalledWith(expectedUniqueId, {
        abandoned: true,
      });
    });
  });

  describe('handleTransactionSubmitted', () => {
    it('should return if transaction meta is not defined', async () => {
      await handleTransactionSubmitted(
        mockTransactionMetricsRequest,
        {} as any,
      );
      expect(
        mockTransactionMetricsRequest.createEventFragment,
      ).not.toBeCalled();
    });

    it('should only create event fragment', async () => {
      await handleTransactionSubmitted(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta as any,
        actionId: mockActionId,
      });

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        initialEvent: TransactionMetaMetricsEvent.submitted,
        successEvent: TransactionMetaMetricsEvent.finalized,
        uniqueIdentifier: 'transaction-submitted-1',
        persist: true,
        properties: expectedProperties,
        sensitiveProperties: expectedSensitiveProperties,
      });

      expect(
        mockTransactionMetricsRequest.updateEventFragment,
      ).not.toBeCalled();
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).not.toBeCalled();
    });
  });
});
