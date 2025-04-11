import { Mockttp } from 'mockttp';

/**
 * Mocks the segment API for specific payloads that we expect to see when these tests are run.
 *
 * @param mockServer - The mock server instance.
 * @param events - An array of event names to mock.
 * @returns
 */
export async function mockSegment(mockServer: Mockttp, events: string[]) {
  const mocks = events.map(async (event) => {
    return await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ event }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      });
  });

  return Promise.all(mocks);
}
