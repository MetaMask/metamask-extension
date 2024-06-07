import { FEATURE_ANNOUNCEMENT_API } from '../services/feature-announcements';
import {
  NOTIFICATION_API_LIST_ENDPOINT,
  NOTIFICATION_API_MARK_ALL_AS_READ_ENDPOINT,
  TRIGGER_API_BATCH_ENDPOINT,
} from '../services/onchain-notifications';
import { createMockFeatureAnnouncementAPIResult } from './mock-feature-announcements';
import { createMockRawOnChainNotifications } from './mock-raw-notifications';

type MockResponse = {
  url: string;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  response: unknown;
};

export const CONTENTFUL_RESPONSE = createMockFeatureAnnouncementAPIResult();

export function getMockFeatureAnnouncementResponse() {
  return {
    url: FEATURE_ANNOUNCEMENT_API,
    requestMethod: 'GET',
    response: CONTENTFUL_RESPONSE,
  } satisfies MockResponse;
}

export function getMockBatchCreateTriggersResponse() {
  return {
    url: TRIGGER_API_BATCH_ENDPOINT,
    requestMethod: 'POST',
    response: null,
  } satisfies MockResponse;
}

export function getMockBatchDeleteTriggersResponse() {
  return {
    url: TRIGGER_API_BATCH_ENDPOINT,
    requestMethod: 'DELETE',
    response: null,
  } satisfies MockResponse;
}

export const MOCK_RAW_ON_CHAIN_NOTIFICATIONS =
  createMockRawOnChainNotifications();

export function getMockListNotificationsResponse() {
  return {
    url: NOTIFICATION_API_LIST_ENDPOINT,
    requestMethod: 'POST',
    response: MOCK_RAW_ON_CHAIN_NOTIFICATIONS,
  } satisfies MockResponse;
}

export function getMockMarkNotificationsAsReadResponse() {
  return {
    url: NOTIFICATION_API_MARK_ALL_AS_READ_ENDPOINT,
    requestMethod: 'POST',
    response: null,
  } satisfies MockResponse;
}
