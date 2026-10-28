import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { IconName } from '@metamask/design-system-react';
import { transitionForward } from '../components/ui/transition';
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
import { getDefaultHomeActiveTabName } from '../selectors';
import { getIsPerpsExperienceAvailable } from '../selectors/perps/feature-flags';
import { useMoneyAccountAvailability } from './money/use-money-account-availability';
import { useMoneyAnalytics } from './money/useMoneyAnalytics';
import { useI18nContext } from './useI18nContext';

export type MainNavItemId = 'home' | 'perps' | 'money' | 'activity';

export type MainNavItem = {
  id: MainNavItemId;
  label: string;
  icon: IconName;
  isActive: boolean;
  onClick: () => void;
};

/**
 * Returns the main navigation items (Home, Perps, Money, Activity).
 * Used by surfaces that render the main navigation (e.g. bottom nav bar)
 * to keep the availability, navigation and analytics in one place.
 *
 * @returns The available main navigation items, in display order.
 */
export function useMainNavItems(): MainNavItem[] {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isPerpsAvailable = useSelector(getIsPerpsExperienceAvailable);
  const { availability: moneyAccountAvailability } =
    useMoneyAccountAvailability();
  const lastActiveTab = useSelector(getDefaultHomeActiveTabName);
  const { trackButtonClicked: trackMoneyButtonClicked } = useMoneyAnalytics({
    componentName: MoneyComponentName.HomeTab,
  });

  const isHome = pathname === DEFAULT_ROUTE;
  const isPerps = pathname === PERPS_HOME_PAGE_ROUTE;
  const isMoney = pathname === MONEY_HOME_ROUTE;
  const isActivity = pathname === ACTIVITY_ROUTE;

  const handleHomeClick = useCallback(() => {
    transitionForward(() =>
      navigate(
        lastActiveTab ? `${DEFAULT_ROUTE}?tab=${lastActiveTab}` : DEFAULT_ROUTE,
        {
          state: {
            entryPoint: ScreenViewedEntryPoint.BottomNavClick,
            stayOnHomePage: true,
          },
        },
      ),
    );
  }, [navigate, lastActiveTab]);

  const handlePerpsClick = useCallback(() => {
    transitionForward(() =>
      navigate(PERPS_HOME_PAGE_ROUTE, { state: { stayOnHomePage: true } }),
    );
  }, [navigate]);

  const handleMoneyClick = useCallback(() => {
    trackMoneyButtonClicked({
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.GoToMoneyHome,
      labelKey: 'money',
      redirectTarget: MoneyScreenName.MoneyHome,
    });
    transitionForward(() =>
      navigate(MONEY_HOME_ROUTE, { state: { stayOnHomePage: true } }),
    );
  }, [navigate, trackMoneyButtonClicked]);

  const handleActivityClick = useCallback(() => {
    transitionForward(() =>
      navigate(ACTIVITY_ROUTE, {
        state: {
          entryPoint: ScreenViewedEntryPoint.BottomNavClick,
          stayOnHomePage: true,
        },
      }),
    );
  }, [navigate]);

  const isMoneyAvailable = moneyAccountAvailability.isAvailable;

  return useMemo(() => {
    const items: MainNavItem[] = [
      {
        id: 'home',
        label: t('home'),
        icon: isHome ? IconName.HomeFilled : IconName.Home,
        isActive: isHome,
        onClick: handleHomeClick,
      },
    ];

    if (isPerpsAvailable) {
      items.push({
        id: 'perps',
        label: t('perps'),
        icon: isPerps ? IconName.CandlestickFilled : IconName.Candlestick,
        isActive: isPerps,
        onClick: handlePerpsClick,
      });
    }

    if (isMoneyAvailable) {
      items.push({
        id: 'money',
        label: t('money'),
        icon: IconName.Musd,
        isActive: isMoney,
        onClick: handleMoneyClick,
      });
    }

    items.push({
      id: 'activity',
      label: t('activity'),
      icon: isActivity ? IconName.ClockFilled : IconName.Clock,
      isActive: isActivity,
      onClick: handleActivityClick,
    });

    return items;
  }, [
    t,
    isHome,
    isPerps,
    isMoney,
    isActivity,
    isPerpsAvailable,
    isMoneyAvailable,
    handleHomeClick,
    handlePerpsClick,
    handleMoneyClick,
    handleActivityClick,
  ]);
}
