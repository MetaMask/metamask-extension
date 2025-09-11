import { Mockttp } from 'mockttp';

/**
 * Mocks the segment API for specific payloads that we expect to see when these tests are run.
 * This handles both single events and batched events with multiple events.
 *
 * @param mockServer - The mock server instance.
 * @param events - An array of event names to mock.
 * @param options - Options for the mock.
 * @param options.shouldAlwaysMatch - Whether to always match the request.
 * @param options.debug - Logs the request body to the console.
 * @returns
 */
export async function mockSegment(
  mockServer: Mockttp,
  events: string[],
  options: {
    shouldAlwaysMatch?: boolean;
    debug?: boolean;
  } = { shouldAlwaysMatch: false, debug: false },
) {
  // Create a comprehensive mock that catches all segment requests
  // This will match any batch that contains at least one of our expected events
  const comprehensiveMock = await mockServer
    .forPost('https://api.segment.io/v1/batch')
    [options.shouldAlwaysMatch ? 'always' : 'once']()
    .thenCallback(async (request) => {
      if (options.debug) {
        const body = await request.body.getJson();
        console.log('Segment request received:', JSON.stringify(body, null, 2));
      }
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
      .thenCallback(async (request) => {
        if (options.debug) {
          const body = await request.body.getJson();
          console.log(
            `Individual segment mock matched for ${event}:`,
            JSON.stringify(body, null, 2),
          );
        }
        return {
          statusCode: 200,
        };
      });
  });

  const allIndividualMocks = await Promise.all(individualMocks);
  return [comprehensiveMock, ...allIndividualMocks];
}
