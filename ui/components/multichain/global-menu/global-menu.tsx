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
  setShowSupportDataConsentModal,
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
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { SUPPORT_LINK } from '../../../../shared/lib/ui-utils';
///: BEGIN:ONLY_INCLUDE_IF(build-beta,build-flask)
import { SUPPORT_REQUEST_LINK } from '../../../helpers/constants/common';
///: END:ONLY_INCLUDE_IF

import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsContextProp,
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
import {
  AlignItems,
  BlockSize,
  BorderColor,
  BorderStyle,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { AccountDetailsMenuItem, ViewExplorerMenuItem } from '../menu-items';

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
  const snapsUpdatesAvailable = useSelector(getAnySnapUpdateAvailable);
  hasThirdPartyNotifySnaps = useSelector(getThirdPartyNotifySnaps).length > 0;

  let supportText = t('support');
  let supportLink = SUPPORT_LINK || '';
  ///: BEGIN:ONLY_INCLUDE_IF(build-beta,build-flask)
  supportText = t('needHelpSubmitTicket');
  supportLink = SUPPORT_REQUEST_LINK || '';
  ///: END:ONLY_INCLUDE_IF

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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          action_type: 'started',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
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
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        unread_count: notificationsUnreadCount,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
      {basicFunctionality && (
        <>
          <MenuItem
            iconName={IconName.Notification}
            onClick={() => handleNotificationsClick()}
            data-testid="notifications-menu-item"
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.spaceBetween}
            >
              {t('notifications')}
              {notificationsUnreadCount === 0 &&
                !isMetamaskNotificationFeatureSeen && <NewFeatureTag />}
              <NotificationsTagCounter />
            </Box>
          </MenuItem>
          <Box
            borderColor={BorderColor.borderMuted}
            width={BlockSize.Full}
            style={{ height: '1px', borderBottomWidth: 0 }}
          ></Box>
        </>
      )}
      {account && (
        <>
          <AccountDetailsMenuItem
            metricsLocation={METRICS_LOCATION}
            closeMenu={closeMenu}
            address={account.address}
          />
          <ViewExplorerMenuItem
            metricsLocation={METRICS_LOCATION}
            closeMenu={closeMenu}
            account={account}
          />
        </>
      )}
      <Box
        borderColor={BorderColor.borderMuted}
        width={BlockSize.Full}
        style={{ height: '1px', borderBottomWidth: 0 }}
      ></Box>
      <MenuItem
        iconName={IconName.SecurityTick}
        onClick={() => {
          history.push(PERMISSIONS);
          trackEvent({
            event: MetaMetricsEventName.NavPermissionsOpened,
            category: MetaMetricsEventCategory.Navigation,
            properties: {
              location: METRICS_LOCATION,
            },
          });
          closeMenu();
        }}
        data-testid="global-menu-connected-sites"
        disabled={hasUnapprovedTransactions}
      >
        {t('allPermissions')}
      </MenuItem>

      {getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN ? null : (
        <MenuItem
          iconName={IconName.Expand}
          onClick={() => {
            global?.platform?.openExtensionInBrowser?.();
            trackEvent({
              event: MetaMetricsEventName.AppWindowExpanded,
              category: MetaMetricsEventCategory.Navigation,
              properties: {
                location: METRICS_LOCATION,
              },
            });
            closeMenu();
          }}
          data-testid="global-menu-expand"
        >
          {t('expandView')}
        </MenuItem>
      )}
      <MenuItem
        data-testid="global-menu-networks"
        iconName={IconName.Hierarchy}
        onClick={() => {
          dispatch(toggleNetworkMenu());
          closeMenu();
        }}
      >
        {t('networks')}
      </MenuItem>
      <MenuItem
        iconName={IconName.Snaps}
        onClick={() => {
          history.push(SNAPS_ROUTE);
          closeMenu();
        }}
        showInfoDot={snapsUpdatesAvailable}
      >
        {t('snaps')}
      </MenuItem>
      <MenuItem
        iconName={IconName.MessageQuestion}
        onClick={() => {
          dispatch(setShowSupportDataConsentModal(true));
          trackEvent(
            {
              category: MetaMetricsEventCategory.Home,
              event: MetaMetricsEventName.SupportLinkClicked,
              properties: {
                url: supportLink,
                location: METRICS_LOCATION,
              },
            },
            {
              contextPropsIntoEventProperties: [
                MetaMetricsContextProp.PageTitle,
              ],
            },
          );
          closeMenu();
        }}
        data-testid="global-menu-support"
      >
        {supportText}
      </MenuItem>
      <MenuItem
        iconName={IconName.Setting}
        disabled={hasUnapprovedTransactions}
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
        ref={lastItemRef} // ref for last item in GlobalMenu
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
        {t('lockMetaMask')}
      </MenuItem>
    </Popover>
  );
};
