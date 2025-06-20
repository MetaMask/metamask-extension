import { Provider } from '@metamask/network-controller';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import {
  createTestProviderTools,
  getTestAccounts,
} from '../../../../test/stub/provider';
import {
  MESSAGE_TYPE,
  ORIGIN_METAMASK,
} from '../../../../shared/constants/app';
import {
  AssetType,
  EIP5792ErrorCode,
  NATIVE_TOKEN_ADDRESS,
  TokenStandard,
  TransactionMetaMetricsEvent,
} from '../../../../shared/constants/transaction';
import {
  MetaMetricsTransactionEventSource,
  MetaMetricsEventCategory,
  MetaMetricsEventUiCustomization,
  MetaMetricsEventTransactionEstimateType,
} from '../../../../shared/constants/metametrics';
import { TRANSACTION_ENVELOPE_TYPE_NAMES } from '../../../../shared/lib/transactions-controller-utils';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../shared/constants/security-provider';
import { decimalToHex } from '../../../../shared/modules/conversion.utils';
import {
  TransactionEventPayload,
  TransactionMetaEventPayload,
  TransactionMetricsRequest,
} from '../../../../shared/types/metametrics';
import { GAS_FEE_TOKEN_MOCK } from '../../../../test/data/confirmations/gas';
import {
  handleTransactionAdded,
  handleTransactionApproved,
  handleTransactionConfirmed,
  handleTransactionDropped,
  handleTransactionFailed,
  handleTransactionRejected,
  handleTransactionSubmitted,
  METRICS_STATUS_FAILED,
} from './metrics';

const ADDRESS_MOCK = '0x1234567890123456789012345678901234567890';
const ADDRESS_2_MOCK = '0x1234567890123456789012345678901234567891';
const ADDRESS_3_MOCK = '0x1234567890123456789012345678901234567892';
const METHOD_NAME_MOCK = 'testMethod1';
const METHOD_NAME_2_MOCK = 'testMethod2';

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
  getAccountBalance: jest.fn(),
  getAccountType: jest.fn(),
  getDeviceModel: jest.fn(),
  getHardwareTypeForMetric: jest.fn(),
  getEIP1559GasFeeEstimates: jest.fn(),
  getSelectedAddress: jest.fn(),
  getParticipateInMetrics: jest.fn(),
  getTokenStandardAndDetails: jest.fn(),
  getTransaction: jest.fn(),
  provider: provider as Provider,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapAndHardwareMessenger: jest.fn() as any,
  trackEvent: jest.fn(),
  getIsSmartTransaction: jest.fn(),
  getSmartTransactionByMinedTxHash: jest.fn(),
  getMethodData: jest.fn(),
  getIsConfirmationAdvancedDetailsOpen: jest.fn(),
  getHDEntropyIndex: jest.fn(),
  getNetworkRpcUrl: jest.fn(),
} as TransactionMetricsRequest;

