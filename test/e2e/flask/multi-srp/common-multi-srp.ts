import { Mockttp } from 'mockttp';
import { MockedEndpoint } from '../../mock-e2e';

export async function mockActiveNetworks(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return await mockServer
    .forGet('https://accounts.api.cx.metamask.io/v2/activeNetworks')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          activeNetworks: [],
        },
      };
    });
}
