import type { HomeDeepLinkQrCode } from '../pages/home/HomeDeepLinkActions';
import {
  selectCanShowLowPriorityModal,
  selectDisplayUpdateModal,
  selectIsUpdateModalDeferred,
  selectIsUpdateModalDeferredByOpenFlow,
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

type UpdateModalStateOverrides = {
  appState?: Record<string, unknown>;
  metamask?: Record<string, unknown>;
};

/**
 * State where an update is pending: the installed version is below the
 * minimum version and a newer version is available.
 */
function buildUpdatePendingState({
  appState = {},
  metamask = {},
}: UpdateModalStateOverrides = {}) {
  const state = buildState();
  return {
    ...state,
    metamask: {
      ...state.metamask,
      pendingApprovals: {},
      pendingExtensionVersion: '12.0.0',
      remoteFeatureFlags: { extensionUpdatePromptMinimumVersion: '10.0.0' },
      ...metamask,
    },
    appState: {
      ...state.appState,
      deprecatedNetworkModalOpen: false,
      isNetworkMenuOpen: false,
      showBasicFunctionalityModal: false,
      showIpfsModalOpen: false,
      showKeyringRemovalSnapModal: false,
      ...appState,
    },
  } as unknown as Parameters<typeof selectDisplayUpdateModal>[0];
}

describe('selectDisplayUpdateModal', () => {
  const originalPlatform = global.platform;

  beforeEach(() => {
    global.platform = {
      getVersion: () => '9.0.0',
    } as typeof global.platform;
  });

  afterEach(() => {
    global.platform = originalPlatform;
  });

  it('returns true when an update is pending and modals are allowed', () => {
    expect(selectDisplayUpdateModal(buildUpdatePendingState())).toBe(true);
  });

  it('returns false when no update is pending', () => {
    expect(
      selectDisplayUpdateModal(
        buildUpdatePendingState({
          metamask: { pendingExtensionVersion: null },
        }),
      ),
    ).toBe(false);
  });

  it('returns false when onboarding is not completed', () => {
    expect(
      selectDisplayUpdateModal(
        buildUpdatePendingState({ metamask: { completedOnboarding: false } }),
      ),
    ).toBe(false);
  });

  it('keeps lower-priority modals suppressed while an update is pending', () => {
    expect(selectCanShowLowPriorityModal(buildUpdatePendingState())).toBe(
      false,
    );
  });
});

describe('selectIsUpdateModalDeferred', () => {
  it('does not defer when no flow is open', () => {
    expect(selectIsUpdateModalDeferred(buildUpdatePendingState())).toBe(false);
  });

  const deferringFlows: [string, UpdateModalStateOverrides][] = [
    [
      'a pending confirmation',
      {
        metamask: {
          pendingApprovals: {
            'approval-1': { id: 'approval-1', type: 'personal_sign' },
          },
        },
      },
    ],
    [
      'a pending add-network confirmation',
      {
        metamask: {
          pendingApprovals: {
            'approval-1': {
              id: 'approval-1',
              origin: 'metamask',
              type: 'wallet_addEthereumChain',
            },
          },
        },
      },
    ],
    [
      'an active QR hardware scan',
      { metamask: { activeQrCodeScanRequest: { type: 'sync' } } },
    ],
    ['the network menu', { appState: { isNetworkMenuOpen: true } }],
    ['the IPFS modal', { appState: { showIpfsModalOpen: true } }],
    [
      'the basic functionality modal',
      { appState: { showBasicFunctionalityModal: true } },
    ],
    [
      'the keyring snap removal result',
      { appState: { showKeyringRemovalSnapModal: true } },
    ],
    [
      'the deprecated network modal',
      { appState: { deprecatedNetworkModalOpen: true } },
    ],
  ];

  for (const [name, overrides] of deferringFlows) {
    it(`defers while ${name} is open`, () => {
      expect(
        selectIsUpdateModalDeferred(buildUpdatePendingState(overrides)),
      ).toBe(true);
    });
  }
});

describe('selectIsUpdateModalDeferredByOpenFlow', () => {
  it('does not defer for a pending confirmation', () => {
    expect(
      selectIsUpdateModalDeferredByOpenFlow(
        buildUpdatePendingState({
          metamask: {
            pendingApprovals: {
              'approval-1': { id: 'approval-1', type: 'personal_sign' },
            },
          },
        }),
      ),
    ).toBe(false);
  });

  it('defers while the network menu is open', () => {
    expect(
      selectIsUpdateModalDeferredByOpenFlow(
        buildUpdatePendingState({ appState: { isNetworkMenuOpen: true } }),
      ),
    ).toBe(true);
  });
});