describe('Transaction metrics', () => {
  let fromAccount,
    mockChainId,
    mockNetworkId,
    mockTransactionMeta: TransactionMeta,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockTransactionMetaWithBlockaid: any,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expectedProperties: any,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expectedSensitiveProperties: any,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockActionId: any;

  beforeEach(() => {
    fromAccount = getTestAccounts()[0];
    mockChainId = '0x5' as const;
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
      networkClientId: 'testNetworkClientId',
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
      api_method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
      asset_type: AssetType.native,
      chain_id: mockChainId,
      device_model: undefined,
      eip_1559_version: '0',
      eip7702_upgrade_transaction: false,
      gas_edit_attempted: 'none',
      gas_estimation_failed: false,
      gas_fee_selected: undefined,
      gas_insufficient_native_asset: true,
      gas_paid_with: undefined,
      gas_payment_tokens_available: undefined,
      is_smart_transaction: undefined,
      gas_edit_type: 'none',
      network: mockNetworkId,
      referrer: ORIGIN_METAMASK,
      source: MetaMetricsTransactionEventSource.User,
      status: 'unapproved',
      token_standard: TokenStandard.none,
      transaction_speed_up: false,
      transaction_type: TransactionType.simpleSend,
      ui_customizations: ['redesigned_confirmation'],
      transaction_advanced_view: undefined,
      transaction_contract_method: [],
      transaction_internal_id: '1',
    };

    expectedSensitiveProperties = {
      default_estimate: MetaMetricsEventTransactionEstimateType.DefaultEstimate,
      default_gas: '0.000031501',
      default_gas_price: '2',
      first_seen: 1624408066355,
      gas_limit: '0x7b0d',
      gas_price: '2',
      transaction_contract_address: [],
      transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
      transaction_replaced: undefined,
    };

    jest.clearAllMocks();
  });

  describe('handleTransactionAdded', () => {
    it('should return if transaction meta is not defined', async () => {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await handleTransactionAdded(mockTransactionMetricsRequest, {} as any);
      expect(
        mockTransactionMetricsRequest.createEventFragment,
      ).not.toBeCalled();
    });

    it('should create event fragment', async () => {
      await handleTransactionAdded(mockTransactionMetricsRequest, {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      mockTransactionMeta.simulationFails = {
        reason: 'test',
        debug: {},
      };

      await handleTransactionAdded(mockTransactionMetricsRequest, {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          ui_customizations: [
            'gas_estimation_failed',
            'redesigned_confirmation',
          ],
          gas_estimation_failed: true,
        },
        sensitiveProperties: expectedSensitiveProperties,
      });
    });

    it('should create event fragment with blockaid', async () => {
      await handleTransactionAdded(mockTransactionMetricsRequest, {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          ui_customizations: [
            'flagged_as_malicious',
            'redesigned_confirmation',
          ],
          ppom_eth_call_count: 5,
          ppom_eth_getCode_count: 3,
        },
        sensitiveProperties: expectedSensitiveProperties,
      });
    });
  });

  describe('handleTransactionApproved', () => {
    it('should return if transaction meta is not defined', async () => {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          ui_customizations: [
            'flagged_as_malicious',
            'redesigned_confirmation',
          ],
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
            ui_customizations: [
              'flagged_as_malicious',
              'redesigned_confirmation',
            ],
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
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          ui_customizations: [
            'flagged_as_malicious',
            'redesigned_confirmation',
          ],
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
            ui_customizations: [
              'flagged_as_malicious',
              'redesigned_confirmation',
            ],
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        ...mockTransactionMeta,
        actionId: mockActionId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        ...mockTransactionMetaWithBlockaid,
        actionId: mockActionId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          ui_customizations: [
            'flagged_as_malicious',
            'redesigned_confirmation',
          ],
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
            ui_customizations: [
              'flagged_as_malicious',
              'redesigned_confirmation',
            ],
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

    it('should create, update, finalize event fragment with transaction_contract_address', async () => {
      mockTransactionMeta.txReceipt = {
        gasUsed: '0x123',
        status: '0x0',
      };
      mockTransactionMeta.submittedTime = 123;
      mockTransactionMeta.status = TransactionStatus.confirmed;
      mockTransactionMeta.type = TransactionType.contractInteraction;
      const expectedUniqueId = 'transaction-submitted-1';
      const properties = {
        ...expectedProperties,
        status: TransactionStatus.confirmed,
        transaction_type: TransactionType.contractInteraction,
        asset_type: AssetType.unknown,
        ui_customizations: [
          MetaMetricsEventUiCustomization.RedesignedConfirmation,
        ],
        is_smart_transaction: undefined,
        transaction_advanced_view: undefined,
        rpc_domain: 'private',
      };
      const sensitiveProperties = {
        ...expectedSensitiveProperties,
        transaction_contract_address: [
          '0x1678a085c290ebd122dc42cba69373b5953b831d',
        ],
        completion_time: expect.any(String),
        gas_used: '0.000000291',
        status: METRICS_STATUS_FAILED,
      };

      (
        mockTransactionMetricsRequest.getNetworkRpcUrl as jest.Mock
      ).mockReturnValue('https://example.com');

      await handleTransactionConfirmed(mockTransactionMetricsRequest, {
        ...mockTransactionMeta,
        actionId: mockActionId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith({
        actionId: mockActionId,
        category: MetaMetricsEventCategory.Transactions,
        successEvent: TransactionMetaMetricsEvent.finalized,
        uniqueIdentifier: expectedUniqueId,
        persist: true,
        properties,
        sensitiveProperties,
      });
      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledTimes(
        1,
      );
      expect(mockTransactionMetricsRequest.updateEventFragment).toBeCalledWith(
        expectedUniqueId,
        {
          properties,
          sensitiveProperties,
        },
      );
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockTransactionMetricsRequest.finalizeEventFragment,
      ).toHaveBeenCalledWith(expectedUniqueId);
    });

    it('should create, update, finalize event fragment with completion_time_onchain', async () => {
      mockTransactionMeta.txReceipt = {
        gasUsed: '0x123',
        status: '0x0',
      };
      mockTransactionMeta.blockTimestamp = decimalToHex(124);
      mockTransactionMeta.submittedTime = 123123;

      await handleTransactionConfirmed(mockTransactionMetricsRequest, {
        ...mockTransactionMeta,
        actionId: mockActionId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          completion_time_onchain: '0.88',
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
            completion_time_onchain: '0.88',
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
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          ui_customizations: [
            'flagged_as_malicious',
            'redesigned_confirmation',
          ],
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
            ui_customizations: [
              'flagged_as_malicious',
              'redesigned_confirmation',
            ],
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
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          ui_customizations: [
            'flagged_as_malicious',
            'redesigned_confirmation',
          ],
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
            ui_customizations: [
              'flagged_as_malicious',
              'redesigned_confirmation',
            ],
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

    it('includes if upgrade was rejected', async () => {
      await handleTransactionRejected(mockTransactionMetricsRequest, {
        transactionMeta: {
          ...mockTransactionMeta,
          txParams: {
            ...mockTransactionMeta.txParams,
            authorizationList: [{}],
          },
          error: {
            code: EIP5792ErrorCode.RejectedUpgrade,
          },
          status: TransactionStatus.rejected,
        } as unknown as TransactionMeta,
      });

      expect(mockTransactionMetricsRequest.createEventFragment).toBeCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            eip7702_upgrade_rejection: true,
          }),
        }),
      );
    });
  });

  describe('handleTransactionSubmitted', () => {
    it('should return if transaction meta is not defined', async () => {
      await handleTransactionSubmitted(
        mockTransactionMetricsRequest,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {} as any,
      );
      expect(
        mockTransactionMetricsRequest.createEventFragment,
      ).not.toBeCalled();
    });

    it('should only create event fragment', async () => {
      await handleTransactionSubmitted(mockTransactionMetricsRequest, {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // @ts-expect-error This function is missing from the Mocha type definitions
  describe.each([
    ['if added', handleTransactionAdded],
    ['if approved', handleTransactionApproved],
    ['if dropped', handleTransactionDropped],
    ['if failed', handleTransactionFailed],
    ['if rejected', handleTransactionRejected],
    ['if submitted', handleTransactionSubmitted],
    [
      'if confirmed',
      (request: TransactionMetricsRequest, args: TransactionEventPayload) =>
        handleTransactionConfirmed(
          request,
          args.transactionMeta as TransactionMetaEventPayload,
        ),
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ])('%s', (_title: string, fn: any) => {
    it('includes batch properties', async () => {
      const transactionMeta = {
        ...mockTransactionMeta,
        delegationAddress: ADDRESS_3_MOCK,
        nestedTransactions: [
          {
            to: ADDRESS_MOCK,
            data: '0x1',
            type: TransactionType.contractInteraction,
          },
          {
            to: ADDRESS_2_MOCK,
            data: '0x2',
            type: TransactionType.tokenMethodApprove,
          },
        ],
        txParams: {
          ...mockTransactionMeta.txParams,
          authorizationList: [
            {
              address: ADDRESS_3_MOCK,
            },
          ],
        },
      } as TransactionMeta;

      jest
        .mocked(mockTransactionMetricsRequest.getMethodData)
        .mockResolvedValueOnce({
          name: METHOD_NAME_MOCK,
        })
        .mockResolvedValueOnce({
          name: METHOD_NAME_2_MOCK,
        });

      await fn(mockTransactionMetricsRequest, {
        transactionMeta,
      });

      const { properties, sensitiveProperties } = jest.mocked(
        mockTransactionMetricsRequest.createEventFragment,
      ).mock.calls[0][0];

      expect(properties).toStrictEqual(
        expect.objectContaining({
          api_method: MESSAGE_TYPE.WALLET_SEND_CALLS,
          batch_transaction_count: 2,
          batch_transaction_method: 'eip7702',
          eip7702_upgrade_transaction: true,
          transaction_contract_method: [METHOD_NAME_MOCK, METHOD_NAME_2_MOCK],
        }),
      );

      expect(sensitiveProperties).toStrictEqual(
        expect.objectContaining({
          account_eip7702_upgraded: ADDRESS_3_MOCK,
          transaction_contract_address: [ADDRESS_MOCK, ADDRESS_2_MOCK],
        }),
      );
    });

    it('includes gas_paid_with if selected gas fee token', async () => {
      const transactionMeta = {
        ...mockTransactionMeta,
        gasFeeTokens: [GAS_FEE_TOKEN_MOCK],
        selectedGasFeeToken: GAS_FEE_TOKEN_MOCK.tokenAddress,
      } as TransactionMeta;

      await fn(mockTransactionMetricsRequest, {
        transactionMeta,
      });

      const { properties } = jest.mocked(
        mockTransactionMetricsRequest.createEventFragment,
      ).mock.calls[0][0];

      expect(properties).toStrictEqual(
        expect.objectContaining({
          gas_paid_with: GAS_FEE_TOKEN_MOCK.symbol,
        }),
      );
    });

    it('set gas_paid_with to "pre-funded_ETH" if gas is paid using Future ETH', async () => {
      const transactionMeta = {
        ...mockTransactionMeta,
        gasFeeTokens: [
          { ...GAS_FEE_TOKEN_MOCK, tokenAddress: NATIVE_TOKEN_ADDRESS },
        ],
        selectedGasFeeToken: NATIVE_TOKEN_ADDRESS,
      } as TransactionMeta;

      await fn(mockTransactionMetricsRequest, {
        transactionMeta,
      });

      const { properties } = jest.mocked(
        mockTransactionMetricsRequest.createEventFragment,
      ).mock.calls[0][0];

      expect(properties).toStrictEqual(
        expect.objectContaining({
          gas_paid_with: 'pre-funded_ETH',
        }),
      );
    });

    it('includes gas_payment_tokens_available if gas fee tokens', async () => {
      const transactionMeta = {
        ...mockTransactionMeta,
        gasFeeTokens: [
          GAS_FEE_TOKEN_MOCK,
          { ...GAS_FEE_TOKEN_MOCK, symbol: 'DAI' },
        ],
      } as TransactionMeta;

      await fn(mockTransactionMetricsRequest, {
        transactionMeta,
      });

      const { properties } = jest.mocked(
        mockTransactionMetricsRequest.createEventFragment,
      ).mock.calls[0][0];

      expect(properties).toStrictEqual(
        expect.objectContaining({
          gas_payment_tokens_available: [GAS_FEE_TOKEN_MOCK.symbol, 'DAI'],
        }),
      );
    });

    it('includes transasction_type as gas_payment', async () => {
      const transactionMeta = {
        ...mockTransactionMeta,
        batchId: '0x123',
      } as TransactionMeta;

      await fn(mockTransactionMetricsRequest, {
        transactionMeta,
      });

      const { properties } = jest.mocked(
        mockTransactionMetricsRequest.createEventFragment,
      ).mock.calls[0][0];

      expect(properties).toStrictEqual(
        expect.objectContaining({
          transaction_type: 'gas_payment',
        }),
      );
    });

    it('includes gas_insufficient_native_asset as true if insufficient native balance', async () => {
      const transactionMeta = {
        ...mockTransactionMeta,
        txParams: {
          ...mockTransactionMeta.txParams,
          gas: toHex(10),
          maxFeePerGas: toHex(5),
          value: toHex(3),
        },
      } as TransactionMeta;

      jest
        .mocked(mockTransactionMetricsRequest.getAccountBalance)
        .mockReturnValueOnce(toHex(52));

      await fn(mockTransactionMetricsRequest, {
        transactionMeta,
      });

      const { properties } = jest.mocked(
        mockTransactionMetricsRequest.createEventFragment,
      ).mock.calls[0][0];

      expect(properties).toStrictEqual(
        expect.objectContaining({
          gas_insufficient_native_asset: true,
        }),
      );
    });

    it('includes gas_insufficient_native_asset as false if sufficient native balance', async () => {
      const transactionMeta = {
        ...mockTransactionMeta,
        txParams: {
          ...mockTransactionMeta.txParams,
          gas: toHex(10),
          maxFeePerGas: toHex(5),
          value: toHex(3),
        },
      } as TransactionMeta;

      jest
        .mocked(mockTransactionMetricsRequest.getAccountBalance)
        .mockReturnValueOnce(toHex(53));

      await fn(mockTransactionMetricsRequest, {
        transactionMeta,
      });

      const { properties } = jest.mocked(
        mockTransactionMetricsRequest.createEventFragment,
      ).mock.calls[0][0];

      expect(properties).toStrictEqual(
        expect.objectContaining({
          gas_insufficient_native_asset: false,
        }),
      );
    });
  });
});
