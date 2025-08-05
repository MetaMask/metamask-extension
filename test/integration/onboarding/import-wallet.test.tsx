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

describe('Import Wallet Events', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('are sent when onboarding user who chooses to opt in metrics', async () => {
    await integrationTestRender({
      preloadedState: {
        ...mockMetaMaskState,
        firstTimeFlowType: 'import',
        completedOnboarding: false,
        isBackupAndSyncEnabled: true,
      },
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
      // Check for completeOnboarding call
      completeOnboardingCall =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'completeOnboarding',
        );

      // Check for ExtensionPinned tracking event
      extensionPinnedEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'trackMetaMetricsEvent',
        );

      expect(completeOnboardingCall?.[0]).toBe('completeOnboarding');
      expect(extensionPinnedEvent?.[0]).toBe('trackMetaMetricsEvent');
    });

    // Verify ExtensionPinned event has correct properties for import flow
    expect(extensionPinnedEvent?.[1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.ExtensionPinned,
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            wallet_setup_type: 'import',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            new_wallet: false,
          },
        }),
      ]),
    );
  });
});
