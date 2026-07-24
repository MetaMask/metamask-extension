import { act, waitFor } from '@testing-library/react';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  DEFAULT_ROUTE,
  DEEP_LINK_ROUTE,
} from '../../../helpers/constants/routes';
import { DeferredDeepLinkRouteType } from '../../../../shared/lib/deep-links/types';
import * as deepLinkUtils from '../../../../shared/lib/deep-links/utils';
import { MISSING } from '../../../../shared/lib/deep-links/verify';
import * as useSidePanelEnabledHook from '../../../hooks/useSidePanelEnabled';
import { setBackgroundConnection } from '../../../store/background-connection';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { useOnboardingCompletion } from './useOnboardingCompletion';

const mockTrackEvent = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('webextension-polyfill', () => ({
  tabs: {
    query: jest.fn(),
  },
  sidePanel: {
    open: jest.fn(),
    onClosed: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
}));

jest.mock('../../../../shared/lib/deep-links/utils');
jest.mock('../../../hooks/useSidePanelEnabled');

const mockGetIsBasicFunctionalityConsolidationEnabledInBuild = jest.fn(
  () => false,
);
jest.mock('../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../shared/lib/environment'),
  getIsBasicFunctionalityConsolidationEnabledInBuild: () =>
    mockGetIsBasicFunctionalityConsolidationEnabledInBuild(),
}));

const mockRemoveDeferredDeepLink = jest.fn().mockResolvedValue(undefined);
const mockSetIsBackupAndSyncFeatureEnabled = jest
  .fn()
  .mockResolvedValue(undefined);
const mockToggleExternalServices = jest.fn().mockResolvedValue(undefined);
const mockToggleBasicFunctionality = jest.fn().mockResolvedValue(undefined);
const mockSetPreference = jest.fn().mockResolvedValue(undefined);
const mockSetUseMultiAccountBalanceChecker = jest
  .fn()
  .mockResolvedValue(undefined);
const mockSetHasSeenOnboardingCompletionPage = jest
  .fn()
  .mockResolvedValue(undefined);
const mockCompleteOnboarding = jest.fn().mockResolvedValue(true);
const backgroundConnectionMock = new Proxy(
  {
    removeDeferredDeepLink: mockRemoveDeferredDeepLink,
    setIsBackupAndSyncFeatureEnabled: mockSetIsBackupAndSyncFeatureEnabled,
    toggleExternalServices: mockToggleExternalServices,
    toggleBasicFunctionality: mockToggleBasicFunctionality,
    setPreference: mockSetPreference,
    setUseMultiAccountBalanceChecker: mockSetUseMultiAccountBalanceChecker,
    setHasSeenOnboardingCompletionPage: mockSetHasSeenOnboardingCompletionPage,
    completeOnboarding: mockCompleteOnboarding,
  },
  {
    get: (target, prop) => {
      if (prop in target) {
        return target[prop as keyof typeof target];
      }
      return jest.fn().mockResolvedValue(undefined);
    },
  },
);

