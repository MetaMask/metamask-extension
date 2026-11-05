import { it } from '@jest/globals';
import { act } from '@testing-library/react';
import { IconName } from '@metamask/design-system-react';
import mockState from '../../test/data/mock-state.json';
import { renderHookWithProviderTyped } from '../../test/lib/render-helpers-navigate';
import { ScreenViewedEntryPoint } from '../../shared/constants/metametrics';
import {
  ACTIVITY_ROUTE,
  DEFAULT_ROUTE,
  MONEY_HOME_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
} from '../helpers/constants/routes';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
} from '../pages/money/constants/money-events';
import type { MoneyAccountAvailability } from './money/use-money-account-availability';
import { useMoneyAnalytics } from './money/useMoneyAnalytics';
import { createMoneyAnalyticsMock } from './money/useMoneyAnalytics.mock';
import { useMainNavItems } from './useMainNavItems';
import type { MainNavItem, MainNavItemId } from './useMainNavItems';

const mockNavigate = jest.fn();
const mockUseMoneyAccountAvailability: jest.MockedFunction<
  () => { availability: MoneyAccountAvailability }
> = jest.fn(() => ({
  availability: {
    isAvailable: true,
    address: '0x0000000000000000000000000000000000000001',
  },
}));

jest.mock('./money/use-money-account-availability', () => ({
  useMoneyAccountAvailability: () => mockUseMoneyAccountAvailability(),
}));

const mockMoneyAnalytics = createMoneyAnalyticsMock();
jest.mock('./money/useMoneyAnalytics', () => ({
  useMoneyAnalytics: jest.fn(),
}));
const mockUseMoneyAnalytics = jest.mocked(useMoneyAnalytics);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../shared/lib/environment', () => ({
  ...jest.requireActual('../../shared/lib/environment'),
  getIsPerpsIncludedInBuild: jest.fn(() => true),
}));

const createState = ({
  isPerpsEnabled = true,
  defaultHomeActiveTabName,
}: {
  isPerpsEnabled?: boolean;
  defaultHomeActiveTabName?: string;
} = {}) => ({
  metamask: {
    ...mockState.metamask,
    completedOnboarding: true,
    defaultHomeActiveTabName,
    remoteFeatureFlags: {
      ...mockState.metamask.remoteFeatureFlags,
      perpsEnabledVersion: { enabled: isPerpsEnabled, minimumVersion: '0.0.1' },
    },
  },
});

const renderUseMainNavItems = (
  state = createState(),
  pathname = DEFAULT_ROUTE,
) => renderHookWithProviderTyped(() => useMainNavItems(), state, pathname);

const getItem = (items: MainNavItem[], id: MainNavItemId): MainNavItem => {
  const item = items.find((navItem) => navItem.id === id);
  if (!item) {
    throw new Error(`Nav item "${id}" not found`);
  }
  return item;
};

