import React, { useCallback, useContext, useRef, useState } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import browser from 'webextension-polyfill';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useHistory } from 'react-router-dom';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  BUILD_QUOTE_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONNECTIONS,
  DEFAULT_ROUTE,
  SWAPS_ROUTE,
} from '../../../helpers/constants/routes';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  JustifyContent,
  Size,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  PickerNetwork,
  Text,
} from '../../component-library';
import {
  getCurrentChainId,
  getCurrentNetwork,
  getOriginOfCurrentTab,
  getTestNetworkBackgroundColor,
  getSelectedInternalAccount,
  getUnapprovedTransactions,
} from '../../../selectors';
import { AccountPicker, GlobalMenu } from '..';

import { toggleAccountMenu, toggleNetworkMenu } from '../../../store/actions';
import MetafoxLogo from '../../ui/metafox-logo';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import ConnectedStatusIndicator from '../../app/connected-status-indicator';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getIsUnlocked } from '../../../ducks/metamask/metamask';
import { SEND_STAGES, getSendStage } from '../../../ducks/send';
import Tooltip from '../../ui/tooltip';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MINUTE } from '../../../../shared/constants/time';
import { shortenAddress } from '../../../helpers/utils/util';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { MultichainMetaFoxLogo } from './multichain-meta-fox-logo';

