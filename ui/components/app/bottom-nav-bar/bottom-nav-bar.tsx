import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ACTIVITY_ROUTE,
  DEFAULT_ROUTE,
  PERPS_HOME_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
import { MetaMetricsSwapsEventSource } from '../../../../shared/constants/metametrics';
import { getIsPerpsExperienceAvailable } from '../../../selectors/perps/feature-flags';
import { getDefaultHomeActiveTabName } from '../../../selectors';
import useBridging from '../../../hooks/bridge/useBridging';
import { getActiveBottomNavTabs } from './bottom-nav-bar.utils';

type NavTabProps = {
  isActive: boolean;
  icon: IconName;
  label: string;
  onClick: () => void;
  'data-testid'?: string;
};

const NavTab = ({
  isActive,
  icon,
  label,
  onClick,
  'data-testid': testId,
}: NavTabProps) => {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className="group/tab flex flex-1 flex-col gap-1 items-center justify-center"
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
    >
      <Icon
        name={icon}
        size={IconSize.Lg}
        color={isActive ? IconColor.IconDefault : IconColor.IconAlternative}
        className="group-hover/tab:text-icon-default-hover"
      />
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={isActive ? TextColor.TextDefault : TextColor.TextAlternative}
        className="group-hover/tab:text-text-default"
      >
        {label}
      </Text>
    </button>
  );
};

export function BottomNavBar() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isPerpsAvailable = useSelector(getIsPerpsExperienceAvailable);
  const lastActiveTab = useSelector(getDefaultHomeActiveTabName);
  const { openBridgeExperience } = useBridging();

  const { isHome, isPerps, isSwaps, isActivity } =
    getActiveBottomNavTabs(pathname);

  const handleHomeClick = useCallback(
    () =>
      navigate(
        lastActiveTab ? `${DEFAULT_ROUTE}?tab=${lastActiveTab}` : DEFAULT_ROUTE,
      ),
    [navigate, lastActiveTab],
  );

  const handlePerpsClick = useCallback(
    () => navigate(PERPS_HOME_PAGE_ROUTE),
    [navigate],
  );

  const handleSwapsClick = useCallback(
    () => openBridgeExperience(MetaMetricsSwapsEventSource.BottomNavBar),
    [openBridgeExperience],
  );

  const handleActivityClick = useCallback(
    () => navigate(ACTIVITY_ROUTE),
    [navigate],
  );

  return (
    <nav
      data-testid="bottom-nav-bar"
      className="bottom-nav-bar w-full bg-background-default border-t border-border-muted flex flex-row justify-between p-2 gap-2 z-[100]"
      style={{ viewTransitionName: 'bottom-nav-bar' }}
    >
      <NavTab
        isActive={isHome}
        icon={isHome ? IconName.HomeFilled : IconName.Home}
        label={t('home')}
        onClick={handleHomeClick}
        data-testid="bottom-nav-home"
      />
      {isPerpsAvailable && (
        <NavTab
          isActive={isPerps}
          icon={IconName.Candlestick}
          label={t('perps')}
          onClick={handlePerpsClick}
          data-testid="bottom-nav-perps"
        />
      )}
      <NavTab
        isActive={isSwaps}
        icon={IconName.SwapVertical}
        label={t('swap')}
        onClick={handleSwapsClick}
        data-testid="bottom-nav-swaps"
      />
      <NavTab
        isActive={isActivity}
        icon={isActivity ? IconName.ClockFilled : IconName.Clock}
        label={t('activity')}
        onClick={handleActivityClick}
        data-testid="bottom-nav-activity"
      />
    </nav>
  );
}
