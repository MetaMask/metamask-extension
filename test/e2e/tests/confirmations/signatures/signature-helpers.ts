import { strict as assert } from 'assert';
import { MockedEndpoint } from 'mockttp';
import {
  WINDOW_TITLES,
  getEventPayloads,
  unlockWallet,
} from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { DAPP_URL } from '../../../constants';
import Confirmation from '../../../page-objects/pages/confirmations/redesign/confirmation';
import AccountDetailsModal from '../../../page-objects/pages/confirmations/redesign/accountDetailsModal';
import {
  BlockaidReason,
  BlockaidResultType,
} from '../../../../../shared/constants/security-provider';

export const WALLET_ADDRESS = '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1';
export const WALLET_ETH_BALANCE = '25';
export enum SignatureType {
  PersonalSign = '#personalSign',
  Permit = '#signPermit',
  NFTPermit = '#sign721Permit',
  SignTypedDataV3 = '#signTypedDataV3',
  SignTypedDataV4 = '#signTypedDataV4',
  SignTypedData = '#signTypedData',
  SIWE = '#siwe',
  SIWE_BadDomain = '#siweBadDomain',
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
  decodingChangeTypes?: string[];
  decodingResponse?: string;
};

type SignatureEventProperty = {
  account_type: 'MetaMask';
  category: 'inpage_provider';
  chain_id: '0x539';
  environment_type: 'background';
  locale: 'en';
  security_alert_reason: string;
  security_alert_response: string;
  signature_type: string;
  eip712_primary_type?: string;
  decoding_change_types?: string[];
  decoding_response?: string;
  ui_customizations?: string[];
  location?: string;
};

const signatureAnonProperties = {
  eip712_verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  eip712_domain_version: '1',
  eip712_domain_name: 'Ether Mail',
};

let testDapp: TestDapp;
let accountDetailsModal: AccountDetailsModal;

export async function initializePages(driver: Driver) {
  testDapp = new TestDapp(driver);
  accountDetailsModal = new AccountDetailsModal(driver);
}

/**
 * Generates expected signature metric properties
 *
 * @param signatureType
 * @param primaryType
 * @param uiCustomizations
 * @param securityAlertReason
 * @param securityAlertResponse
 * @param decodingChangeTypes
 * @param decodingResponse
 */
function getSignatureEventProperty(
  signatureType: string,
  primaryType: string,
  uiCustomizations: string[],
  securityAlertReason: string = BlockaidReason.checkingChain,
  securityAlertResponse: string = BlockaidResultType.Loading,
  decodingChangeTypes?: string[],
  decodingResponse?: string,
): SignatureEventProperty {
  const signatureEventProperty: SignatureEventProperty = {
    account_type: 'MetaMask',
    signature_type: signatureType,
    category: 'inpage_provider',
    chain_id: '0x539',
    environment_type: 'background',
    locale: 'en',
    security_alert_reason: securityAlertReason,
    security_alert_response: securityAlertResponse,
    ui_customizations: uiCustomizations,
  };

  if (primaryType !== '') {
    signatureEventProperty.eip712_primary_type = primaryType;
  }

  if (decodingResponse) {
    signatureEventProperty.decoding_change_types = decodingChangeTypes;
    signatureEventProperty.decoding_response = decodingResponse;
  }
  return signatureEventProperty;
}

function assertSignatureRequestedMetrics(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: any[],
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
  uiCustomizations = ['redesigned_confirmation'],
  withAnonEvents = false,
  securityAlertReason,
  securityAlertResponse,
  decodingChangeTypes,
  decodingResponse,
}: AssertSignatureMetricsOptions) {
  const events = await getEventPayloads(driver, mockedEndpoints);
  const signatureEventProperty = getSignatureEventProperty(
    signatureType,
    primaryType,
    uiCustomizations,
    securityAlertReason,
    securityAlertResponse,
    decodingChangeTypes,
    decodingResponse,
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
  uiCustomizations = ['redesigned_confirmation'],
  location,
  expectedProps = {},
  withAnonEvents = false,
  securityAlertReason,
  securityAlertResponse,
  decodingChangeTypes,
  decodingResponse,
}: AssertSignatureMetricsOptions) {
  const events = await getEventPayloads(driver, mockedEndpoints);
  const signatureEventProperty = getSignatureEventProperty(
    signatureType,
    primaryType,
    uiCustomizations,
    securityAlertReason,
    securityAlertResponse,
    decodingChangeTypes,
    decodingResponse,
  );

  assertSignatureRequestedMetrics(
    events,
    signatureEventProperty,
    withAnonEvents,
  );

  assertEventPropertiesMatch(events, 'Signature Rejected', {
    ...signatureEventProperty,
    location,
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
    signature_type: type,
    category: 'Confirmations',
    locale: 'en',
    chain_id: '0x539',
    environment_type: 'notification',
  });
}

function assertEventPropertiesMatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: any[],
  eventName: string,
  expectedProperties: object,
) {
  const event = events.find((e) => e.event === eventName);

  const actualProperties = { ...event.properties };
  const expectedProps = { ...expectedProperties };

  compareSecurityAlertResponse(actualProperties, expectedProps, eventName);

  assert(event, `${eventName} event not found`);
  assert.deepStrictEqual(
    actualProperties,
    expectedProps,
    `${eventName} event properties do not match`,
  );
}

function compareSecurityAlertResponse(
  actualProperties: Record<string, unknown>,
  expectedProperties: Record<string, unknown>,
  eventName: string,
) {
  if (
    expectedProperties.security_alert_response &&
    (expectedProperties.security_alert_response === 'loading' ||
      expectedProperties.security_alert_response === 'Benign')
  ) {
    if (
      actualProperties.security_alert_response !== 'loading' &&
      actualProperties.security_alert_response !== 'Benign'
    ) {
      assert.fail(
        `${eventName} event properties do not match: security_alert_response is ${actualProperties.security_alert_response}`,
      );
    }
    // Remove the property from both objects to avoid comparison
    delete actualProperties.security_alert_response;
    delete expectedProperties.security_alert_response;
  }
}

export async function clickHeaderInfoBtn(driver: Driver) {
  const confirmation = new Confirmation(driver);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  confirmation.clickHeaderAccountDetailsButton();
}

export async function assertHeaderInfoBalance() {
  accountDetailsModal.assertHeaderInfoBalance(WALLET_ETH_BALANCE);
}

export async function copyAddressAndPasteWalletAddress(driver: Driver) {
  await accountDetailsModal.clickAddressCopyButton();
  await driver.delay(500); // Added delay to avoid error Element is not clickable at point (x,y) because another element obscures it, happens as soon as the mouse hovers over the close button
  await accountDetailsModal.clickAccountDetailsModalCloseButton();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await testDapp.pasteIntoEip747ContractAddressInput();
}

export async function assertPastedAddress() {
  await testDapp.assertEip747ContractAddressInputValue(WALLET_ADDRESS);
}

export async function assertRejectedSignature() {
  testDapp.assertUserRejectedRequest();
}

export async function openDappAndTriggerSignature(
  driver: Driver,
  type: string,
) {
  await unlockWallet(driver);
  await testDapp.openTestDappPage({ url: DAPP_URL });
  await triggerSignature(type);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
}

export async function openDappAndTriggerDeploy(driver: Driver) {
  await unlockWallet(driver);
  await testDapp.openTestDappPage({ url: DAPP_URL });
  await driver.clickElement('#deployNFTsButton');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
}

export async function triggerSignature(type: string) {
  switch (type) {
    case SignatureType.PersonalSign:
      await testDapp.clickPersonalSign();
      break;
    case SignatureType.Permit:
      await testDapp.clickPermit();
      break;
    case SignatureType.SignTypedData:
      await testDapp.clickSignTypedData();
      break;
    case SignatureType.SignTypedDataV3:
      await testDapp.clickSignTypedDatav3();
      break;
    case SignatureType.SignTypedDataV4:
      await testDapp.clickSignTypedDatav4();
      break;
    case SignatureType.SIWE:
      await testDapp.clickSiwe();
      break;
    case SignatureType.SIWE_BadDomain:
      await testDapp.clickSwieBadDomain();
      break;
    case SignatureType.NFTPermit:
      await testDapp.clickERC721Permit();
      break;
    default:
      throw new Error('Invalid signature type');
  }
}

export async function assertVerifiedSiweMessage(
  driver: Driver,
  message: string,
) {
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

  await testDapp.check_successSiwe(message);
}
