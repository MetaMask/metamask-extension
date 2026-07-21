import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { Pna25ModalContainer } from './pna25-modal-container';

jest.mock('./pna25-modal', () => {
  const moduleExports = {
    default: () => <div data-testid="pna25-modal" />,
  };
  Object.defineProperty(moduleExports, '__esModule', { value: true });
  return moduleExports;
});

const mockStore = configureMockStore([thunk]);

function buildState({
  showPna25Modal = false,
  rewardsModalOpen = false,
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
      remoteFeatureFlags: {},
      // selectShowPna25Modal fields
      consentDecisionMade: Boolean(showPna25Modal),
      optedIn: Boolean(showPna25Modal),
      pna25Acknowledged: !showPna25Modal,
    },
    rewards: {
      rewardsModalOpen,
    },
  };
}

function renderContainer(stateOverrides = {}) {
  const store = mockStore(buildState(stateOverrides));
  return renderWithProvider(<Pna25ModalContainer />, store);
}

describe('Pna25ModalContainer', () => {
  it('renders nothing when showPna25Modal is false', () => {
    const { queryByTestId } = renderContainer({ showPna25Modal: false });
    expect(queryByTestId('pna25-modal')).toBeNull();
  });

  it('renders the modal when showPna25Modal is true and no higher-priority modal blocks it', () => {
    const { getByTestId } = renderContainer({ showPna25Modal: true });
    expect(getByTestId('pna25-modal')).toBeInTheDocument();
  });

  it('renders nothing when the rewards modal is open', () => {
    const { queryByTestId } = renderContainer({
      showPna25Modal: true,
      rewardsModalOpen: true,
    });
    expect(queryByTestId('pna25-modal')).toBeNull();
  });

  it('renders nothing when a deeplink QR code modal is active', () => {
    const { queryByTestId } = renderContainer({
      showPna25Modal: true,
      homeDeepLinkQrCode: {
        deeplinkUrl: 'metamask://predict?token=ETH',
        titleKey: 'deepLinkQrPredictTitle',
        descriptionKey: 'deepLinkQrPredictDescription',
      },
    });
    expect(queryByTestId('pna25-modal')).toBeNull();
  });

  it('renders nothing when canSeeModals is false', () => {
    const { queryByTestId } = renderContainer({
      showPna25Modal: true,
      canSeeModals: false,
    });
    expect(queryByTestId('pna25-modal')).toBeNull();
  });
});
