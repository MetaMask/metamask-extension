import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { RewardsModalContainer } from './rewards-modal-container';

jest.mock('./RewardsModal', () => () => <div data-testid="rewards-modal" />);

const mockStore = configureMockStore([thunk]);

function buildState({
  rewardsEnabled = false,
  homeDeepLinkQrCode = null,
  canSeeModals = true,
  showShieldEntryModal = false,
} = {}) {
  return {
    appState: {
      homeDeepLinkQrCode,
      onboardedInThisUISession: false,
      newNetworkAddedConfigurationId: '',
      showUpdateModal: false,
      shieldEntryModal: showShieldEntryModal ? { show: true } : undefined,
    },
    metamask: {
      completedOnboarding: canSeeModals,
      firstTimeFlowType: 'import',
      preferences: {},
      termsOfUseLastAgreed: Date.now(),
      recoveryPhraseReminderHasBeenShown: false,
      recoveryPhraseReminderLastShown: Date.now(),
      remoteFeatureFlags: {
        rewardsEnabled,
      },
      useExternalServices: rewardsEnabled,
    },
    rewards: {
      rewardsModalOpen: false,
    },
  };
}

function renderContainer(stateOverrides = {}) {
  const store = mockStore(buildState(stateOverrides));
  return renderWithProvider(<RewardsModalContainer />, store);
}

describe('RewardsModalContainer', () => {
  it('renders nothing when rewards are not enabled', () => {
    const { queryByTestId } = renderContainer({ rewardsEnabled: false });
    expect(queryByTestId('rewards-modal')).toBeNull();
  });

  it('renders the modal when rewards are enabled and no higher-priority modal is active', () => {
    const { getByTestId } = renderContainer({ rewardsEnabled: true });
    expect(getByTestId('rewards-modal')).toBeInTheDocument();
  });

  it('renders nothing when a deeplink QR code modal is active', () => {
    const { queryByTestId } = renderContainer({
      rewardsEnabled: true,
      homeDeepLinkQrCode: {
        deeplinkUrl: 'metamask://predict?token=ETH',
        titleKey: 'deepLinkQrPredictTitle',
        descriptionKey: 'deepLinkQrPredictDescription',
      },
    });
    expect(queryByTestId('rewards-modal')).toBeNull();
  });

  it('renders nothing when canSeeModals is false', () => {
    const { queryByTestId } = renderContainer({
      rewardsEnabled: true,
      canSeeModals: false,
    });
    expect(queryByTestId('rewards-modal')).toBeNull();
  });

  it('renders nothing when the shield entry modal is active', () => {
    const { queryByTestId } = renderContainer({
      rewardsEnabled: true,
      showShieldEntryModal: true,
    });
    expect(queryByTestId('rewards-modal')).toBeNull();
  });
});
