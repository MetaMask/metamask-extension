import { strict as assert } from 'assert';
import { MockedEndpoint } from 'mockttp';
import { getEventPayloads } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../../shared/constants/security-provider';
import { ResultType } from '../../../../../shared/lib/trust-signals';

type EventPayload = {
  event: string;
  properties: Record<string, unknown>;
};

export const WALLET_ADDRESS = '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';
export const WALLET_ETH_BALANCE = '25';
export enum SignatureType {
  PersonalSign,
  Permit,
  NFTPermit,
  SignTypedDataV3,
  SignTypedDataV4,
  SignTypedData,
  SIWE,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SIWE_BadDomain,
}

type AssertSignatureMetricsOptions = {
  driver: Driver;
  mockedEndpoints: MockedEndpoint[];
  signatureType: string;
  primaryType?: string;
  uiCustomizations?: string[];
  location?: string;
  expectedProps?: Record<string, unknown>;
  withAnonEvents?: boolean;
  securityAlertReason?: string;
  securityAlertResponse?: string;
  securityAlertSource?: string;
  decodingChangeTypes?: string[];
  decodingResponse?: string;
  decodingDescription?: string | null;
  requestedThrough?: string;
};

type SignatureEventProperty = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  account_type: 'MetaMask';
  category: 'inpage_provider';
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  chain_id: '0x539';
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  environment_type: 'background';
  locale: 'en';
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  security_alert_reason: string;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  security_alert_response: string;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  security_alert_source?: string;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  signature_type: string;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  eip712_primary_type?: string;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  decoding_change_types?: string[];
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  decoding_response?: string;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  decoding_description?: string | null;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ui_customizations?: string[];
  location?: string;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  hd_entropy_index?: number;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  api_source?: string;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  address_alert_response?: string;
};

const signatureAnonProperties = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  eip712_verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  eip712_domain_version: '1',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  eip712_domain_name: 'Ether Mail',
};

/**
 * Generates expected signature metric properties
 *
 * @param signatureType
 * @param primaryType
 * @param uiCustomizations
 * @param securityAlertReason
 * @param securityAlertResponse
 * @param securityAlertSource
 * @param decodingChangeTypes
 * @param decodingResponse
 * @param decodingDescription
 * @param requestedThrough
 */
function getSignatureEventProperty(
  signatureType: string,
  primaryType: string,
  uiCustomizations: string[],
  securityAlertReason: string = BlockaidReason.inProgress,
  securityAlertResponse: string = BlockaidResultType.Loading,
  securityAlertSource: string = 'api',
  decodingChangeTypes?: string[],
  decodingResponse?: string,
  decodingDescription?: string | null,
  requestedThrough?: string,
): SignatureEventProperty {
  const signatureEventProperty: SignatureEventProperty = {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    account_type: 'MetaMask',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    signature_type: signatureType,
    category: 'inpage_provider',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id: '0x539',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    environment_type: 'background',
    locale: 'en',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    security_alert_reason: securityAlertReason,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    security_alert_response: securityAlertResponse,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    security_alert_source: securityAlertSource,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ...(uiCustomizations.length > 0 && { ui_customizations: uiCustomizations }),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    hd_entropy_index: 0,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    api_source: requestedThrough,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    address_alert_response: ResultType.Loading,
  };

  if (primaryType !== '') {
    signatureEventProperty.eip712_primary_type = primaryType;
  }

  if (decodingResponse) {
    signatureEventProperty.decoding_change_types = decodingChangeTypes;
    signatureEventProperty.decoding_response = decodingResponse;
    signatureEventProperty.decoding_description = decodingDescription;
  }

  return signatureEventProperty;
}

function assertSignatureRequestedMetrics(
  events: EventPayload[],
  signatureEventProperty: SignatureEventProperty,
  withAnonEvents = false,
) {
  assertEventPropertiesMatch(
    events,
    'Signature Requested',
    signatureEventProperty,
  );

  if (withAnonEvents) {
    assertEventPropertiesMatch(events, 'Signature Requested Anon', {
      ...signatureEventProperty,
      ...signatureAnonProperties,
    });
  }
}

export async function assertSignatureConfirmedMetrics({
  driver,
  mockedEndpoints,
  signatureType,
  primaryType = '',
  uiCustomizations = [],
  withAnonEvents = false,
  securityAlertReason,
  securityAlertResponse,
  securityAlertSource,
  decodingChangeTypes,
  decodingResponse,
  decodingDescription,
  requestedThrough,
}: AssertSignatureMetricsOptions) {
  const events = await getEventPayloads(driver, mockedEndpoints);
  const signatureEventProperty = getSignatureEventProperty(
    signatureType,
    primaryType,
    uiCustomizations,
    securityAlertReason,
    securityAlertResponse,
    securityAlertSource,
    decodingChangeTypes,
    decodingResponse,
    decodingDescription,
    requestedThrough,
  );

  assertSignatureRequestedMetrics(
    events,
    signatureEventProperty,
    withAnonEvents,
  );

  assertEventPropertiesMatch(
    events,
    'Signature Approved',
    signatureEventProperty,
  );

  if (withAnonEvents) {
    assertEventPropertiesMatch(events, 'Signature Approved Anon', {
      ...signatureEventProperty,
      ...signatureAnonProperties,
    });
  }
}

