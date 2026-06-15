import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { clearHomeDeepLinkQrCode } from '../../ducks/app/app';
import { DeeplinkQrCodeModalContainer } from './deeplink-qrcode-modal-container';
import type { HomeDeepLinkQrCode } from './HomeDeepLinkActions';

jest.mock('../../components/app/deeplink-qr-code', () => ({
  DeeplinkQRCode: ({
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
      <button onClick={onDone}>Done</button>
    </div>
  ),
}));

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
}));

const mockStore = configureMockStore([thunk]);

function buildState({
  homeDeepLinkQrCode = null as HomeDeepLinkQrCode | null,
  canSeeModals = true,
  showTermsOfUse = false,
  showMultiRpcEditModal = false,
  displayUpdateModal = false,
  isSeedlessPasswordOutdated = false,
  showShieldEntryModal = false,
  showRecoveryPhrase = false,
} = {}) {
  return {
    appState: {
      homeDeepLinkQrCode,
      showBasicFunctionalityModal: false,
      externalServicesOnboardingToggleState: true,
    },
    metamask: {
      completedOnboarding: true,
      termsOfUseLastAgreed: Date.now(),
      seedPhraseBackedUp: true,
      showRecoveryPhrase,
      shieldEntryModal: showShieldEntryModal ? { show: true } : undefined,
      isSeedlessOnboarding: isSeedlessPasswordOutdated,
    },
    appState2: {},
  };
}

function renderContainer(stateOverrides = {}) {
  const store = mockStore(buildState(stateOverrides));
  return renderWithProvider(<DeeplinkQrCodeModalContainer />, store);
}

describe('DeeplinkQrCodeModalContainer', () => {
  it('renders nothing when homeDeepLinkQrCode is null', () => {
    const { queryByTestId } = renderContainer({ homeDeepLinkQrCode: null });
    expect(queryByTestId('deeplink-qrcode-modal')).toBeNull();
  });

  it('renders the modal when homeDeepLinkQrCode is set and canShow is true', () => {
    const { getByTestId } = renderContainer({
      homeDeepLinkQrCode: {
        deeplinkUrl: 'metamask://predict?token=ETH',
        titleKey: 'deepLinkQrPredictTitle',
        descriptionKey: 'deepLinkQrPredictDescription',
      },
    });
    expect(getByTestId('deeplink-qrcode-modal')).toBeInTheDocument();
    expect(getByTestId('deeplink-qrcode-container')).toBeInTheDocument();
  });

  it('dispatches clearHomeDeepLinkQrCode when the Done button is clicked', () => {
    const store = mockStore(
      buildState({
        homeDeepLinkQrCode: {
          deeplinkUrl: 'metamask://predict?token=ETH',
          titleKey: 'deepLinkQrPredictTitle',
          descriptionKey: 'deepLinkQrPredictDescription',
        },
      }),
    );
    const { getByText } = renderWithProvider(
      <DeeplinkQrCodeModalContainer />,
      store,
    );

    fireEvent.click(getByText('Done'));

    expect(store.getActions()).toContainEqual(clearHomeDeepLinkQrCode());
  });
});