describe('useOnboardingCompletion', () => {
  const mockState = {
    metamask: {
      internalAccounts: {
        accounts: {
          accountId: {
            address: '0x0000000000000000000000000000000000000000',
            metadata: {
              keyring: {
                type: 'HD Key Tree',
                accounts: ['0x0000000000000000000000000000000000000000'],
              },
            },
          },
        },
        selectedAccount: 'accountId',
      },
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: ['0x0000000000000000000000000000000000000000'],
        },
      ],
      firstTimeFlowType: FirstTimeFlowType.create,
      seedPhraseBackedUp: true,
      isInitialized: true,
      isUnlocked: true,
      completedOnboarding: false,
      hasSeenOnboardingCompletionPage: false,
      deferredDeepLink: null,
    },
    appState: {
      externalServicesOnboardingToggleState: true,
      backupAndSyncOnboardingToggleState: true,
    },
  };

  let windowOpenSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIsBasicFunctionalityConsolidationEnabledInBuild.mockReturnValue(
      false,
    );
    mockUseNavigate.mockClear();
    setBackgroundConnection(backgroundConnectionMock as never);
    (useSidePanelEnabledHook.useSidePanelEnabled as jest.Mock).mockReturnValue(
      false,
    );
    (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue(
      null,
    );
    windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
  });

  it('marks the onboarding completion page as seen', async () => {
    const { result } = renderHookWithProvider(
      () => useOnboardingCompletion(),
      mockState,
    );

    act(() => {
      result.current.markCompletionPageSeen();
    });

    await waitFor(() => {
      expect(mockSetHasSeenOnboardingCompletionPage).toHaveBeenCalledWith(true);
    });
  });

  it('does not mark the onboarding completion page as seen when already seen', () => {
    const { result } = renderHookWithProvider(() => useOnboardingCompletion(), {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        hasSeenOnboardingCompletionPage: true,
      },
    });

    act(() => {
      result.current.markCompletionPageSeen();
    });

    expect(mockSetHasSeenOnboardingCompletionPage).not.toHaveBeenCalled();
  });

  it('navigates to the default route on completion', async () => {
    const { result } = renderHookWithProvider(
      () => useOnboardingCompletion(),
      mockState,
    );

    await act(async () => {
      await result.current.completeOnboarding();
    });

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });

  it('does not complete onboarding while the wallet is locked', async () => {
    const { result } = renderHookWithProvider(() => useOnboardingCompletion(), {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        isUnlocked: false,
      },
    });

    await act(async () => {
      await result.current.completeOnboarding();
    });

    expect(mockCompleteOnboarding).not.toHaveBeenCalled();
    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('sets the consolidated Basic Functionality cohort marker when the build flag is enabled', async () => {
    mockGetIsBasicFunctionalityConsolidationEnabledInBuild.mockReturnValue(
      true,
    );
    const { result } = renderHookWithProvider(
      () => useOnboardingCompletion(),
      mockState,
    );

    await act(async () => {
      await result.current.completeOnboarding();
    });

    await waitFor(() => {
      expect(mockSetPreference).toHaveBeenCalledWith(
        'isBasicFunctionalityConsolidatedEnabled',
        true,
      );
      expect(mockSetUseMultiAccountBalanceChecker).toHaveBeenCalledWith(true);
    });
  });

  it('uses toggleExternalServices when the Basic Functionality build flag is disabled', async () => {
    const { result } = renderHookWithProvider(
      () => useOnboardingCompletion(),
      mockState,
    );

    await act(async () => {
      await result.current.completeOnboarding();
    });

    await waitFor(() => {
      expect(mockToggleExternalServices).toHaveBeenCalledWith(true);
    });
    expect(mockSetPreference).not.toHaveBeenCalled();
    expect(mockSetUseMultiAccountBalanceChecker).not.toHaveBeenCalled();
  });

  it('allows retrying completion after a failed attempt', async () => {
    mockCompleteOnboarding
      .mockRejectedValueOnce(new Error('completion failed'))
      .mockResolvedValueOnce(true);

    const { result } = renderHookWithProvider(
      () => useOnboardingCompletion(),
      mockState,
    );

    await act(async () => {
      await expect(result.current.completeOnboarding()).rejects.toThrow(
        'completion failed',
      );
    });

    await act(async () => {
      await result.current.completeOnboarding();
    });

    await waitFor(() => {
      expect(mockCompleteOnboarding).toHaveBeenCalledTimes(2);
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });

  describe('Backup & Sync onboarding intent', () => {
    it('disables the backup & sync main feature on completion when the onboarding flag is off', async () => {
      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        {
          ...mockState,
          appState: {
            ...mockState.appState,
            backupAndSyncOnboardingToggleState: false,
          },
        },
      );

      await act(async () => {
        await result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(mockSetIsBackupAndSyncFeatureEnabled).toHaveBeenCalledWith(
          'main',
          false,
        );
      });
      expect(mockSetIsBackupAndSyncFeatureEnabled).toHaveBeenCalledTimes(1);
    });

    it('does not call the backup & sync controller on completion when the onboarding flag is on (default)', async () => {
      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        mockState,
      );

      await act(async () => {
        await result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
      });
      expect(mockSetIsBackupAndSyncFeatureEnabled).not.toHaveBeenCalled();
    });
  });

  describe('Deferred Deep Link - Side Panel Enabled', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockUseNavigate.mockClear();
      (
        useSidePanelEnabledHook.useSidePanelEnabled as jest.Mock
      ).mockReturnValue(true);
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue(
        null,
      );
    });

    it('opens side panel and redirects to external URL with _self target when deferred deep link has Redirect type', async () => {
      const externalUrl = 'https://external-app.com/callback';
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue({
        type: DeferredDeepLinkRouteType.Redirect,
        url: externalUrl,
      });

      const mockAssign = jest.fn();
      Object.defineProperty(window, 'location', {
        value: {
          assign: mockAssign,
        },
        writable: true,
      });

      const browserMock = jest.requireMock('webextension-polyfill');
      (browserMock.tabs.query as jest.Mock).mockResolvedValue([
        { windowId: 1, id: 1 },
      ]);
      (browserMock.sidePanel.open as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        {
          ...mockState,
          metamask: {
            ...mockState.metamask,
            deferredDeepLink: {
              createdAt: Date.now(),
              referringLink:
                'https://example.com/deferred?redirectTo=https://external-app.com/callback',
            },
          },
        },
      );

      await act(async () => {
        await result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(browserMock.sidePanel.open).toHaveBeenCalledWith({
          windowId: 1,
        });
        expect(mockAssign).toHaveBeenCalledWith(externalUrl);
        expect(mockRemoveDeferredDeepLink).toHaveBeenCalled();
      });
    });

    it('enables side panel as default and navigates home when auto-completing without a user gesture', async () => {
      const browserMock = jest.requireMock('webextension-polyfill');
      (browserMock.tabs.query as jest.Mock).mockResolvedValue([
        { windowId: 1, id: 1 },
      ]);
      (browserMock.sidePanel.open as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        mockState,
      );

      await act(async () => {
        await result.current.completeOnboarding(true);
      });

      await waitFor(() => {
        expect(browserMock.sidePanel.open).not.toHaveBeenCalled();
        expect(mockSetPreference).toHaveBeenCalledWith(
          'useSidePanelAsDefault',
          true,
        );
        expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
        expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
      });
    });

    it('uses popup redirect handling when auto-completing with a Redirect deferred deep link', async () => {
      const externalUrl = 'https://external-app.com/callback';
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue({
        type: DeferredDeepLinkRouteType.Redirect,
        url: externalUrl,
      });

      const mockAssign = jest.fn();
      Object.defineProperty(window, 'location', {
        value: {
          assign: mockAssign,
        },
        writable: true,
      });

      const browserMock = jest.requireMock('webextension-polyfill');
      (browserMock.tabs.query as jest.Mock).mockResolvedValue([
        { windowId: 1, id: 1 },
      ]);
      (browserMock.sidePanel.open as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        {
          ...mockState,
          metamask: {
            ...mockState.metamask,
            deferredDeepLink: {
              createdAt: Date.now(),
              referringLink: 'https://link.metamask.io/buy',
            },
          },
        },
      );

      await act(async () => {
        await result.current.completeOnboarding(true);
      });

      await waitFor(() => {
        expect(browserMock.sidePanel.open).not.toHaveBeenCalled();
        expect(mockAssign).not.toHaveBeenCalled();
        expect(windowOpenSpy).toHaveBeenCalledWith(externalUrl, '_blank');
        expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
        expect(mockRemoveDeferredDeepLink).toHaveBeenCalled();
        expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
      });
    });

    it('falls through to popup completion when opening the side panel fails', async () => {
      const browserMock = jest.requireMock('webextension-polyfill');
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      (browserMock.tabs.query as jest.Mock).mockResolvedValue([
        { windowId: 1, id: 1 },
      ]);
      (browserMock.sidePanel.open as jest.Mock).mockRejectedValue(
        new Error(
          '`sidePanel.open()` may only be called in response to a user gesture.',
        ),
      );

      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        mockState,
      );

      await act(async () => {
        await result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(mockSetPreference).not.toHaveBeenCalledWith(
          'useSidePanelAsDefault',
          true,
        );
        expect(mockCompleteOnboarding).toHaveBeenCalled();
        expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
      });
      consoleErrorSpy.mockRestore();
    });

    it('skips side panel opening when deferred deep link with Navigate type is present', async () => {
      const testRoute = '/home';
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue({
        type: DeferredDeepLinkRouteType.Navigate,
        route: testRoute,
      });

      const browserMock = jest.requireMock('webextension-polyfill');
      (browserMock.tabs.query as jest.Mock).mockResolvedValue([
        { windowId: 1, id: 1 },
      ]);
      (browserMock.sidePanel.open as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        {
          ...mockState,
          metamask: {
            ...mockState.metamask,
            deferredDeepLink: {
              createdAt: Date.now(),
              referringLink: 'https://example.com/deferred?path=/home',
            },
          },
        },
      );

      await act(async () => {
        await result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(browserMock.sidePanel.open).not.toHaveBeenCalled();
        expect(mockUseNavigate).toHaveBeenCalledWith(testRoute);
        expect(mockRemoveDeferredDeepLink).toHaveBeenCalled();
      });
    });

    it('opens side panel when deferred deep link route result is null', async () => {
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue(
        null,
      );

      const browserMock = jest.requireMock('webextension-polyfill');
      (browserMock.tabs.query as jest.Mock).mockResolvedValue([
        { windowId: 1, id: 1 },
      ]);
      (browserMock.sidePanel.open as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        {
          ...mockState,
          metamask: {
            ...mockState.metamask,
            deferredDeepLink: {
              createdAt: Date.now() - 2 * 60 * 60 * 1000,
              referringLink: 'https://example.com/deferred',
            },
          },
        },
      );

      await act(async () => {
        await result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(browserMock.sidePanel.open).toHaveBeenCalledWith({
          windowId: 1,
        });
        expect(mockUseNavigate).not.toHaveBeenCalled();
      });
    });

    it('skips side panel opening and navigates to interstitial page for Interstitial type (unsigned/invalid signature)', async () => {
      const urlPathAndQuery = '/swap?amount=100';
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue({
        type: DeferredDeepLinkRouteType.Interstitial,
        urlPathAndQuery,
      });
      (deepLinkUtils.buildInterstitialRoute as jest.Mock).mockReturnValue(
        `${DEEP_LINK_ROUTE}?u=%2Fswap%3Famount%3D100`,
      );

      const browserMock = jest.requireMock('webextension-polyfill');
      (browserMock.tabs.query as jest.Mock).mockResolvedValue([
        { windowId: 1, id: 1 },
      ]);
      (browserMock.sidePanel.open as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        {
          ...mockState,
          metamask: {
            ...mockState.metamask,
            deferredDeepLink: {
              createdAt: Date.now(),
              referringLink: 'https://link.metamask.io/swap?amount=100',
            },
          },
        },
      );

      await act(async () => {
        await result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(browserMock.sidePanel.open).not.toHaveBeenCalled();
        expect(deepLinkUtils.buildInterstitialRoute).toHaveBeenCalledWith(
          urlPathAndQuery,
        );
        expect(mockUseNavigate).toHaveBeenCalledWith(
          `${DEEP_LINK_ROUTE}?u=%2Fswap%3Famount%3D100`,
        );
        expect(mockRemoveDeferredDeepLink).toHaveBeenCalled();
      });
    });
  });

  describe('Deferred Deep Link - Side Panel Disabled', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockUseNavigate.mockClear();
      (
        useSidePanelEnabledHook.useSidePanelEnabled as jest.Mock
      ).mockReturnValue(false);
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue(
        null,
      );
    });

    it('redirects to external URL with _blank target when deferred deep link has Redirect type and side panel is disabled', async () => {
      const externalUrl = 'https://external-app.com/callback';
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue({
        type: DeferredDeepLinkRouteType.Redirect,
        url: externalUrl,
      });

      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        {
          ...mockState,
          metamask: {
            ...mockState.metamask,
            deferredDeepLink: {
              createdAt: Date.now(),
              referringLink: 'https://link.metamask.io/buy',
            },
          },
        },
      );

      await act(async () => {
        await result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(windowOpenSpy).toHaveBeenCalledWith(externalUrl, '_blank');
        expect(mockRemoveDeferredDeepLink).toHaveBeenCalled();
      });
    });

    it('navigates to internal route when deferred deep link has Navigate type and side panel is disabled', async () => {
      const testRoute = '/swap';
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue({
        type: DeferredDeepLinkRouteType.Navigate,
        route: testRoute,
      });

      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        {
          ...mockState,
          metamask: {
            ...mockState.metamask,
            deferredDeepLink: {
              createdAt: Date.now(),
              referringLink: 'https://link.metamask.io/swap',
            },
          },
        },
      );

      await act(async () => {
        await result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(testRoute);
        expect(mockRemoveDeferredDeepLink).toHaveBeenCalled();
      });
    });

    it('waits for deep link tracking before navigating', async () => {
      let resolveTrackEvent: () => void = () => undefined;
      mockTrackEvent.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveTrackEvent = resolve;
        }),
      );
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue({
        type: DeferredDeepLinkRouteType.Navigate,
        route: '/swap',
        signature: MISSING,
      });

      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        {
          ...mockState,
          metamask: {
            ...mockState.metamask,
            completedOnboarding: true,
            deferredDeepLink: {
              createdAt: Date.now(),
              referringLink: 'https://link.metamask.io/swap',
            },
          },
        },
      );

      let completionPromise!: Promise<void>;
      act(() => {
        completionPromise = result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      });
      expect(mockUseNavigate).not.toHaveBeenCalled();

      await act(async () => {
        resolveTrackEvent();
        await completionPromise;
      });

      expect(mockUseNavigate).toHaveBeenCalledWith('/swap');
    });

    it('navigates to DEFAULT_ROUTE when deferred deep link result is null and side panel is disabled', async () => {
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue(
        null,
      );

      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        {
          ...mockState,
          metamask: {
            ...mockState.metamask,
            deferredDeepLink: {
              createdAt: Date.now() - 2 * 60 * 60 * 1000,
              referringLink: 'https://link.metamask.io/swap',
            },
          },
        },
      );

      await act(async () => {
        await result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
      });
    });

    it('navigates to DEFAULT_ROUTE when no deferred deep link is available and side panel is disabled', async () => {
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue(
        null,
      );

      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        {
          ...mockState,
          metamask: {
            ...mockState.metamask,
            deferredDeepLink: null,
          },
        },
      );

      await act(async () => {
        await result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
      });
    });

    it('navigates to interstitial page for Interstitial type (unsigned/invalid signature) when side panel is disabled', async () => {
      const urlPathAndQuery = '/swap?amount=100';
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue({
        type: DeferredDeepLinkRouteType.Interstitial,
        urlPathAndQuery,
      });
      (deepLinkUtils.buildInterstitialRoute as jest.Mock).mockReturnValue(
        `${DEEP_LINK_ROUTE}?u=%2Fswap%3Famount%3D100`,
      );

      const { result } = renderHookWithProvider(
        () => useOnboardingCompletion(),
        {
          ...mockState,
          metamask: {
            ...mockState.metamask,
            deferredDeepLink: {
              createdAt: Date.now(),
              referringLink: 'https://link.metamask.io/swap?amount=100',
            },
          },
        },
      );

      await act(async () => {
        await result.current.completeOnboarding();
      });

      await waitFor(() => {
        expect(deepLinkUtils.buildInterstitialRoute).toHaveBeenCalledWith(
          urlPathAndQuery,
        );
        expect(mockUseNavigate).toHaveBeenCalledWith(
          `${DEEP_LINK_ROUTE}?u=%2Fswap%3Famount%3D100`,
        );
        expect(mockRemoveDeferredDeepLink).toHaveBeenCalled();
      });
    });
  });
});