export async function assertSignatureRejectedMetrics({
  driver,
  mockedEndpoints,
  signatureType,
  primaryType = '',
  uiCustomizations = [],
  location,
  expectedProps = {},
  withAnonEvents = false,
  securityAlertReason,
  securityAlertResponse,
  securityAlertSource,
  decodingChangeTypes,
  decodingResponse,
  decodingDescription,
  requestedThrough,
}: AssertSignatureMetricsOptions) {
  console.log('assertSignatureRejectedMetrics', {
    signatureType,
    primaryType,
    uiCustomizations,
    location,
    expectedProps,
    withAnonEvents,
    securityAlertReason,
    securityAlertResponse,
    securityAlertSource,
    decodingChangeTypes,
    decodingResponse,
    decodingDescription,
    requestedThrough,
  });
  const events = await getEventPayloads(driver, mockedEndpoints);
  const signatureEventProperty = getSignatureEventProperty(
    signatureType,
    primaryType,
    uiCustomizations,
    securityAlertReason,
    securityAlertResponse,
    securityAlertSource,
    decodingChangeTypes,
    decodingResponse,
    decodingDescription,
    requestedThrough,
  );

  assertSignatureRequestedMetrics(
    events,
    signatureEventProperty,
    withAnonEvents,
  );

  assertEventPropertiesMatch(events, 'Signature Rejected', {
    ...signatureEventProperty,
    location,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    hd_entropy_index: 0,
    ...expectedProps,
  });

  if (withAnonEvents) {
    assertEventPropertiesMatch(events, 'Signature Rejected Anon', {
      ...signatureEventProperty,
      ...signatureAnonProperties,
    });
  }
}

export async function assertAccountDetailsMetrics(
  driver: Driver,
  mockedEndpoints: MockedEndpoint[],
  type: string,
) {
  const events = await getEventPayloads(driver, mockedEndpoints);

  assertEventPropertiesMatch(events, 'Account Details Opened', {
    action: 'Confirm Screen',
    location: 'signature_confirmation',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    signature_type: type,
    category: 'Confirmations',
    locale: 'en',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id: '0x539',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    environment_type: 'notification',
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    hd_entropy_index: 0,
  });
}

function assertEventPropertiesMatch(
  events: EventPayload[],
  eventName: string,
  expectedProperties: object,
) {
  const event = events.find((e) => e.event === eventName);

  assert(event, `${eventName} event not found`);

  const actualProperties = { ...event.properties };
  const expectedProps = { ...expectedProperties };

  compareDecodingAPIResponse(actualProperties, expectedProps, eventName);

  compareSecurityAlertProperties(actualProperties, expectedProps, eventName);

  assert.deepStrictEqual(
    actualProperties,
    expectedProps,
    `${eventName} event properties do not match`,
  );
}

function compareSecurityAlertProperties(
  actualProperties: Record<string, unknown>,
  expectedProperties: Record<string, unknown>,
  eventName: string,
) {
  if (
    expectedProperties.security_alert_response &&
    (expectedProperties.security_alert_response === 'Loading' ||
      expectedProperties.security_alert_response === 'Benign')
  ) {
    if (
      actualProperties.security_alert_response !== 'Loading' &&
      actualProperties.security_alert_response !== 'Benign'
    ) {
      assert.fail(
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `${eventName} event properties do not match: security_alert_response is ${actualProperties.security_alert_response}`,
      );
    }
    // Remove the property from both objects to avoid comparison
    delete actualProperties.security_alert_response;
    delete expectedProperties.security_alert_response;
  }

  if (expectedProperties.security_alert_source) {
    if (
      actualProperties.security_alert_source !== 'api' &&
      expectedProperties.security_alert_source !== 'api'
    ) {
      assert.fail(
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `${eventName} event properties do not match: security_alert_source is ${actualProperties.security_alert_source}`,
      );
    }
    delete actualProperties.security_alert_source;
    delete expectedProperties.security_alert_source;
  }
}

function compareDecodingAPIResponse(
  actualProperties: Record<string, unknown>,
  expectedProperties: Record<string, unknown>,
  eventName: string,
) {
  if (
    !expectedProperties.decoding_response &&
    !actualProperties.decoding_response
  ) {
    return;
  }
  if (
    eventName === 'Signature Rejected' ||
    eventName === 'Signature Approved'
  ) {
    assert.deepStrictEqual(
      actualProperties.decoding_change_types,
      expectedProperties.decoding_change_types,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `${eventName} event properties do not match: decoding_change_types is ${actualProperties.decoding_change_types}`,
    );
    assert.equal(
      actualProperties.decoding_response,
      expectedProperties.decoding_response,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `${eventName} event properties do not match: decoding_response is ${actualProperties.decoding_response}`,
    );
    assert.equal(
      actualProperties.decoding_description,
      expectedProperties.decoding_description,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `${eventName} event properties do not match: decoding_response is ${actualProperties.decoding_description}`,
    );
  }
  // Remove the property from both objects to avoid comparison
  delete expectedProperties.decoding_change_types;
  delete expectedProperties.decoding_response;
  delete expectedProperties.decoding_description;
  delete expectedProperties.decoding_latency;
  delete actualProperties.decoding_change_types;
  delete actualProperties.decoding_response;
  delete actualProperties.decoding_description;
  delete actualProperties.decoding_latency;
}
