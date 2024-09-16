import React, { useContext } from 'react';
import PropTypes from 'prop-types';
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
} from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  selectIsMetamaskNotificationsEnabled,
  selectIsMetamaskNotificationsFeatureSeen,
} from '../../../selectors/metamask-notifications/metamask-notifications';
import { selectIsProfileSyncingEnabled } from '../../../selectors/metamask-notifications/profile-syncing';
import {
  Box,
  IconName,
  Popover,
  PopoverPosition,
} from '../../component-library';

import { MenuItem } from '../../ui/menu';
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
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import {
  getMmiPortfolioEnabled,
  getMmiPortfolioUrl,
} from '../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IF
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getMetaMetricsId,
  ///: END:ONLY_INCLUDE_IF(build-mmi)
  getSelectedInternalAccount,
  getUnapprovedTransactions,
  getAnySnapUpdateAvailable,
  getNotifySnaps,
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
import { AccountDetailsMenuItem, ViewExplorerMenuItem } from '..';

const METRICS_LOCATION = 'Global Menu';

export const GlobalMenu = ({ closeMenu, anchorElement, isOpen }) => {
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
  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);

  const hasUnapprovedTransactions =
    Object.keys(unapprovedTransactions).length > 0;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const metaMetricsId = useSelector(getMetaMetricsId);
  const mmiPortfolioUrl = useSelector(getMmiPortfolioUrl);
  const mmiPortfolioEnabled = useSelector(getMmiPortfolioEnabled);
  ///: END:ONLY_INCLUDE_IF

  let hasNotifySnaps = false;
  const snapsUpdatesAvailable = useSelector(getAnySnapUpdateAvailable);
  hasNotifySnaps = useSelector(getNotifySnaps).length > 0;

  let supportText = t('support');
  let supportLink = SUPPORT_LINK;
  ///: BEGIN:ONLY_INCLUDE_IF(build-beta,build-flask)
  supportText = t('needHelpSubmitTicket');
  supportLink = SUPPORT_REQUEST_LINK;
  ///: END:ONLY_INCLUDE_IF

  // Accessibility improvement for popover
  const lastItemRef = React.useRef(null);

  React.useEffect(() => {
    const lastItem = lastItemRef.current;
    const handleKeyDown = (event) => {
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
      !hasNotifySnaps && !isMetamaskNotificationsEnabled;

    if (shouldShowEnableModal) {
      trackEvent({
        category: MetaMetricsEventCategory.NotificationsActivationFlow,
        event: MetaMetricsEventName.NotificationsActivated,
        properties: {
          action_type: 'started',
          is_profile_syncing_enabled: isProfileSyncingEnabled,
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
      position={PopoverPosition.BottomEnd}
    >
      {basicFunctionality && (
        <>
          <MenuItem
            iconName={IconName.Notification}
            onClick={() => handleNotificationsClick()}
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

      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        mmiPortfolioEnabled && (
          <MenuItem
            iconName={IconName.Diagram}
            onClick={() => {
              trackEvent({
                category: MetaMetricsEventCategory.Navigation,
                event: MetaMetricsEventName.MMIPortfolioButtonClicked,
              });
              window.open(
                `${mmiPortfolioUrl}?metametricsId=${metaMetricsId}`,
                '_blank',
              );
              closeMenu();
            }}
            data-testid="global-menu-mmi-portfolio"
          >
            {t('portfolioDashboard')}
          </MenuItem>
        )
        ///: END:ONLY_INCLUDE_IF
      }
      {getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN ? null : (
        <MenuItem
          iconName={IconName.Expand}
          onClick={() => {
            global.platform.openExtensionInBrowser();
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
          global.platform.openTab({ url: supportLink });
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

GlobalMenu.propTypes = {
  /**
   * The element that the menu should display next to
   */
  anchorElement: PropTypes.instanceOf(window.Element),
  /**
   * Function that closes this menu
   */
  closeMenu: PropTypes.func.isRequired,
  /**
   * Whether or not the menu is open
   */
  isOpen: PropTypes.bool.isRequired,
};
