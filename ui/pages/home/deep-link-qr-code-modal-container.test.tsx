import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { clearHomeDeepLinkQrCode } from '../../ducks/app/app';
import { DeepLinkQrCodeModalContainer } from './deep-link-qr-code-modal-container';
import type { HomeDeepLinkQrCode } from './home-deep-link-actions';

jest.mock('../../components/app/deep-link-qr-code', () => {
  const { enLocale: mockMessages } = jest.requireActual(
    '../../../test/lib/i18n-helpers',
  );
  return {
    DeepLinkQRCode: ({
      title,
      description,
      onDone,
      testId,
    }: {
      title: string;
      description: string;
      onDone: () => void;
      testId: string;
    }) => (
      <div data-testid={testId}>
        <span>{title}</span>
        <span>{description}</span>
        <button onClick={onDone}>{mockMessages.done.message}</button>
      </div>
    ),
  };
});

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
}));

const mockStore = configureMockStore([thunk]);

function buildState({
  homeDeepLinkQrCode = null as HomeDeepLinkQrCode | null,
  isSeedlessPasswordOutdated = false,
  showShieldEntryModal = false,
} = {}) {
  return {
    appState: {
      homeDeepLinkQrCode,
      // Required by selectCanSeeModals
      onboardedInThisUISession: false,
      newNetworkAddedConfigurationId: '',
      showUpdateModal: false,
      // Required by getShowShieldEntryModal
      shieldEntryModal: showShieldEntryModal ? { show: true } : undefined,
    },
    metamask: {
      // Required by selectCanSeeModals
      completedOnboarding: true,
      firstTimeFlowType: 'import',
      preferences: {},
      // Required by selectShowTermsOfUse (false = no popup)
      termsOfUseLastAgreed: Date.now(),
      remoteFeatureFlags: {},
      // Required by getIsSeedlessPasswordOutdated
      passwordOutdatedCache: { isExpiredPwd: isSeedlessPasswordOutdated },
      // Required by selectShowRecoveryPhrase (recent = reminder suppressed)
      recoveryPhraseReminderHasBeenShown: false,
      recoveryPhraseReminderLastShown: Date.now(),
    },
  };
}

function renderContainer(stateOverrides = {}) {
  const store = mockStore(buildState(stateOverrides));
  return renderWithProvider(<DeepLinkQrCodeModalContainer />, store);
}

describe('DeepLinkQrCodeModalContainer', () => {
  it('renders nothing when homeDeepLinkQrCode is null', () => {
    const { queryByTestId } = renderContainer({ homeDeepLinkQrCode: null });
    expect(queryByTestId('deep-link-qr-code-modal')).toBeNull();
  });

  it('renders the modal when homeDeepLinkQrCode is set and canShow is true', () => {
    const { getByTestId } = renderContainer({
      homeDeepLinkQrCode: {
        deepLinkUrl: 'metamask://predict?token=ETH',
        titleKey: 'deepLinkQrPredictTitle',
        descriptionKey: 'deepLinkQrPredictDescription',
      },
    });
    expect(getByTestId('deep-link-qr-code-modal')).toBeInTheDocument();
    expect(getByTestId('deep-link-qr-code-container')).toBeInTheDocument();
  });

  it('dispatches clearHomeDeepLinkQrCode when the Done button is clicked', () => {
    const store = mockStore(
      buildState({
        homeDeepLinkQrCode: {
          deepLinkUrl: 'metamask://predict?token=ETH',
          titleKey: 'deepLinkQrPredictTitle',
          descriptionKey: 'deepLinkQrPredictDescription',
        },
      }),
    );
    const { getByText } = renderWithProvider(
      <DeepLinkQrCodeModalContainer />,
      store,
    );

    fireEvent.click(getByText(messages.done.message));

    expect(store.getActions()).toContainEqual(clearHomeDeepLinkQrCode());
  });
});
