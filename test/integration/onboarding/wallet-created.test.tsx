import { waitFor } from '@testing-library/react';
import nock from 'nock';
import mockMetaMaskState from '../data/onboarding-completion-route.json';
import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import {
  clickElementById,
  createMockImplementation,
  waitForElementById,
  waitForElementByText,
} from '../helpers';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

jest.mock('../../../ui/ducks/bridge/actions', () => ({
  ...jest.requireActual('../../../ui/ducks/bridge/actions'),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
  callBackgroundMethod: jest.fn(),
};

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      ...mockRequests,
    }),
  );
};

export function mockSurveyLink() {
  const mockEndpoint = nock('https://accounts.api.cx.metamask.io')
    .persist()
    .get(
      '/v1/users/0x4d6d78a255217af6411a5bbd39e31b5e46e0e920bdf7e979470f316cbe8c00eb/surveys',
    )
    .reply(200, {
      surveys: {},
    });
  return mockEndpoint;
}

describe('Wallet Created Events', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockSurveyLink();
    setupSubmitRequestToBackgroundMocks();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('are sent when onboarding user who chooses to opt in metrics', async () => {
    await integrationTestRender({
      preloadedState: mockMetaMaskState,
      backgroundConnection: backgroundConnectionMocked,
    });

    await waitForElementByText('Your wallet is ready!');
    await clickElementById('onboarding-complete-done');

    await waitForElementById('pin-extension-next');
    await clickElementById('pin-extension-next');

    await waitForElementById('pin-extension-done');
    await clickElementById('pin-extension-done');

    // Verify both completeOnboarding and ExtensionPinned event are called
    let completeOnboardingCall;
    let extensionPinnedEvent;

    await waitFor(() => {
      completeOnboardingCall =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'completeOnboarding',
        );

      extensionPinnedEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'trackMetaMetricsEvent',
        );

      expect(completeOnboardingCall?.[0]).toBe('completeOnboarding');
      expect(extensionPinnedEvent?.[0]).toBe('trackMetaMetricsEvent');
    });

    expect(extensionPinnedEvent?.[1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.ExtensionPinned,
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            wallet_setup_type: 'new',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            new_wallet: true,
          },
        }),
      ]),
    );
  });
});
