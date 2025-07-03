import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  useUnreadNotificationsCounter,
  useReadNotificationsCounter,
} from '../../../hooks/metamask-notifications/useCounter';
import { NotificationsTagCounter } from '../notifications-tag-counter';
import { NewFeatureTag } from '../../../pages/notifications/NewFeatureTag';
import {
  SETTINGS_ROUTE,
  DEFAULT_ROUTE,
  NOTIFICATIONS_ROUTE,
  SNAPS_ROUTE,
  PERMISSIONS,
} from '../../../helpers/constants/routes';
import {
  lockMetamask,
  showConfirmTurnOnMetamaskNotifications,
  toggleNetworkMenu,
} from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  selectIsMetamaskNotificationsEnabled,
  selectIsMetamaskNotificationsFeatureSeen,
} from '../../../selectors/metamask-notifications/metamask-notifications';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import {
  Box,
  IconName,
  Popover,
  PopoverPosition,
} from '../../component-library';

import { MenuItem } from '../../ui/menu';

import { SUPPORT_LINK } from '../../../../shared/lib/ui-utils';
///: BEGIN:ONLY_INCLUDE_IF(build-beta,build-flask)
import { SUPPORT_REQUEST_LINK } from '../../../helpers/constants/common';
///: END:ONLY_INCLUDE_IF

import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

import {
  getSelectedInternalAccount,
  getUnapprovedTransactions,
  getAnySnapUpdateAvailable,
  getThirdPartyNotifySnaps,
  getUseExternalServices,
} from '../../../selectors';
import { BorderStyle } from '../../../helpers/constants/design-system';
// import { AccountDetailsMenuItem, ViewExplorerMenuItem } from '../menu-items';

const METRICS_LOCATION = 'Global Menu';

type GlobalMenuProps = {
  closeMenu: () => void;
  anchorElement: HTMLElement | null;
  isOpen: boolean;
};

export const GlobalMenu = ({
  closeMenu,
  anchorElement,
  isOpen,
}: GlobalMenuProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const basicFunctionality = useSelector(getUseExternalServices);

  const history = useHistory();

  const { notificationsUnreadCount } = useUnreadNotificationsCounter();
  const { notificationsReadCount } = useReadNotificationsCounter();

  const account = useSelector(getSelectedInternalAccount);

  const unapprovedTransactions = useSelector(getUnapprovedTransactions);

  const isMetamaskNotificationFeatureSeen = useSelector(
    selectIsMetamaskNotificationsFeatureSeen,
  );

  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);

  const hasUnapprovedTransactions =
    Object.keys(unapprovedTransactions).length > 0;

  /**
   * This condition is used to control whether the client shows the "turn on notifications"
   * modal. This allowed third party users with existing notifications to view their snap
   * notifications without turning on wallet notifications
   *
   * It excludes users with preinstalled notify snaps (e.g. the institutional snap)
   * which have the notify permission, so as to retain the existing workflow
   */

  let hasThirdPartyNotifySnaps = false;
  hasThirdPartyNotifySnaps = useSelector(getThirdPartyNotifySnaps).length > 0;

  // Accessibility improvement for popover
  const lastItemRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const lastItem = lastItemRef.current as HTMLElement;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && !event.shiftKey) {
        event.preventDefault();
        closeMenu();
      }
    };

    if (lastItem) {
      lastItem.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (lastItem) {
        lastItem.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [closeMenu]);

  const handleNotificationsClick = () => {
    const shouldShowEnableModal =
      !hasThirdPartyNotifySnaps && !isMetamaskNotificationsEnabled;

    if (shouldShowEnableModal) {
      trackEvent({
        category: MetaMetricsEventCategory.NotificationsActivationFlow,
        event: MetaMetricsEventName.NotificationsActivated,
        properties: {
          action_type: 'started',
          is_profile_syncing_enabled: isBackupAndSyncEnabled,
        },
      });
      dispatch(showConfirmTurnOnMetamaskNotifications());

      closeMenu();
      return;
    }

    // Otherwise we can navigate to the notifications page
    trackEvent({
      category: MetaMetricsEventCategory.NotificationInteraction,
      event: MetaMetricsEventName.NotificationsMenuOpened,
      properties: {
        unread_count: notificationsUnreadCount,
        read_count: notificationsReadCount,
      },
    });
    history.push(NOTIFICATIONS_ROUTE);
    closeMenu();
  };

  return (
    <Popover
      data-testid="global-menu"
      referenceElement={anchorElement}
      isOpen={isOpen}
      padding={0}
      onClickOutside={closeMenu}
      onPressEscKey={closeMenu}
      style={{
        overflow: 'hidden',
        minWidth: 225,
      }}
      borderStyle={BorderStyle.none}
      position={PopoverPosition.Auto}
    >
      <MenuItem
        iconName={IconName.Setting}
        onClick={() => {
          history.push(SETTINGS_ROUTE);
          trackEvent({
            category: MetaMetricsEventCategory.Navigation,
            event: MetaMetricsEventName.NavSettingsOpened,
            properties: {
              location: METRICS_LOCATION,
            },
          });
          closeMenu();
        }}
        data-testid="global-menu-settings"
      >
        {t('settings')}
      </MenuItem>
      <MenuItem
        iconName={IconName.Wise}
        onClick={() => {
          window.open('https://wise.com/', '_blank');
        }}
        data-testid="global-menu-deposit-wise"
      >
        {t('depositWise')}
      </MenuItem>
      <MenuItem
        iconName={IconName.Headphones}
        onClick={() => {
          window.open('https://www.crypto-bridge.co/jp/#support', '_blank');
        }}
        data-testid="global-menu-contact-us"
      >
        {t('contactUs')}
      </MenuItem>
      <MenuItem
        ref={lastItemRef}
        iconName={IconName.Lock}
        onClick={() => {
          dispatch(lockMetamask());
          history.push(DEFAULT_ROUTE);
          trackEvent({
            category: MetaMetricsEventCategory.Navigation,
            event: MetaMetricsEventName.AppLocked,
            properties: {
              location: METRICS_LOCATION,
            },
          });
          closeMenu();
        }}
        data-testid="global-menu-lock"
      >
        {t('lockCryptoBridge')}
      </MenuItem>
    </Popover>
  );
};
