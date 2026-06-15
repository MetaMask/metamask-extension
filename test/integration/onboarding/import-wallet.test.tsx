import React from 'react';
import { waitFor } from '@testing-library/react';
import nock from 'nock';
import mockMetaMaskState from '../data/onboarding-completion-route.json';
import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import {
  clickElementById,
  createMockImplementation,
  waitForElementByText,
} from '../helpers';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../../ui/ducks/bridge/actions', () => ({
  ...jest.requireActual('../../../ui/ducks/bridge/actions'),
}));

jest.mock(
  '../../../ui/pages/onboarding-flow/welcome/fox-appear-animation',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => <div data-testid="fox-appear-animation" />,
  }),
);

jest.mock(
  '../../../ui/pages/onboarding-flow/welcome/metamask-wordmark-animation',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => <div data-testid="metamask-wordmark-animation" />,
  }),
);

jest.mock(
  '../../../ui/pages/onboarding-flow/creation-successful/wallet-ready-animation',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => <div data-testid="wallet-ready-animation" />,
  }),
);

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
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

    let completeOnboardingCall;

    await waitFor(() => {
      completeOnboardingCall =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'completeOnboarding',
        );

      expect(completeOnboardingCall?.[0]).toBe('completeOnboarding');
    });
  });
});
