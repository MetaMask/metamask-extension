import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../shared/constants/security-provider';
import {
  getBlockaidMetricsProps,
  getMethodName,
  getSmartTransactionMetricsProperties,
} from './metrics';

describe('getMethodName', () => {
  it('gets correct method names', () => {
    expect(getMethodName(undefined)).toStrictEqual('');
    expect(getMethodName({})).toStrictEqual('');
    expect(getMethodName('confirm')).toStrictEqual('confirm');
    expect(getMethodName('balanceOf')).toStrictEqual('balance Of');
    expect(getMethodName('ethToTokenSwapInput')).toStrictEqual(
      'eth To Token Swap Input',
    );
  });
});

const securityAlertResponse = {
  result_type: BlockaidResultType.Malicious,
  reason: BlockaidReason.setApprovalForAll,
  features: [],
};

describe('getBlockaidMetricsProps', () => {
  it('returns an empty object when securityAlertResponse is not defined', () => {
    const result = getBlockaidMetricsProps({});
    expect(result).toStrictEqual({});
  });

  it('returns metric props when securityAlertResponse defined', () => {
    const result = getBlockaidMetricsProps({
      securityAlertResponse,
    });
    expect(result).toStrictEqual({
      security_alert_reason: BlockaidReason.setApprovalForAll,
      security_alert_response: BlockaidResultType.Malicious,
      ui_customizations: ['flagged_as_malicious'],
    });
  });

  it('includes not applicable reason or result type when they are not provided', () => {
    const result = getBlockaidMetricsProps({
      securityAlertResponse: {
        ...securityAlertResponse,
        reason: null,
        result_type: null,
      },
    });

    expect(result.security_alert_reason).toBe(BlockaidReason.notApplicable);
    expect(result.security_alert_response).toBe(
      BlockaidResultType.NotApplicable,
    );
  });

  it('includes "security_alert_error" ui_customization when type is error', () => {
    const result = getBlockaidMetricsProps({
      securityAlertResponse: {
        ...securityAlertResponse,
        result_type: BlockaidResultType.Errored,
      },
    });

    expect(result).toStrictEqual({
      security_alert_reason: BlockaidReason.setApprovalForAll,
      security_alert_response: BlockaidResultType.Errored,
      ui_customizations: ['security_alert_error'],
    });
  });

  it('includes "flagged_as_malicious" ui_customization when type is malicious', () => {
    const result = getBlockaidMetricsProps({
      securityAlertResponse: {
        ...securityAlertResponse,
        result_type: BlockaidResultType.Malicious,
      },
    });

    expect(result).toStrictEqual({
      security_alert_reason: BlockaidReason.setApprovalForAll,
      security_alert_response: BlockaidResultType.Malicious,
      ui_customizations: ['flagged_as_malicious'],
    });
  });

  it('includes "flagged_as_warning" ui_customization when type is a warning', () => {
    const result = getBlockaidMetricsProps({
      securityAlertResponse: {
        ...securityAlertResponse,
        result_type: BlockaidResultType.Malicious,
      },
    });

    expect(result).toStrictEqual({
      security_alert_reason: BlockaidReason.setApprovalForAll,
      security_alert_response: BlockaidResultType.Malicious,
      ui_customizations: ['flagged_as_malicious'],
    });
  });

  it('excludes reason when type is benign', () => {
    const result = getBlockaidMetricsProps({
      securityAlertResponse: {
        ...securityAlertResponse,
        result_type: BlockaidResultType.Benign,
      },
    });

    expect(result).toStrictEqual({
      security_alert_response: BlockaidResultType.Benign,
    });
  });

  it('includes eth call counts when providerRequestsCount is provided', () => {
    const result = getBlockaidMetricsProps({
      securityAlertResponse: {
        ...securityAlertResponse,
        providerRequestsCount: {
          eth_call: 5,
          eth_getCode: 3,
        },
      },
    });

    expect(result).toStrictEqual({
      ppom_eth_call_count: 5,
      ppom_eth_getCode_count: 3,
      ui_customizations: ['flagged_as_malicious'],
      security_alert_response: BlockaidResultType.Malicious,
      security_alert_reason: BlockaidReason.setApprovalForAll,
    });
  });

  it('includes "security_alert_error" ui_customization when type is an error', () => {
    const result = getBlockaidMetricsProps({
      securityAlertResponse: {
        ...securityAlertResponse,
        result_type: BlockaidResultType.Errored,
        reason: 'error: error message',
      },
    });
    expect(result).toStrictEqual({
      ui_customizations: ['security_alert_error'],
      security_alert_response: BlockaidResultType.Errored,
      security_alert_reason: 'error: error message',
    });
  });

  it('excludes eth call counts if providerRequestsCount is empty', () => {
    const result = getBlockaidMetricsProps({
      securityAlertResponse: {
        ...securityAlertResponse,
        providerRequestsCount: {},
      },
    });

    expect(result).toStrictEqual({
      ui_customizations: ['flagged_as_malicious'],
      security_alert_response: BlockaidResultType.Malicious,
      security_alert_reason: BlockaidReason.setApprovalForAll,
    });
  });

  it('excludes eth call counts if providerRequestsCount is undefined', () => {
    const result = getBlockaidMetricsProps({
      securityAlertResponse: {
        ...securityAlertResponse,
        providerRequestsCount: undefined,
      },
    });

    expect(result).toStrictEqual({
      ui_customizations: ['flagged_as_malicious'],
      security_alert_response: BlockaidResultType.Malicious,
      security_alert_reason: BlockaidReason.setApprovalForAll,
    });
  });
});

describe('getSmartTransactionMetricsProperties', () => {
  const txHash =
    '0x0302b75dfb9fd9eb34056af031efcaee2a8cbd799ea054a85966165cd82a7356';

  it('returns all smart transaction properties', () => {
    const transactionMetricsRequest = {
      getIsSmartTransaction: () => true,
      getSmartTransactionByMinedTxHash: () => {
        return {
          statusMetadata: {
            minedHash: txHash,
            duplicated: true,
            timedOut: true,
            proxied: true,
          },
        };
      },
    };
    const transactionMeta = {
      hash: txHash,
    };

    const result = getSmartTransactionMetricsProperties(
      transactionMetricsRequest,
      transactionMeta,
    );

    expect(result).toStrictEqual({
      is_smart_transaction: true,
      smart_transaction_duplicated: true,
      smart_transaction_proxied: true,
      smart_transaction_timed_out: true,
    });
  });

  it('returns "is_smart_transaction: false" if it is not a smart transaction', () => {
    const transactionMetricsRequest = {
      getIsSmartTransaction: () => false,
    };

    const result = getSmartTransactionMetricsProperties(
      transactionMetricsRequest,
    );

    expect(result).toStrictEqual({
      is_smart_transaction: false,
    });
  });

  it('returns "is_smart_transaction: true" only if it is a smart transaction, but does not have statusMetadata', () => {
    const transactionMetricsRequest = {
      getIsSmartTransaction: () => true,
      getSmartTransactionByMinedTxHash: () => {
        return {
          statusMetadata: null,
        };
      },
    };
    const transactionMeta = {
      hash: txHash,
    };

    const result = getSmartTransactionMetricsProperties(
      transactionMetricsRequest,
      transactionMeta,
    );

    expect(result).toStrictEqual({
      is_smart_transaction: true,
    });
  });
});