export const AppHeader = ({ location }) => {
  const trackEvent = useContext(MetaMetricsContext);
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const origin = useSelector(getOriginOfCurrentTab);
  const history = useHistory();
  const isUnlocked = useSelector(getIsUnlocked);
  const t = useI18nContext();
  const chainId = useSelector(getCurrentChainId);

  // Used for account picker
  const internalAccount = useSelector(getSelectedInternalAccount);
  const shortenedAddress =
    internalAccount &&
    shortenAddress(toChecksumHexAddress(internalAccount.address));
  const dispatch = useDispatch();

  // Used for network icon / dropdown
  const currentNetwork = useSelector(getCurrentNetwork);
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);

  // Used for copy button

  // During onboarding there is no selected internal account
  const currentAddress = internalAccount?.address;
  const checksummedCurrentAddress = toChecksumHexAddress(currentAddress);
  const [copied, handleCopy] = useCopyToClipboard(MINUTE);

  const popupStatus = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const showConnectedStatus =
    getEnvironmentType() === ENVIRONMENT_TYPE_POPUP &&
    origin &&
    origin !== browser.runtime.id;

  // Disable the network and account pickers if the user is in
  // a critical flow
  const sendStage = useSelector(getSendStage);
  const isTransactionEditPage = [
    SEND_STAGES.EDIT,
    SEND_STAGES.DRAFT,
    SEND_STAGES.ADD_RECIPIENT,
  ].includes(sendStage);
  const isConfirmationPage = Boolean(
    matchPath(location.pathname, {
      path: CONFIRM_TRANSACTION_ROUTE,
      exact: false,
    }),
  );
  const isSwapsPage = Boolean(
    matchPath(location.pathname, { path: SWAPS_ROUTE, exact: false }),
  );
  const isSwapsBuildQuotePage = Boolean(
    matchPath(location.pathname, { path: BUILD_QUOTE_ROUTE, exact: false }),
  );

  const unapprovedTransactions = useSelector(getUnapprovedTransactions);

  const hasUnapprovedTransactions =
    Object.keys(unapprovedTransactions).length > 0;

  const disableAccountPicker =
    isConfirmationPage || (isSwapsPage && !isSwapsBuildQuotePage);

  const disableNetworkPicker =
    isSwapsPage ||
    isTransactionEditPage ||
    isConfirmationPage ||
    hasUnapprovedTransactions;

  // Callback for network dropdown
  const networkOpenCallback = useCallback(() => {
    dispatch(toggleNetworkMenu());
    trackEvent({
      event: MetaMetricsEventName.NavNetworkMenuOpened,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: 'App header',
        chain_id: chainId,
      },
    });
  }, [chainId, dispatch, trackEvent]);

  const handleConnectionsRoute = () => {
    history.push(`${CONNECTIONS}/${encodeURIComponent(origin)}`);
  };
  // This is required to ensure send and confirmation screens
  // look as desired
  const headerBottomMargin = !popupStatus && disableNetworkPicker ? 4 : 0;

  return (
    <>
      {isUnlocked && !popupStatus ? <MultichainMetaFoxLogo /> : null}
      <Box
        display={Display.Flex}
        className={classnames('multichain-app-header', {
          'multichain-app-header-shadow': !isUnlocked || popupStatus,
        })}
        marginBottom={headerBottomMargin}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        backgroundColor={
          !isUnlocked || popupStatus
            ? BackgroundColor.backgroundDefault
            : BackgroundColor.backgroundAlternative
        }
      >
        <>
          {isUnlocked ? (
            <Box
              className={classnames('multichain-app-header__contents', {
                'multichain-app-header-shadow': isUnlocked && !popupStatus,
              })}
              alignItems={AlignItems.center}
              width={BlockSize.Full}
              backgroundColor={BackgroundColor.backgroundDefault}
              padding={2}
              paddingLeft={4}
              paddingRight={4}
              gap={2}
            >
              {popupStatus ? (
                <Box className="multichain-app-header__contents__container">
                  <Tooltip title={currentNetwork?.nickname} position="right">
                    <PickerNetwork
                      avatarNetworkProps={{
                        backgroundColor: testNetworkBackgroundColor,
                        role: 'img',
                      }}
                      className="multichain-app-header__contents--avatar-network"
                      ref={menuRef}
                      as="button"
                      src={currentNetwork?.rpcPrefs?.imageUrl}
                      label={currentNetwork?.nickname}
                      aria-label={`${t('networkMenu')} ${
                        currentNetwork?.nickname
                      }`}
                      labelProps={{
                        display: Display.None,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        networkOpenCallback();
                      }}
                      display={[Display.Flex, Display.None]} // show on popover hide on desktop
                      disabled={disableNetworkPicker}
                    />
                  </Tooltip>
                </Box>
              ) : (
                <div>
                  <PickerNetwork
                    avatarNetworkProps={{
                      backgroundColor: testNetworkBackgroundColor,
                      role: 'img',
                    }}
                    margin={2}
                    aria-label={`${t('networkMenu')} ${
                      currentNetwork?.nickname
                    }`}
                    label={currentNetwork?.nickname}
                    src={currentNetwork?.rpcPrefs?.imageUrl}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      networkOpenCallback();
                    }}
                    display={[Display.None, Display.Flex]} // show on desktop hide on popover
                    className="multichain-app-header__contents__network-picker"
                    disabled={disableNetworkPicker}
                    data-testid="network-display"
                  />
                </div>
              )}

              {internalAccount ? (
                <Text
                  as="div"
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                  alignItems={AlignItems.center}
                  ellipsis
                >
                  <AccountPicker
                    address={internalAccount.address}
                    name={internalAccount.metadata.name}
                    onClick={() => {
                      dispatch(toggleAccountMenu());

                      trackEvent({
                        event: MetaMetricsEventName.NavAccountMenuOpened,
                        category: MetaMetricsEventCategory.Navigation,
                        properties: {
                          location: 'Home',
                        },
                      });
                    }}
                    disabled={disableAccountPicker}
                    labelProps={{ fontWeight: FontWeight.Bold }}
                    paddingLeft={2}
                    paddingRight={2}
                  />
                  <Tooltip
                    position="left"
                    title={copied ? t('addressCopied') : t('copyToClipboard')}
                  >
                    <ButtonBase
                      className="multichain-app-header__address-copy-button"
                      onClick={() => handleCopy(checksummedCurrentAddress)}
                      size={ButtonBaseSize.Sm}
                      backgroundColor={BackgroundColor.transparent}
                      borderRadius={BorderRadius.LG}
                      endIconName={
                        copied ? IconName.CopySuccess : IconName.Copy
                      }
                      endIconProps={{
                        color: IconColor.iconAlternative,
                        size: Size.SM,
                      }}
                      ellipsis
                      textProps={{
                        display: Display.Flex,
                        alignItems: AlignItems.center,
                        gap: 2,
                      }}
                      style={{ height: 'auto' }} // ButtonBase doesn't have auto size
                      data-testid="app-header-copy-button"
                    >
                      <Text
                        color={TextColor.textAlternative}
                        variant={TextVariant.bodySm}
                        ellipsis
                        as="span"
                      >
                        {shortenedAddress}
                      </Text>
                    </ButtonBase>
                  </Tooltip>
                </Text>
              ) : null}
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.flexEnd}
                style={{ marginLeft: 'auto' }}
              >
                <Box display={Display.Flex} gap={4}>
                  {showConnectedStatus ? (
                    <Box ref={menuRef}>
                      <ConnectedStatusIndicator
                        onClick={() => {
                          handleConnectionsRoute();
                        }}
                      />
                    </Box>
                  ) : null}{' '}
                  <Box
                    ref={menuRef}
                    display={Display.Flex}
                    justifyContent={JustifyContent.flexEnd}
                    width={BlockSize.Full}
                  >
                    <ButtonIcon
                      iconName={IconName.MoreVertical}
                      data-testid="account-options-menu-button"
                      ariaLabel={t('accountOptions')}
                      onClick={() => {
                        trackEvent({
                          event: MetaMetricsEventName.NavMainMenuOpened,
                          category: MetaMetricsEventCategory.Navigation,
                          properties: {
                            location: 'Home',
                          },
                        });
                        setAccountOptionsMenuOpen(true);
                      }}
                      size={ButtonIconSize.Sm}
                    />
                  </Box>
                </Box>
                <GlobalMenu
                  anchorElement={menuRef.current}
                  isOpen={accountOptionsMenuOpen}
                  closeMenu={() => setAccountOptionsMenuOpen(false)}
                />
              </Box>
            </Box>
          ) : (
            <Box
              display={Display.Flex}
              className={classnames('multichain-app-header__lock-contents', {
                'multichain-app-header-shadow': isUnlocked && !popupStatus,
              })}
              alignItems={AlignItems.center}
              width={BlockSize.Full}
              justifyContent={JustifyContent.spaceBetween}
              backgroundColor={BackgroundColor.backgroundDefault}
              padding={2}
              gap={2}
            >
              <div>
                <PickerNetwork
                  avatarNetworkProps={{
                    backgroundColor: testNetworkBackgroundColor,
                    role: 'img',
                  }}
                  aria-label={`${t('networkMenu')} ${currentNetwork?.nickname}`}
                  label={currentNetwork?.nickname}
                  src={currentNetwork?.rpcPrefs?.imageUrl}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    networkOpenCallback();
                  }}
                  className="multichain-app-header__contents__network-picker"
                  data-testid="network-display"
                />
              </div>
              <MetafoxLogo
                unsetIconHeight
                onClick={async () => {
                  history.push(DEFAULT_ROUTE);
                }}
              />
            </Box>
          )}
        </>
      </Box>
    </>
  );
};

AppHeader.propTypes = {
  /**
   * The location object for the application
   */
  location: PropTypes.object,
};
