import {
  defaultGanacheOptions,
  withFixtures,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Mockttp } from 'mockttp';

export function withRedesignConfirmationFixtures (title: string = '', testFunction: Function) {
  return withFixtures(
    {
      dapp: true,
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToTestDapp()
        .withMetaMetricsController({
          metaMetricsId: 'fake-metrics-id',
          participateInMetaMetrics: true,
        })
        .withPreferencesController({
          preferences: {
            redesignedConfirmations: true,
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

async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Signature Requested' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Signature Approved' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
      await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Signature Rejected' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
      await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Account Details Opened' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}
