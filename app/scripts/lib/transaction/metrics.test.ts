import { Provider } from '@metamask/network-controller';
import {
  createTestProviderTools,
  getTestAccounts,
} from '../../../../test/stub/provider';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import {
  TransactionType,
  TransactionStatus,
  AssetType,
  TokenStandard,
  TransactionMetaMetricsEvent,
} from '../../../../shared/constants/transaction';
import {
  MetaMetricsTransactionEventSource,
  MetaMetricsEventCategory,
} from '../../../../shared/constants/metametrics';
import { TRANSACTION_ENVELOPE_TYPE_NAMES } from '../../../../shared/lib/transactions-controller-utils';
///: BEGIN:ONLY_INCLUDE_IN(blockaid)
import { BlockaidReason } from '../../../../shared/constants/security-provider';
///: END:ONLY_INCLUDE_IN(blockaid)
import {
  onTransactionAdded,
  onTransactionApproved,
  onTransactionDropped,
  onTransactionFinalized,
  onTransactionRejected,
  onTransactionSubmitted,
  METRICS_STATUS_FAILED,
} from './metrics';

const providerResultStub = {
  eth_getCode: '0x123',
};
const { provider } = createTestProviderTools({
  scaffold: providerResultStub,
  networkId: '5',
  chainId: '5',
});

