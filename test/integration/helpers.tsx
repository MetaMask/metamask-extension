import nock from 'nock';

export const createMockImplementation = <T,>(requests: Record<string, T>) => {
  return (method: string): Promise<T | undefined> => {
    if (method in requests) {
      return Promise.resolve(requests[method]);
    }
    return Promise.resolve(undefined);
  };
};

export function mock4byte(hexSignature: string) {
  const mockEndpoint = nock('https://www.4byte.directory:443', {
    encodedQueryParams: true,
  })
    .persist()
    .get('/api/v1/signatures/')
    .query({ hex_signature: hexSignature })
    .reply(200, {
      results: [
        {
          id: 235447,
          created_at: '2021-09-14T02:07:09.805000Z',
          text_signature: 'mintNFTs(uint256)',
          hex_signature: hexSignature,
          bytes_signature: ';K\u0013 ',
        },
      ],
    });
  return mockEndpoint;
}
