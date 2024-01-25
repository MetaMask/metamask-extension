import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../shared/constants/security-provider';
import { getBlockaidMetricsProps, getMethodName } from './metrics';

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

const mockTransaction = {
  securityAlertResponse: {
    result_type: BlockaidResultType.Malicious,
    reason: BlockaidReason.setApprovalForAll,
    providerRequestsCount: {
      eth_call: 5,
      eth_getCode: 3,
    },
    features: [],
  },
};
const mockedTransaction = jest.mocked(mockTransaction);

describe('getBlockaidMetricsProps', () => {
  it('returns empty object when securityAlertResponse is not defined', () => {
    const result = getBlockaidMetricsProps({});
    expect(result).toStrictEqual({});
  });

  it('returns additionalParams object when securityAlertResponse defined', () => {
    const result = getBlockaidMetricsProps(mockedTransaction);
    expect(result).toStrictEqual({
      ppom_eth_call_count: 5,
      ppom_eth_getCode_count: 3,
      security_alert_reason: BlockaidReason.setApprovalForAll,
      security_alert_response: BlockaidResultType.Malicious,
      ui_customizations: ['flagged_as_malicious'],
    });
  });

  it('does not return eth call counts if providerRequestsCount is empty', () => {
    mockedTransaction.securityAlertResponse.providerRequestsCount = {};
    const result = getBlockaidMetricsProps(mockedTransaction);

    expect(result).toStrictEqual({
      ui_customizations: ['flagged_as_malicious'],
      security_alert_response: BlockaidResultType.Malicious,
      security_alert_reason: BlockaidReason.setApprovalForAll,
    });
  });

  it('does not return eth call counts if providerRequestsCount is undefined', () => {
    mockedTransaction.securityAlertResponse.providerRequestsCount = undefined;
    const result = getBlockaidMetricsProps(mockedTransaction);

    expect(result).toStrictEqual({
      ui_customizations: ['flagged_as_malicious'],
      security_alert_response: BlockaidResultType.Malicious,
      security_alert_reason: BlockaidReason.setApprovalForAll,
    });
  });
});
