import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import mockMetaMaskState from '../data/integration-init-state.json';
import { act, fireEvent, getByText, waitFor } from '@testing-library/react';
import { createMockImplementation } from '../helpers';
import nock from 'nock';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      ...(mockRequests ?? {}),
    }),
  );
};

const profileSyncState = (on = true) => {
  return {
    ...mockMetaMaskState,
    isProfileSyncingEnabled: on,
    isProfileSyncingUpdateLoading: false,
    isMetamaskNotificationsFeatureSeen: true,
    isNotificationServicesEnabled: true,
    isFeatureAnnouncementsEnabled: true,
    metamaskNotificationsList: [],
    metamaskNotificationsReadList: ['enhanced-signatures'],
    isUpdatingMetamaskNotifications: false,
    isFetchingMetamaskNotifications: false,
    isUpdatingMetamaskNotificationsAccount: [],
  };
};

let scope: nock.Scope;

describe.only('Accounts Sync', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
    scope = nock(/^https:\/\/.*\.api\.cx\.metamask\.io/)
      .persist()
      .put(/.*/)
      .reply(200, (uri, requestBody) => ({
        message: `PUT request to ${uri}`,
        body: requestBody,
      }))
      .get(/.*/)
      .reply(200, (uri) => ({ message: `GET request to ${uri}` }));
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should not make attempt to sync account on change when profile sync is off', async () => {
    const mockedRequests = {
      getState: profileSyncState(false),
    };

    setupSubmitRequestToBackgroundMocks(mockedRequests);

    await act(async () => {
      const { getByText, getByTestId } = await integrationTestRender({
        preloadedState: profileSyncState(false),
        backgroundConnection: backgroundConnectionMocked,
      });

      fireEvent.click(getByTestId('account-menu-icon'));
      fireEvent.click(
        getByTestId('multichain-account-menu-popover-action-button'),
      );
      fireEvent.click(
        getByTestId('multichain-account-menu-popover-add-account'),
      );
      fireEvent.click(getByTestId('submit-add-account-with-name'));

      debug();

      const requests = scope.interceptors.map((interceptor) => ({
        method: interceptor._requestBody ? 'PUT' : 'GET',
        url: interceptor.uri,
        body: interceptor._requestBody,
      }));

      console.log('Intercepted requests:', requests);
    });
  });
});
