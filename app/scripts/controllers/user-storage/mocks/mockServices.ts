import nock from 'nock';
import {
  getMockUserStorageGetResponse,
  getMockUserStoragePutResponse,
} from './mockResponses';

type MockReply = {
  status: nock.StatusCode;
  body?: nock.Body;
};

export function mockEndpointGetUserStorage(mockReply?: MockReply) {
  const mockResponse = getMockUserStorageGetResponse();
  const reply = mockReply ?? {
    status: 200,
    body: mockResponse.response,
  };

  const mockEndpoint = nock(mockResponse.url)
    .get('')
    .reply(reply.status, reply.body);

  return mockEndpoint;
}

export function mockEndpointUpsertUserStorage(
  mockReply?: Pick<MockReply, 'status'>,
) {
  const mockResponse = getMockUserStoragePutResponse();
  const mockEndpoint = nock(mockResponse.url)
    .put('')
    .reply(mockReply?.status ?? 204);
  return mockEndpoint;
}
