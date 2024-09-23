import FixtureBuilder from '../../fixture-builder';
import { defaultGanacheOptions, withFixtures } from '../../helpers';
import { MockedEndpoint, Mockttp } from '../../mock-e2e';
import { Driver } from '../../webdriver/driver';

export async function scrollAndConfirmAndAssertConfirm(driver: Driver) {
  await driver.clickElementSafe('.confirm-scroll-to-bottom__button');
  await driver.clickElement('[data-testid="confirm-footer-button"]');
}

export function withRedesignConfirmationFixtures(
  // Default params first is discouraged because it makes it hard to call the function without the
  // optional parameters. But it doesn't apply here because we're always passing in a variable for
  // title. It's optional because it's sometimes unset.
  // eslint-disable-next-line @typescript-eslint/default-param-last
  title: string = '',
  testFunction: Parameters<typeof withFixtures>[1],
  mockSegment?: (mockServer: Mockttp) => Promise<MockedEndpoint[]>, // Add mockSegment as an optional parameter
) {
  return withFixtures(
    {
      dapp: true,
      driverOptions: {
        timeOut: 20000,
      },
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToTestDapp()
        .withMetaMetricsController({
          metaMetricsId: 'fake-metrics-id',
          participateInMetaMetrics: true,
        })
        .withPreferencesController({
          preferences: {
            redesignedConfirmationsEnabled: true,
          },
        })
        .build(),
      ganacheOptions: defaultGanacheOptions,
      title,
      testSpecificMock: mockSegment,
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
