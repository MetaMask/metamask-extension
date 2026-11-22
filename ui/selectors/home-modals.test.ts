import type { HomeDeepLinkQrCode } from '../pages/home/HomeDeepLinkActions';
import {
  selectCanShowLowPriorityModal,
  getHomeDeepLinkQrCode,
} from './home-modals';

function buildState({
  completedOnboarding = true,
  onboardedInThisUISession = false,
  // 'import' lets onboardedInThisUISession=true pass the selectCanSeeModals guard;
  // 'create' blocks it (tests the onboardedInThisUISession code path directly).
  // 'create' also makes getIsPrimarySeedPhraseBackedUp return false, so combine
  // with recoveryPhraseReminderLastShown=0 to exercise selectShowRecoveryPhrase.
  firstTimeFlowType = 'import' as string,
  newNetworkAddedConfigurationId = '',
  recoveryPhraseReminderLastShown = Date.now(),
  // selectShowTermsOfUse inputs (false by default = no popup)
  showTermsOfUsePopup = false,
  // getIsSeedlessPasswordOutdated
  isSeedlessPasswordOutdated = false,
  // getShowShieldEntryModal — lives in appState
  showShieldEntryModal = false,
  homeDeepLinkQrCode = null as HomeDeepLinkQrCode | null,
} = {}) {
  return {
    metamask: {
      completedOnboarding,
      firstTimeFlowType,
      preferences: {},
      termsOfUseLastAgreed: showTermsOfUsePopup ? 0 : Date.now(),
      passwordOutdatedCache: { isExpiredPwd: isSeedlessPasswordOutdated },
      recoveryPhraseReminderHasBeenShown: false,
      recoveryPhraseReminderLastShown,
      remoteFeatureFlags: {},
    },
    appState: {
      onboardedInThisUISession,
      newNetworkAddedConfigurationId,
      homeDeepLinkQrCode,
      showUpdateModal: false,
      shieldEntryModal: showShieldEntryModal ? { show: true } : undefined,
    },
  } as unknown as Parameters<typeof selectCanShowLowPriorityModal>[0];
}

describe('selectCanShowLowPriorityModal', () => {
  it('returns true when all guards are clear', () => {
    expect(selectCanShowLowPriorityModal(buildState())).toBe(true);
  });

  it('returns false when onboarding is not completed', () => {
    expect(
      selectCanShowLowPriorityModal(buildState({ completedOnboarding: false })),
    ).toBe(false);
  });

  it('returns false when onboardedInThisUISession is true and flow is not import', () => {
    // onboardedInThisUISession=true only suppresses modals for non-import flows.
    // firstTimeFlowType='create' is required to exercise the blocking branch of
    // `(!onboardedInThisUISession || firstTimeFlowType === 'import')`.
    expect(
      selectCanShowLowPriorityModal(
        buildState({
          onboardedInThisUISession: true,
          firstTimeFlowType: 'create',
        }),
      ),
    ).toBe(false);
  });

  it('returns true when onboardedInThisUISession is true but flow is import', () => {
    // Import flow is allowed even when onboardedInThisUISession=true.
    expect(
      selectCanShowLowPriorityModal(
        buildState({
          onboardedInThisUISession: true,
          firstTimeFlowType: 'import',
        }),
      ),
    ).toBe(true);
  });

  it('returns false when a new network was just added', () => {
    expect(
      selectCanShowLowPriorityModal(
        buildState({ newNetworkAddedConfigurationId: 'abc-123' }),
      ),
    ).toBe(false);
  });

  it('returns false when the seedless password is outdated', () => {
    expect(
      selectCanShowLowPriorityModal(
        buildState({ isSeedlessPasswordOutdated: true }),
      ),
    ).toBe(false);
  });

  it('returns false when the shield entry modal is active', () => {
    expect(
      selectCanShowLowPriorityModal(buildState({ showShieldEntryModal: true })),
    ).toBe(false);
  });

  it('returns false when the recovery phrase reminder is active', () => {
    // recoveryPhraseReminderLastShown=0 makes getShowRecoveryPhraseReminder true
    // (currentTime - 0 exceeds the 2-day threshold).
    // firstTimeFlowType='create' makes getIsPrimarySeedPhraseBackedUp false,
    // so selectShowRecoveryPhrase = true → selectCanShowLowPriorityModal = false.
    expect(
      selectCanShowLowPriorityModal(
        buildState({
          firstTimeFlowType: 'create',
          recoveryPhraseReminderLastShown: 0,
        }),
      ),
    ).toBe(false);
  });
});

describe('getHomeDeepLinkQrCode', () => {
  it('returns null when no deeplink QR code is pending', () => {
    const state = buildState({ homeDeepLinkQrCode: null });
    expect(getHomeDeepLinkQrCode(state)).toBeNull();
  });

  it('returns the deeplink QR code object when one is pending', () => {
    const qrCode = {
      deeplinkUrl: 'metamask://predict?token=ETH',
      titleKey: 'deepLinkQrPredictTitle',
      descriptionKey: 'deepLinkQrPredictDescription',
    };
    const state = buildState({ homeDeepLinkQrCode: qrCode });
    expect(getHomeDeepLinkQrCode(state)).toStrictEqual(qrCode);
  });
});
