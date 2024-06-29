import { createEntryPath } from '../schema';
import { GetUserStorageResponse, USER_STORAGE_ENDPOINT } from '../services';
import { MOCK_ENCRYPTED_STORAGE_DATA, MOCK_STORAGE_KEY } from './mockStorage';

type MockResponse = {
  url: string;
  requestMethod: 'GET' | 'POST' | 'PUT';
  response: unknown;
};

export const MOCK_USER_STORAGE_NOTIFICATIONS_ENDPOINT = `${USER_STORAGE_ENDPOINT}${createEntryPath(
  'notification_settings',
  MOCK_STORAGE_KEY,
)}`;

const MOCK_GET_USER_STORAGE_RESPONSE: GetUserStorageResponse = {
  HashedKey: 'HASHED_KEY',
  Data: MOCK_ENCRYPTED_STORAGE_DATA,
};

export function getMockUserStorageGetResponse() {
  return {
    url: MOCK_USER_STORAGE_NOTIFICATIONS_ENDPOINT,
    requestMethod: 'GET',
    response: MOCK_GET_USER_STORAGE_RESPONSE,
  } satisfies MockResponse;
}

export function getMockUserStoragePutResponse() {
  return {
    url: MOCK_USER_STORAGE_NOTIFICATIONS_ENDPOINT,
    requestMethod: 'PUT',
    response: null,
  } satisfies MockResponse;
}
