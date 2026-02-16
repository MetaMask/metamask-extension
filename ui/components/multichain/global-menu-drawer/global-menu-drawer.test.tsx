import React from 'react';
import { fireEvent, waitFor } from '../../../../test/jest';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import {
  GATOR_PERMISSIONS,
  PERMISSIONS,
} from '../../../helpers/constants/routes';
import { isGatorPermissionsRevocationFeatureEnabled } from '../../../../shared/modules/environment';
import { GlobalMenuDrawer } from './global-menu-drawer';
import { GlobalMenuDrawerWithList } from './global-menu-drawer-with-list';

// eslint-disable-next-line import/no-restricted-paths
const getEnvironmentType = jest.requireMock('../../../../app/scripts/lib/util')
  .getEnvironmentType as jest.Mock;

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../../shared/modules/environment');

jest.mock('../../../hooks/useSidePanelEnabled', () => ({
  useSidePanelEnabled: jest.fn(() => false),
}));

jest.mock('../../../../shared/modules/browser-runtime.utils', () => ({
  ...jest.requireActual('../../../../shared/modules/browser-runtime.utils'),
  getBrowserName: jest.fn(() => 'Chrome'),
}));

jest.mock('../../../hooks/useBrowserSupportsSidePanel', () => ({
  useBrowserSupportsSidePanel: jest.fn(() => false),
}));

jest.mock('../../../hooks/shield/metrics/useSubscriptionMetrics', () => ({
  useSubscriptionMetrics: jest.fn(() => ({
    captureCommonExistingShieldSubscriptionEvents: jest.fn(),
  })),
}));

jest.mock('../../../hooks/subscription/useSubscription', () => ({
  useUserSubscriptions: jest.fn(() => ({ subscriptions: [] })),
}));

jest.mock('../notifications-tag-counter', () => ({
  NotificationsTagCounter: () => <span data-testid="notifications-tag" />,
}));

jest.mock('../../../pages/notifications/NewFeatureTag', () => ({
  NewFeatureTag: () => null,
}));

describe('GlobalMenuDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEnvironmentType.mockReturnValue('popup');
  });

  it('renders children when open', async () => {
    const onClose = jest.fn();
    const { getByText, getByTestId } = renderWithProvider(
      <GlobalMenuDrawer
        isOpen
        onClose={onClose}
        data-testid="global-menu-drawer"
      >
        <span>Drawer content</span>
      </GlobalMenuDrawer>,
      configureStore(mockState),
      '/',
    );

    await waitFor(() => {
      expect(getByText('Drawer content')).toBeInTheDocument();
    });

    expect(getByTestId('global-menu-drawer')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    const { getByTestId } = renderWithProvider(
      <GlobalMenuDrawer
        isOpen
        onClose={onClose}
        data-testid="global-menu-drawer"
      >
        <span>Content</span>
      </GlobalMenuDrawer>,
      configureStore(mockState),
      '/',
    );

    await waitFor(() => {
      expect(getByTestId('drawer-close-button')).toBeInTheDocument();
    });

    fireEvent.click(getByTestId('drawer-close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', async () => {
    const onClose = jest.fn();
    renderWithProvider(
      <GlobalMenuDrawer
        isOpen
        onClose={onClose}
        data-testid="global-menu-drawer"
      >
        <span>Content</span>
      </GlobalMenuDrawer>,
      configureStore(mockState),
      '/',
    );

    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="global-menu-drawer"]'),
      ).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when isOpen is false', () => {
    const onClose = jest.fn();
    const { queryByTestId } = renderWithProvider(
      <GlobalMenuDrawer
        isOpen={false}
        onClose={onClose}
        data-testid="global-menu-drawer"
      >
        <span>Content</span>
      </GlobalMenuDrawer>,
      configureStore(mockState),
      '/',
    );

    expect(queryByTestId('global-menu-drawer')).not.toBeInTheDocument();
  });
});

describe('GlobalMenuDrawerWithList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEnvironmentType.mockReturnValue('popup');
    jest
      .mocked(isGatorPermissionsRevocationFeatureEnabled)
      .mockReturnValue(false);
  });

  it('renders menu list when open', async () => {
    const onClose = jest.fn();
    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        transactions: [],
      },
    });
    const { getByTestId } = renderWithProvider(
      <GlobalMenuDrawerWithList
        isOpen
        onClose={onClose}
        data-testid="global-menu-drawer"
      />,
      store,
      '/',
    );

    await waitFor(
      () => {
        expect(getByTestId('global-menu-connected-sites')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(getByTestId('global-menu-drawer')).toBeInTheDocument();
  });

  it('connected sites link includes from param when at default route and Gator feature enabled', async () => {
    jest
      .mocked(isGatorPermissionsRevocationFeatureEnabled)
      .mockReturnValue(true);

    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        transactions: [],
      },
    });
    const { getByTestId } = renderWithProvider(
      <GlobalMenuDrawerWithList
        isOpen
        onClose={() => undefined}
        data-testid="global-menu-drawer"
      />,
      store,
      '/',
    );

    await waitFor(() => {
      const link = getByTestId('global-menu-connected-sites');
      expect(link).toBeInTheDocument();
      expect(link.getAttribute('href')).toContain(GATOR_PERMISSIONS);
      expect(link.getAttribute('href')).toContain('from=%2F');
    });
  });

  it('connected sites link includes from param when at default route and Gator feature disabled', async () => {
    jest
      .mocked(isGatorPermissionsRevocationFeatureEnabled)
      .mockReturnValue(false);

    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        transactions: [],
      },
    });
    const { getByTestId } = renderWithProvider(
      <GlobalMenuDrawerWithList
        isOpen
        onClose={() => undefined}
        data-testid="global-menu-drawer"
      />,
      store,
      '/',
    );

    await waitFor(() => {
      const link = getByTestId('global-menu-connected-sites');
      expect(link).toBeInTheDocument();
      expect(link.getAttribute('href')).toContain(PERMISSIONS);
      expect(link.getAttribute('href')).toContain('from=%2F');
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        transactions: [],
      },
    });
    const { getByTestId } = renderWithProvider(
      <GlobalMenuDrawerWithList
        isOpen
        onClose={onClose}
        data-testid="global-menu-drawer"
      />,
      store,
      '/',
    );

    await waitFor(() => {
      expect(getByTestId('drawer-close-button')).toBeInTheDocument();
    });

    fireEvent.click(getByTestId('drawer-close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
