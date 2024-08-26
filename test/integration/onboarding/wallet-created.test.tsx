import { fireEvent, waitFor } from '@testing-library/react';
import mockMetaMaskState from '../data/onboarding-completion-route.json';
import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../../ui/ducks/bridge/actions', () => ({
  ...jest.requireActual('../../../ui/ducks/bridge/actions'),
  setBridgeFeatureFlags: jest.fn().mockResolvedValueOnce(undefined),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

describe('Wallet Created Events', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('are sent when onboarding user who chooses to opt in metrics', async () => {
    const { getByTestId, getByText } = await integrationTestRender({
      preloadedState: mockMetaMaskState,
      backgroundConnection: backgroundConnectionMocked,
    });

    expect(getByText('Wallet creation successful')).toBeInTheDocument();

    fireEvent.click(getByTestId('onboarding-complete-done'));

    await waitFor(() => {
      expect(getByTestId('onboarding-pin-extension')).toBeInTheDocument();
    });

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
            method: mockMetaMaskState.firstTimeFlowType,
          },
        }),
      ]),
    );

    fireEvent.click(getByTestId('pin-extension-next'));

    await waitFor(() => {
      expect(
        getByText(
          `Pin MetaMask on your browser so it's accessible and easy to view transaction confirmations.`,
        ),
      ).toBeInTheDocument();
    });

    fireEvent.click(getByTestId('pin-extension-done'));

    await waitFor(() => {
      const completeOnboardingBackgroundRequest =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'completeOnboarding',
        );

      expect(completeOnboardingBackgroundRequest).toBeTruthy();
    });

    await waitFor(() => {
      const OnboardingWalletSetupCompleteEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => {
            if (call[0] === 'trackMetaMetricsEvent') {
              const callArgs = call[1] as unknown as Record<string, unknown>[];

              return (
                callArgs[0].event ===
                MetaMetricsEventName.OnboardingWalletSetupComplete
              );
            }

            return false;
          },
        );

      expect(OnboardingWalletSetupCompleteEvent?.[1]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: MetaMetricsEventCategory.Onboarding,
            event: MetaMetricsEventName.OnboardingWalletSetupComplete,
            properties: {
              wallet_setup_type: 'new',
              new_wallet: true,
            },
          }),
        ]),
      );
    });
  });
});
