import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  DEFAULT_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
} from '../../../helpers/constants/routes';
import { DeferredDeepLinkRouteType } from '../../../../shared/lib/deep-links/types';
import * as deepLinkUtils from '../../../../shared/lib/deep-links/utils';
import * as useSidePanelEnabledHook from '../../../hooks/useSidePanelEnabled';
import { setBackgroundConnection } from '../../../store/background-connection';
import CreationSuccessful from './creation-successful';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => ({ search: '' }),
  };
});

jest.mock('./wallet-ready-animation', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => <div data-testid="wallet-ready-animation" />,
}));

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

// Mock background connection to prevent "Background connection not initialized" warnings
const mockRemoveDeferredDeepLink = jest.fn().mockResolvedValue(undefined);
const backgroundConnectionMock = new Proxy(
  {
    removeDeferredDeepLink: mockRemoveDeferredDeepLink,
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

describe('Wallet Ready Page', () => {
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
      deferredDeepLink: null,
    },
    appState: {
      externalServicesOnboardingToggleState: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockClear();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('should render the wallet ready content if the seed phrase is backed up', () => {
    const mockStore = configureMockStore([thunk])(mockState);
    const { getByText } = renderWithProvider(<CreationSuccessful />, mockStore);

    expect(getByText('Your wallet is ready!')).toBeInTheDocument();
  });

  it('should render the wallet ready content if the seed phrase is not backed up', () => {
    const mockStore = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        seedPhraseBackedUp: false,
      },
    });
    const { getByText } = renderWithProvider(<CreationSuccessful />, mockStore);

    expect(getByText('Your wallet is ready!')).toBeInTheDocument();
  });

  it('should redirect to privacy-settings view when "Manage default settings" button is clicked', () => {
    const mockStore = configureMockStore([thunk])(mockState);
    const { getByText } = renderWithProvider(<CreationSuccessful />, mockStore);
    const privacySettingsButton = getByText('Manage default settings');
    fireEvent.click(privacySettingsButton);
    expect(mockUseNavigate).toHaveBeenCalledWith(
      ONBOARDING_PRIVACY_SETTINGS_ROUTE,
    );
  });

  it('should route to pin extension route when "Done" button is clicked', async () => {
    const mockStore = configureMockStore([thunk])(mockState);
    const { getByTestId } = renderWithProvider(
      <CreationSuccessful />,
      mockStore,
    );
    const doneButton = getByTestId('onboarding-complete-done');
    fireEvent.click(doneButton);
    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });

  describe('Deferred Deep Link - Side Panel Enabled', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockUseNavigate.mockClear();
      (
        useSidePanelEnabledHook.useSidePanelEnabled as jest.Mock
      ).mockReturnValue(true);
    });

    it('should open side panel and redirect to external URL with _self target when deferred deep link has Redirect type', async () => {
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

      const mockStore = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          deferredDeepLink: {
            createdAt: Date.now(),
            referringLink:
              'https://example.com/deferred?redirectTo=https://external-app.com/callback',
          },
        },
      });

      const { getByTestId } = renderWithProvider(
        <CreationSuccessful />,
        mockStore,
      );

      const doneButton = getByTestId('onboarding-complete-done');
      fireEvent.click(doneButton);

      await waitFor(() => {
        expect(browserMock.sidePanel.open).toHaveBeenCalledWith({
          windowId: 1,
        });
        expect(mockAssign).toHaveBeenCalledWith(externalUrl);
        expect(mockRemoveDeferredDeepLink).toHaveBeenCalled();
      });
    });

    it('should skip side panel opening when deferred deep link with Navigate type is present', async () => {
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

      const mockStore = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          deferredDeepLink: {
            createdAt: Date.now(),
            referringLink: 'https://example.com/deferred?path=/home',
          },
        },
      });

      const { getByTestId } = renderWithProvider(
        <CreationSuccessful />,
        mockStore,
      );

      const doneButton = getByTestId('onboarding-complete-done');
      fireEvent.click(doneButton);

      await waitFor(() => {
        // The side panel should NOT be opened when a deferred deep link has the 'Navigate' type
        expect(browserMock.sidePanel.open).not.toHaveBeenCalled();
        expect(mockUseNavigate).toHaveBeenCalledWith(testRoute);
        expect(mockRemoveDeferredDeepLink).toHaveBeenCalled();
      });
    });

    it('should open side panel when deferred deep link route result is null', async () => {
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue(
        null,
      );

      const browserMock = jest.requireMock('webextension-polyfill');
      (browserMock.tabs.query as jest.Mock).mockResolvedValue([
        { windowId: 1, id: 1 },
      ]);
      (browserMock.sidePanel.open as jest.Mock).mockResolvedValue(undefined);

      const mockStore = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          deferredDeepLink: {
            createdAt: Date.now() - 2 * 60 * 60 * 1000, // Expired link
            referringLink: 'https://example.com/deferred',
          },
        },
      });

      const { getByTestId } = renderWithProvider(
        <CreationSuccessful />,
        mockStore,
      );

      const doneButton = getByTestId('onboarding-complete-done');
      fireEvent.click(doneButton);

      await waitFor(() => {
        // Side panel should be opened when deferred deep link is null
        expect(browserMock.sidePanel.open).toHaveBeenCalledWith({
          windowId: 1,
        });
        expect(mockUseNavigate).not.toHaveBeenCalled();
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
    });

    it('should redirect to external URL with _blank target when deferred deep link has Redirect type and side panel is disabled', async () => {
      const externalUrl = 'https://external-app.com/callback';
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue({
        type: DeferredDeepLinkRouteType.Redirect,
        url: externalUrl,
      });

      const windowOpenSpy = jest
        .spyOn(window, 'open')
        .mockImplementation(() => null);

      const mockStore = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          deferredDeepLink: {
            createdAt: Date.now(),
            referringLink: 'https://link.metamask.io/buy',
          },
        },
      });

      const { getByTestId } = renderWithProvider(
        <CreationSuccessful />,
        mockStore,
      );

      const doneButton = getByTestId('onboarding-complete-done');
      fireEvent.click(doneButton);

      await waitFor(() => {
        expect(windowOpenSpy).toHaveBeenCalledWith(externalUrl, '_blank');
        expect(mockRemoveDeferredDeepLink).toHaveBeenCalled();
      });

      windowOpenSpy.mockRestore();
    });

    it('should navigate to internal route when deferred deep link has Navigate type and side panel is disabled', async () => {
      const testRoute = '/swap';
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue({
        type: DeferredDeepLinkRouteType.Navigate,
        route: testRoute,
      });

      const mockStore = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          deferredDeepLink: {
            createdAt: Date.now(),
            referringLink: 'https://link.metamask.io/swap',
          },
        },
      });

      const { getByTestId } = renderWithProvider(
        <CreationSuccessful />,
        mockStore,
      );

      const doneButton = getByTestId('onboarding-complete-done');
      fireEvent.click(doneButton);

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(testRoute);
        expect(mockRemoveDeferredDeepLink).toHaveBeenCalled();
      });
    });

    it('should navigate to DEFAULT_ROUTE when deferred deep link result is null and side panel is disabled', async () => {
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue(
        null,
      );

      const mockStore = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          deferredDeepLink: {
            createdAt: Date.now() - 2 * 60 * 60 * 1000, // Expired link
            referringLink: 'https://link.metamask.io/swap',
          },
        },
      });

      const { getByTestId } = renderWithProvider(
        <CreationSuccessful />,
        mockStore,
      );

      const doneButton = getByTestId('onboarding-complete-done');
      fireEvent.click(doneButton);

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
      });
    });

    it('should navigate to DEFAULT_ROUTE when no deferred deep link is available and side panel is disabled', async () => {
      (deepLinkUtils.getDeferredDeepLinkRoute as jest.Mock).mockResolvedValue(
        null,
      );

      const mockStore = configureMockStore([thunk])({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          deferredDeepLink: null,
        },
      });

      const { getByTestId } = renderWithProvider(
        <CreationSuccessful />,
        mockStore,
      );

      const doneButton = getByTestId('onboarding-complete-done');
      fireEvent.click(doneButton);

      await waitFor(() => {
        expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
      });
    });
  });
});
