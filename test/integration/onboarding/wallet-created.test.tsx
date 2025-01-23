import { fireEvent, waitFor } from '@testing-library/react';
import nock from 'nock';
import mockMetaMaskState from '../data/onboarding-completion-route.json';
import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { createMockImplementation } from '../helpers';
import { BridgeBackgroundAction } from '../../../shared/types/bridge';

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
    const { getByTestId, findByTestId, getByText, findByText } =
      await integrationTestRender({
        preloadedState: mockMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });

    expect(await findByText('Congratulations!')).toBeInTheDocument();

    fireEvent.click(await findByTestId('onboarding-complete-done'));

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

    fireEvent.click(await findByTestId('pin-extension-next'));

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

    await waitFor(() => {
      expect(
        getByText(
          `Pin MetaMask on your browser so it's accessible and easy to view transaction confirmations.`,
        ),
      ).toBeInTheDocument();
    });

    fireEvent.click(await findByTestId('pin-extension-done'));

    await waitFor(() => {
      const completeOnboardingBackgroundRequest =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'completeOnboarding',
        );

      expect(completeOnboardingBackgroundRequest).toBeTruthy();
    });
  });
});
