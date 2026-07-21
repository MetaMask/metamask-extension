import { MetaMetricsEventUiCustomization } from '../../../shared/constants/metametrics';
import {
  BlockaidReason,
  BlockaidResultType,
  SecurityAlertSource,
} from '../../../shared/constants/security-provider';
import { getBlockaidMetricsProps, getSwapAndSendMetricsProps } from './metrics';

const securityAlertResponse = {
  result_type: BlockaidResultType.Malicious,
  reason: BlockaidReason.setApprovalForAll,
  features: [],
  source: SecurityAlertSource.API,
};

const expectedMetricsPropsBase = {
  security_alert_reason: BlockaidReason.setApprovalForAll,
  security_alert_response: BlockaidResultType.Malicious,
  security_alert_source: SecurityAlertSource.API,
  ui_customizations: [MetaMetricsEventUiCustomization.FlaggedAsMalicious],
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
    expect(result).toStrictEqual(expectedMetricsPropsBase);
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
      ...expectedMetricsPropsBase,
      security_alert_response: BlockaidResultType.Errored,
      ui_customizations: [MetaMetricsEventUiCustomization.SecurityAlertError],
    });
  });

  it('includes "flagged_as_malicious" ui_customization when type is malicious', () => {
    const result = getBlockaidMetricsProps({
      securityAlertResponse: {
        ...securityAlertResponse,
        result_type: BlockaidResultType.Malicious,
      },
    });

    expect(result).toStrictEqual(expectedMetricsPropsBase);
  });

  it('includes "flagged_as_warning" ui_customization when type is a warning', () => {
    const result = getBlockaidMetricsProps({
      securityAlertResponse: {
        ...securityAlertResponse,
        result_type: BlockaidResultType.Malicious,
      },
    });

    expect(result).toStrictEqual(expectedMetricsPropsBase);
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
      security_alert_source: SecurityAlertSource.API,
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
      ui_customizations: [MetaMetricsEventUiCustomization.SecurityAlertError],
      security_alert_response: BlockaidResultType.Errored,
      security_alert_reason: 'error: error message',
      security_alert_source: SecurityAlertSource.API,
    });
  });

  it('includes the API source when the security alert originates from the API', () => {
    const result = getBlockaidMetricsProps({
      securityAlertResponse: {
        ...securityAlertResponse,
        source: SecurityAlertSource.API,
      },
    });

    expect(result).toStrictEqual({
      ...expectedMetricsPropsBase,
      security_alert_source: SecurityAlertSource.API,
    });
  });
});

describe('getSwapAndSendMetricsProps', () => {
  it('returns an empty object when transaction type is not swapAndSend', () => {
    const transactionMeta = {
      type: 'other',
    };
    const result = getSwapAndSendMetricsProps(transactionMeta);
    expect(result).toStrictEqual({});
  });

  it('returns the expected metrics props when transaction type is swapAndSend', () => {
    const transactionMeta = {
      type: 'swapAndSend',
      chainId: 1,
      sourceTokenAmount: '1000000000000',
      sourceTokenDecimals: 12,
      destinationTokenAmount: '200',
      destinationTokenDecimals: 2,
      sourceTokenSymbol: 'ETH',
      destinationTokenAddress: '0x123',
      destinationTokenSymbol: 'ABC',
      sourceTokenAddress: '0x456',
    };
    const expectedMetricsProps = {
      chain_id: 1,
      token_amount_source: '1',
      token_amount_dest_estimate: '2',
      token_symbol_source: 'ETH',
      token_symbol_destination: 'ABC',
      token_address_source: '0x456',
      token_address_destination: '0x123',
    };
    const result = getSwapAndSendMetricsProps(transactionMeta);
    expect(result).toStrictEqual(expectedMetricsProps);
  });
});
