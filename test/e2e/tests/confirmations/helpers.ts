import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import FixtureBuilder from '../../fixture-builder';
import {
  defaultGanacheOptionsForType2Transactions,
  withFixtures,
} from '../../helpers';
import { MockedEndpoint, Mockttp } from '../../mock-e2e';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { Driver } from '../../webdriver/driver';
import Confirmation from '../../page-objects/pages/confirmations/redesign/confirmation';
import { MOCK_META_METRICS_ID } from '../../constants';

export const DECODING_E2E_API_URL =
  'https://signature-insights.api.cx.metamask.io/v1';

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
          metaMetricsId: MOCK_META_METRICS_ID,
          participateInMetaMetrics: true,
        })
        .build(),
      localNodeOptions:
        transactionEnvelopeType === TransactionEnvelopeType.legacy
          ? {}
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
  ];
}

export async function mockSignatureApprovedWithDecoding(
  mockServer: Mockttp,
  withAnonEvents = false,
) {
  return [
    ...(await mockSignatureApproved(mockServer, withAnonEvents)),
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
    ...anonEvents,
  ];
}

export async function mockSignatureRejectedWithDecoding(
  mockServer: Mockttp,
  withAnonEvents = false,
) {
  return [
    ...(await mockSignatureRejected(mockServer, withAnonEvents)),
    await createMockSignatureDecodingEvent(mockServer),
  ];
}

export async function mockPermitDecoding(mockServer: Mockttp) {
  return [await createMockSignatureDecodingEvent(mockServer)];
}

export async function mockedSourcifyTokenSend(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .withQuery({ hex_signature: '0xa9059cbb' })
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            bytes_signature: '©\u0005»',
            created_at: '2016-07-09T03:58:28.234977Z',
            hex_signature: '0xa9059cbb',
            id: 145,
            text_signature: 'transfer(address,uint256)',
          },
        ],
      },
    }));
}

export async function mockEip7702FeatureFlag(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet('https://client-config.api.cx.metamask.io/v1/flags')
      .thenCallback(() => {
        return {
          ok: true,
          statusCode: 200,
          json: [
            {
              confirmations_eip_7702: {
                contracts: {
                  '0xaa36a7': [
                    {
                      signature:
                        '0x016cf109489c415ba28e695eb3cb06ac46689c5c49e2aba101d7ec2f68c890282563b324f5c8df5e0536994451825aa235438b7346e8c18b4e64161d990781891c',
                      address: '0xCd8D6C5554e209Fbb0deC797C6293cf7eAE13454',
                    },
                  ],
                  '0x539': [
                    {
                      address: '0x8438Ad1C834623CfF278AB6829a248E37C2D7E3f',
                      signature:
                        '0x4c15775d0c6d5bd37a7aa7aafc62e85597ea705024581b8b5cb0edccc4e6a69e26c495b3ae725815a377c9789bff43bf19e4dd1eaa679e65133e49ceee3ea87f1b',
                    },
                  ],
                },
                supportedChains: ['0xaa36a7', '0x539'],
              },
            },
          ],
        };
      }),
  ];
}
