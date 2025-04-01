import { waitFor } from '@testing-library/react';
import { BridgeBackgroundAction } from '@metamask/bridge-controller';
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
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';

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
      [BridgeBackgroundAction.SET_FEATURE_FLAGS]: undefined,
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
    const { findByTestId } = await integrationTestRender({
      preloadedState: {
        ...mockMetaMaskState,
        firstTimeFlowType: 'import',
        completedOnboarding: false,
        isProfileSyncingEnabled: true,
      },
      backgroundConnection: backgroundConnectionMocked,
    });

    const completeOnboardingBtnId = 'onboarding-complete-done';
    const pinExtensionNextBtnId = 'pin-extension-next';
    const pinExtensionDoneBtnId = 'pin-extension-done';
    expect(await findByTestId(completeOnboardingBtnId)).toBeInTheDocument();
    await waitForElementById(completeOnboardingBtnId);
    await clickElementById(completeOnboardingBtnId);
    await waitForElementById(pinExtensionNextBtnId);

    let confirmAccountDetailsModalMetricsEvent;

    await waitFor(() => {
      confirmAccountDetailsModalMetricsEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'trackMetaMetricsEvent',
        );

      expect(confirmAccountDetailsModalMetricsEvent?.[0]).toBe(
        'trackMetaMetricsEvent',
      );
    });

    expect(confirmAccountDetailsModalMetricsEvent?.[1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.OnboardingWalletCreationComplete,
          properties: {
            method: FirstTimeFlowType.import,
            is_profile_syncing_enabled: true,
            hd_entropy_index: 0,
          },
        }),
      ]),
    );

    await clickElementById(pinExtensionNextBtnId);

    let onboardingPinExtensionMetricsEvent;

    await waitFor(() => {
      onboardingPinExtensionMetricsEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'trackMetaMetricsEvent',
        );
      expect(onboardingPinExtensionMetricsEvent?.[0]).toBe(
        'trackMetaMetricsEvent',
      );
    });

    await waitForElementByText(
      `Pin MetaMask on your browser so it's accessible and easy to view transaction confirmations.`,
    );

    await clickElementById(pinExtensionDoneBtnId);

    await waitFor(() => {
      const completeOnboardingBackgroundRequest =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'completeOnboarding',
        );

      expect(completeOnboardingBackgroundRequest).toBeTruthy();
    });
  });
});
