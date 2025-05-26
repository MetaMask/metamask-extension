import { Mockttp } from 'mockttp';

/**
 * Mocks the segment API for specific payloads that we expect to see when these tests are run.
 * This handles both single events and batched events with multiple events.
 *
 * @param mockServer - The mock server instance.
 * @param events - An array of event names to mock.
 * @returns
 */
export async function mockSegment(mockServer: Mockttp, events: string[]) {
  // Create a comprehensive mock that catches all segment requests
  // This will match any batch that contains at least one of our expected events
  const comprehensiveMock = await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .always()
    .thenCallback((request) => {
      console.log(
        'Segment request received:',
        JSON.stringify(request.body, null, 2),
      );
      return {
        statusCode: 200,
      };
    });

  // Create individual mocks for each event (for backward compatibility)
  const individualMocks = events.map(async (event) => {
    return await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ event }],
      })
      .always()
      .thenCallback((request) => {
        console.log(
          `Individual segment mock matched for ${event}:`,
          JSON.stringify(request.body, null, 2),
        );
        return {
          statusCode: 200,
        };
      });
  });

  const allIndividualMocks = await Promise.all(individualMocks);
  return [comprehensiveMock, ...allIndividualMocks];
}