describe('useMainNavItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: {
        isAvailable: true,
        address: '0x0000000000000000000000000000000000000001',
      },
    });
    mockUseMoneyAnalytics.mockReturnValue(mockMoneyAnalytics);
  });

  describe('items', () => {
    it('returns Home, Perps, Money and Activity in order with labels', () => {
      const { result } = renderUseMainNavItems();

      expect(
        result.current.map(({ id, label }) => ({ id, label })),
      ).toStrictEqual([
        { id: 'home', label: 'Home' },
        { id: 'perps', label: 'Perps' },
        { id: 'money', label: 'Money' },
        { id: 'activity', label: 'Activity' },
      ]);
    });

    it('omits Perps when Perps is unavailable', () => {
      const { result } = renderUseMainNavItems(
        createState({ isPerpsEnabled: false }),
      );

      expect(result.current.map(({ id }) => id)).toStrictEqual([
        'home',
        'money',
        'activity',
      ]);
    });

    it('omits Money when the Money Account is unavailable', () => {
      mockUseMoneyAccountAvailability.mockReturnValue({
        availability: { isAvailable: false },
      });

      const { result } = renderUseMainNavItems();

      expect(result.current.map(({ id }) => id)).toStrictEqual([
        'home',
        'perps',
        'activity',
      ]);
    });
  });

  describe('active item', () => {
    it.each<[MainNavItemId, string]>([
      ['home', DEFAULT_ROUTE],
      ['perps', PERPS_HOME_PAGE_ROUTE],
      ['money', MONEY_HOME_ROUTE],
      ['activity', ACTIVITY_ROUTE],
    ])('marks only %s as active on %s', (activeId, route) => {
      const { result } = renderUseMainNavItems(createState(), route);

      expect(
        result.current.filter(({ isActive }) => isActive).map(({ id }) => id),
      ).toStrictEqual([activeId]);
    });

    it('returns filled icons for the active item and outlined icons otherwise', () => {
      const { result: homeResult } = renderUseMainNavItems(
        createState(),
        DEFAULT_ROUTE,
      );
      const { result: activityResult } = renderUseMainNavItems(
        createState(),
        ACTIVITY_ROUTE,
      );

      expect(getItem(homeResult.current, 'home').icon).toBe(
        IconName.HomeFilled,
      );
      expect(getItem(homeResult.current, 'activity').icon).toBe(IconName.Clock);
      expect(getItem(activityResult.current, 'home').icon).toBe(IconName.Home);
      expect(getItem(activityResult.current, 'activity').icon).toBe(
        IconName.ClockFilled,
      );
    });
  });

  describe('onClick', () => {
    it('navigates to the root route on Home click when no last tab is stored', () => {
      const { result } = renderUseMainNavItems(createState(), ACTIVITY_ROUTE);

      act(() => getItem(result.current, 'home').onClick());

      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        state: {
          entryPoint: ScreenViewedEntryPoint.BottomNavClick,
          stayOnHomePage: true,
        },
      });
    });

    it('navigates to the last active tab on Home click when a tab is stored', () => {
      const { result } = renderUseMainNavItems(
        createState({ defaultHomeActiveTabName: 'nfts' }),
        ACTIVITY_ROUTE,
      );

      act(() => getItem(result.current, 'home').onClick());

      expect(mockNavigate).toHaveBeenCalledWith(`${DEFAULT_ROUTE}?tab=nfts`, {
        state: {
          entryPoint: ScreenViewedEntryPoint.BottomNavClick,
          stayOnHomePage: true,
        },
      });
    });

    it('navigates to the perps home page on Perps click', () => {
      const { result } = renderUseMainNavItems();

      act(() => getItem(result.current, 'perps').onClick());

      expect(mockNavigate).toHaveBeenCalledWith(PERPS_HOME_PAGE_ROUTE, {
        state: { stayOnHomePage: true },
      });
    });

    it('navigates to Money Home and tracks the click on Money click', () => {
      const { result } = renderUseMainNavItems();

      act(() => getItem(result.current, 'money').onClick());

      expect(mockNavigate).toHaveBeenCalledWith(MONEY_HOME_ROUTE, {
        state: { stayOnHomePage: true },
      });
      expect(mockUseMoneyAnalytics).toHaveBeenCalledWith({
        componentName: MoneyComponentName.HomeTab,
      });
      expect(mockMoneyAnalytics.trackButtonClicked).toHaveBeenCalledWith({
        buttonType: MoneyButtonType.Text,
        buttonIntent: MoneyButtonIntent.GoToMoneyHome,
        labelKey: 'money',
        redirectTarget: MoneyScreenName.MoneyHome,
      });
    });

    it('navigates to the activity route on Activity click', () => {
      const { result } = renderUseMainNavItems();

      act(() => getItem(result.current, 'activity').onClick());

      expect(mockNavigate).toHaveBeenCalledWith(ACTIVITY_ROUTE, {
        state: {
          entryPoint: ScreenViewedEntryPoint.BottomNavClick,
          stayOnHomePage: true,
        },
      });
    });
  });
});