jest.mock('./snap-keyring/metrics', () => {
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
};

describe('Transaction metrics', () => {
  let fromAccount,
    mockChainId,
    mockNetworkId,
    mockTransactionMeta,
    mockActionId;

  beforeEach(() => {
    fromAccount = getTestAccounts()[0];
    mockChainId = '5';
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
      metamaskNetworkId: mockNetworkId,
      defaultGasEstimates: {
        gas: '0x7b0d',
        gasPrice: '0x77359400',
      },
      securityProviderResponse: {
        flagAsDangerous: 0,
      },
    };

    jest.clearAllMocks();
  });

  describe('onTransactionAdded', () => {
    it('should return if transaction meta is not defined', async () => {
      await onTransactionAdded(mockTransactionMetricsRequest, {} as any);
      expect(
        mockTransactionMetricsRequest.createEventFragment,
      ).not.toBeCalled();
    });

    it('should create event fragment', async () => {
      await onTransactionAdded(mockTransactionMetricsRequest, {
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
          account_snap_type: 'snaptype',
          account_snap_version: 'snapversion',
          account_type: undefined,
          asset_type: AssetType.native,
          chain_id: mockChainId,
          device_model: undefined,
          eip_1559_version: '0',
          gas_edit_attempted: 'none',
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
        },
        sensitiveProperties: {
          default_gas: '0.000031501',
          default_gas_price: '2',
          first_seen: 1624408066355,
          gas_limit: '0x7b0d',
          gas_price: '2',
          transaction_contract_method: undefined,
          transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
          transaction_replaced: undefined,
        },
      });
    });
  });

  describe('onTransactionApproved', () => {
    it('should return if transaction meta is not defined', async () => {
      await onTransactionApproved(mockTransactionMetricsRequest, {} as any);
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
      await onTransactionApproved(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta as any,
        actionId: mockActionId,
      });

      const expectedUniqueId = 'transaction-added-1';
      const expectedProperties = {
        account_snap_type: 'snaptype',
        account_snap_version: 'snapversion',
        account_type: undefined,
        asset_type: AssetType.native,
        chain_id: mockChainId,
        device_model: undefined,
        eip_1559_version: '0',
        gas_edit_attempted: 'none',
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

      const expectedSensitiveProperties = {
        default_gas: '0.000031501',
        default_gas_price: '2',
        first_seen: 1624408066355,
        gas_limit: '0x7b0d',
        gas_price: '2',
        transaction_contract_method: undefined,
        transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
        transaction_replaced: undefined,
      };

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
  });

  describe('onTransactionFinalized', () => {
    it('should return if transaction meta is not defined', async () => {
      await onTransactionFinalized(mockTransactionMetricsRequest, {} as any);
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

      await onTransactionFinalized(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta,
        actionId: mockActionId,
      } as any);

      const expectedUniqueId = 'transaction-submitted-1';
      const expectedProperties = {
        account_snap_type: 'snaptype',
        account_snap_version: 'snapversion',
        account_type: undefined,
        asset_type: AssetType.native,
        chain_id: mockChainId,
        device_model: undefined,
        eip_1559_version: '0',
        gas_edit_attempted: 'none',
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

      const expectedSensitiveProperties = {
        completion_time: expect.any(String),
        default_gas: '0.000031501',
        default_gas_price: '2',
        first_seen: 1624408066355,
        gas_limit: '0x7b0d',
        gas_price: '2',
        gas_used: '0.000000291',
        transaction_contract_method: undefined,
        transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
        transaction_replaced: undefined,
        status: METRICS_STATUS_FAILED,
      };

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

    it('should append error to event properties', async () => {
      const mockErrorMessage = 'Unexpected error';

      await onTransactionFinalized(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta,
        actionId: mockActionId,
        error: mockErrorMessage,
      } as any);

      const expectedUniqueId = 'transaction-submitted-1';
      const expectedProperties = {
        account_snap_type: 'snaptype',
        account_snap_version: 'snapversion',
        account_type: undefined,
        asset_type: AssetType.native,
        chain_id: mockChainId,
        device_model: undefined,
        eip_1559_version: '0',
        gas_edit_attempted: 'none',
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

      const expectedSensitiveProperties = {
        default_gas: '0.000031501',
        default_gas_price: '2',
        error: mockErrorMessage,
        first_seen: 1624408066355,
        gas_limit: '0x7b0d',
        gas_price: '2',
        transaction_contract_method: undefined,
        transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
        transaction_replaced: undefined,
      };

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
  });

  describe('onTransactionDropped', () => {
    it('should return if transaction meta is not defined', async () => {
      await onTransactionDropped(mockTransactionMetricsRequest, {} as any);
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
      await onTransactionDropped(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta,
        actionId: mockActionId,
      } as any);

      const expectedUniqueId = 'transaction-submitted-1';
      const expectedProperties = {
        account_snap_type: 'snaptype',
        account_snap_version: 'snapversion',
        account_type: undefined,
        asset_type: AssetType.native,
        chain_id: mockChainId,
        device_model: undefined,
        eip_1559_version: '0',
        gas_edit_attempted: 'none',
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

      const expectedSensitiveProperties = {
        default_gas: '0.000031501',
        default_gas_price: '2',
        dropped: true,
        first_seen: 1624408066355,
        gas_limit: '0x7b0d',
        gas_price: '2',
        transaction_contract_method: undefined,
        transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
        transaction_replaced: 'other',
      };

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
  });

  describe('onTransactionRejected', () => {
    it('should return if transaction meta is not defined', async () => {
      await onTransactionRejected(mockTransactionMetricsRequest, {} as any);
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
      await onTransactionRejected(mockTransactionMetricsRequest, {
        transactionMeta: mockTransactionMeta,
        actionId: mockActionId,
      } as any);

      const expectedUniqueId = 'transaction-added-1';
      const expectedProperties = {
        account_snap_type: 'snaptype',
        account_snap_version: 'snapversion',
        account_type: undefined,
        asset_type: AssetType.native,
        chain_id: mockChainId,
        device_model: undefined,
        eip_1559_version: '0',
        gas_edit_attempted: 'none',
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

      const expectedSensitiveProperties = {
        default_gas: '0.000031501',
        default_gas_price: '2',
        first_seen: 1624408066355,
        gas_limit: '0x7b0d',
        gas_price: '2',
        transaction_contract_method: undefined,
        transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
        transaction_replaced: undefined,
      };

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
  });

  describe('onTransactionSubmitted', () => {
    it('should return if transaction meta is not defined', async () => {
      await onTransactionSubmitted(mockTransactionMetricsRequest, {} as any);
      expect(
        mockTransactionMetricsRequest.createEventFragment,
      ).not.toBeCalled();
    });

    it('should only create event fragment', async () => {
      await onTransactionSubmitted(mockTransactionMetricsRequest, {
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
        properties: {
          account_snap_type: 'snaptype',
          account_snap_version: 'snapversion',
          account_type: undefined,
          asset_type: AssetType.native,
          chain_id: mockChainId,
          device_model: undefined,
          eip_1559_version: '0',
          gas_edit_attempted: 'none',
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
        },
        sensitiveProperties: {
          default_gas: '0.000031501',
          default_gas_price: '2',
          first_seen: 1624408066355,
          gas_limit: '0x7b0d',
          gas_price: '2',
          transaction_contract_method: undefined,
          transaction_envelope_type: TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
          transaction_replaced: undefined,
        },
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
