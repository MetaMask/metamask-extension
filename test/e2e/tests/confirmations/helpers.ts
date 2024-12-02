import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptions,
  defaultGanacheOptionsForType2Transactions,
  withFixtures,
} from '../../helpers';
import { MockedEndpoint, Mockttp } from '../../mock-e2e';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { Driver } from '../../webdriver/driver';
import Confirmation from '../../page-objects/pages/confirmations/redesign/confirmation';

export const DECODING_E2E_API_URL =
  'https://qtgdj2huxh.execute-api.us-east-2.amazonaws.com/uat/v1';

export async function scrollAndConfirmAndAssertConfirm(driver: Driver) {
  const confirmation = new Confirmation(driver);
  await confirmation.clickScrollToBottomButton();
  await confirmation.clickFooterConfirmButton();
}

export function withTransactionEnvelopeTypeFixtures(
  // Default params first is discouraged because it makes it hard to call the function without the
  // optional parameters. But it doesn't apply here because we're always passing in a variable for
  // title. It's optional because it's sometimes unset.
  // eslint-disable-next-line @typescript-eslint/default-param-last
  title: string = '',
  transactionEnvelopeType: TransactionEnvelopeType,
  testFunction: Parameters<typeof withFixtures>[1],
  mocks?: (mockServer: Mockttp) => Promise<MockedEndpoint[]>, // Add mocks as an optional parameter
  smartContract?: typeof SMART_CONTRACTS,
) {
  return withFixtures(
    {
      dapp: true,
      driverOptions: { timeOut: 20000 },
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToTestDapp()
        .withMetaMetricsController({
          metaMetricsId: 'fake-metrics-id',
          participateInMetaMetrics: true,
        })
        .build(),
      ganacheOptions:
        transactionEnvelopeType === TransactionEnvelopeType.legacy
          ? defaultGanacheOptions
          : defaultGanacheOptionsForType2Transactions,
      ...(smartContract && { smartContract }),
      ...(mocks && { testSpecificMock: mocks }),
      title,
    },
    testFunction,
  );
}

async function createMockSegmentEvent(mockServer: Mockttp, eventName: string) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: eventName }],
    })
    .thenCallback(() => ({
      statusCode: 200,
    }));
}

async function createMockSignatureDecodingEvent(mockServer: Mockttp) {
  return await mockServer
    .forPost(`${DECODING_E2E_API_URL}/signature`)
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        stateChanges: [
          {
            assetType: 'NATIVE',
            changeType: 'RECEIVE',
            address: '',
            amount: '900000000000000000',
            contractAddress: '',
          },
          {
            assetType: 'ERC721',
            changeType: 'LISTING',
            address: '',
            amount: '',
            contractAddress: '0xafd4896984CA60d2feF66136e57f958dCe9482d5',
            tokenID: '2101',
          },
        ],
      },
    }));
}

export async function mockSignatureApproved(
  mockServer: Mockttp,
  withAnonEvents = false,
) {
  const anonEvents = withAnonEvents
    ? [
        await createMockSegmentEvent(mockServer, 'Signature Requested Anon'),
        await createMockSegmentEvent(mockServer, 'Signature Approved Anon'),
      ]
    : [];

  return [
    await createMockSegmentEvent(mockServer, 'Signature Requested'),
    await createMockSegmentEvent(mockServer, 'Account Details Opened'),
    ...anonEvents,
    await createMockSegmentEvent(mockServer, 'Signature Approved'),
    await createMockSignatureDecodingEvent(mockServer),
  ];
}

export async function mockSignatureRejected(
  mockServer: Mockttp,
  withAnonEvents = false,
) {
  const anonEvents = withAnonEvents
    ? [
        await createMockSegmentEvent(mockServer, 'Signature Requested Anon'),
        await createMockSegmentEvent(mockServer, 'Signature Rejected Anon'),
      ]
    : [];

  return [
    await createMockSegmentEvent(mockServer, 'Signature Requested'),
    await createMockSegmentEvent(mockServer, 'Signature Rejected'),
    await createMockSignatureDecodingEvent(mockServer),
    ...anonEvents,
  ];
}

export async function mockPermitDecoding(mockServer: Mockttp) {
  return [await createMockSignatureDecodingEvent(mockServer)];
}
