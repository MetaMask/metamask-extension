import { Mockttp } from 'mockttp';

const AUTHENTICATION_BASE_URL =
  'https://authentication.api.cx.metamask.io/api/v2';

export async function seeAuthenticationRequest(mockServer: Mockttp) {
  const createLineageEndpoint = (counter: number) =>
    mockServer
      .forGet(`${AUTHENTICATION_BASE_URL}/profile/lineage`)
      .once()
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            lineage: [
              {
                agent: 'mobile',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                metametrics_id: '0xdeadbeef',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                created_at: '2021-01-01',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                updated_at: '2021-01-01',
                counter,
              },
            ],
            // eslint-disable-next-line @typescript-eslint/naming-convention
            created_at: '2025-07-16T10:03:57Z',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            profile_id: '0deaba86-4b9d-4137-87d7-18bc5bf7708d',
          },
        };
      });

  return [
    await mockServer
      .forPost(`${AUTHENTICATION_BASE_URL}/srp/login`)
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    // Create 3 separate mock endpoints for lineage, to track their completion because of this issue #34938
    await createLineageEndpoint(1),
    await createLineageEndpoint(2),
    await createLineageEndpoint(3),
  ];
}
