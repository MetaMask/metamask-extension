import React, { useCallback, useContext, useRef, useState } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import browser from 'webextension-polyfill';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useHistory } from 'react-router-dom';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  BUILD_QUOTE_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONNECTED_ACCOUNTS_ROUTE,
  DEFAULT_ROUTE,
  SWAPS_ROUTE,
} from '../../../helpers/constants/routes';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FontWeight,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  IconSize,
  PickerNetwork,
} from '../../component-library';
import {
  getCurrentChainId,
  getCurrentNetwork,
  getOnboardedInThisUISession,
  getOriginOfCurrentTab,
  getSelectedIdentity,
  getShowProductTour,
  getTestNetworkBackgroundColor,
  getUnapprovedTransactions,
  getSelectedAddress,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getTheme,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import { AccountPicker, GlobalMenu, ProductTour } from '..';

import {
  hideProductTour,
  toggleAccountMenu,
  toggleNetworkMenu,
} from '../../../store/actions';
import MetafoxLogo from '../../ui/metafox-logo';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import ConnectedStatusIndicator from '../../app/connected-status-indicator';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../../ducks/metamask/metamask';
import { SEND_STAGES, getSendStage } from '../../../ducks/send';
import Tooltip from '../../ui/tooltip';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MINUTE } from '../../../../shared/constants/time';

export const AppHeader = ({ location }) => {
  const trackEvent = useContext(MetaMetricsContext);
  const [accountOptionsMenuOpen, setAccountOptionsMenuOpen] = useState(false);
  const [multichainProductTourStep, setMultichainProductTourStep] = useState(1);
  const menuRef = useRef(false);
  const origin = useSelector(getOriginOfCurrentTab);
  const history = useHistory();
  const isHomePage = location.pathname === DEFAULT_ROUTE;
  const isUnlocked = useSelector(getIsUnlocked);
  const t = useI18nContext();
  const chainId = useSelector(getCurrentChainId);

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const theme = useSelector((state) => getTheme(state));
  ///: END:ONLY_INCLUDE_IF

  // Used for account picker
  const identity = useSelector(getSelectedIdentity);
  const dispatch = useDispatch();
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const onboardedInThisUISession = useSelector(getOnboardedInThisUISession);
  const showProductTourPopup = useSelector(getShowProductTour);

  // Used for network icon / dropdown
  const currentNetwork = useSelector(getCurrentNetwork);
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);

  // Used for copy button
  const currentAddress = useSelector(getSelectedAddress);
  const checksummedCurrentAddress = toChecksumHexAddress(currentAddress);
  const [copied, handleCopy] = useCopyToClipboard(MINUTE);

  const popupStatus = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const showConnectedStatus =
    process.env.MULTICHAIN ||
    (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP &&
      origin &&
      origin !== browser.runtime.id);
  const showProductTour =
    completedOnboarding && !onboardedInThisUISession && showProductTourPopup;
  const productTourDirection = document
    .querySelector('[dir]')
    ?.getAttribute('dir');

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

  // This is required to ensure send and confirmation screens
  // look as desired
  const headerBottomMargin = !popupStatus && disableNetworkPicker ? 4 : 0;

  return (
    <>
      {isUnlocked && !popupStatus ? (
        <Box
          display={[Display.None, Display.Flex]}
          alignItems={AlignItems.center}
          margin={2}
          className="multichain-app-header-logo"
          data-testid="app-header-logo"
          justifyContent={JustifyContent.center}
        >
          <MetafoxLogo
            unsetIconHeight
            onClick={async () => history.push(DEFAULT_ROUTE)}
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            theme={theme}
            ///: END:ONLY_INCLUDE_IF
          />
        </Box>
      ) : null}
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
                      }}
                      className="multichain-app-header__contents--avatar-network"
                      ref={menuRef}
                      as="button"
                      src={currentNetwork?.rpcPrefs?.imageUrl}
                      label={currentNetwork?.nickname}
                      aria-label={t('networkMenu')}
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
                    }}
                    margin={2}
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
              {showProductTour &&
              popupStatus &&
              isHomePage &&
              multichainProductTourStep === 1 ? (
                <ProductTour
                  className="multichain-app-header__product-tour"
                  anchorElement={menuRef.current}
                  title={t('switcherTitle')}
                  description={t('switcherTourDescription')}
                  currentStep="1"
                  totalSteps="3"
                  onClick={() =>
                    setMultichainProductTourStep(multichainProductTourStep + 1)
                  }
                  positionObj={productTourDirection === 'rtl' ? '0%' : '88%'}
                  productTourDirection={productTourDirection}
                />
              ) : null}

              {identity ? (
                <AccountPicker
                  address={identity.address}
                  name={identity.name}
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
                  showAddress={Boolean(process.env.MULTICHAIN)}
                  labelProps={{ fontWeight: FontWeight.Bold }}
                />
              ) : null}
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.flexEnd}
              >
                <Box display={Display.Flex} gap={4}>
                  {showConnectedStatus &&
                    (process.env.MULTICHAIN ? (
                      <Tooltip
                        position="left"
                        title={copied ? t('addressCopied') : null}
                      >
                        <ButtonIcon
                          onClick={() => handleCopy(checksummedCurrentAddress)}
                          iconName={
                            copied ? IconName.CopySuccess : IconName.Copy
                          }
                          size={IconSize.Sm}
                          data-testid="app-header-copy-button"
                        />
                      </Tooltip>
                    ) : (
                      <Box ref={menuRef}>
                        <ConnectedStatusIndicator
                          onClick={() => {
                            history.push(CONNECTED_ACCOUNTS_ROUTE);
                            trackEvent({
                              event:
                                MetaMetricsEventName.NavConnectedSitesOpened,
                              category: MetaMetricsEventCategory.Navigation,
                            });
                          }}
                        />
                      </Box>
                    ))}{' '}
                  {popupStatus && multichainProductTourStep === 2 ? (
                    <ProductTour
                      className="multichain-app-header__product-tour"
                      anchorElement={menuRef.current}
                      closeMenu={() => setAccountOptionsMenuOpen(false)}
                      prevIcon
                      title={t('permissionsTitle')}
                      description={t('permissionsTourDescription')}
                      currentStep="2"
                      totalSteps="3"
                      prevClick={() =>
                        setMultichainProductTourStep(
                          multichainProductTourStep - 1,
                        )
                      }
                      onClick={() =>
                        setMultichainProductTourStep(
                          multichainProductTourStep + 1,
                        )
                      }
                      positionObj={
                        productTourDirection === 'rtl' ? '76%' : '12%'
                      }
                      productTourDirection={productTourDirection}
                    />
                  ) : null}
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
                {accountOptionsMenuOpen ? (
                  <GlobalMenu
                    anchorElement={menuRef.current}
                    closeMenu={() => setAccountOptionsMenuOpen(false)}
                  />
                ) : null}
                {showProductTour &&
                popupStatus &&
                multichainProductTourStep === 3 ? (
                  <ProductTour
                    className="multichain-app-header__product-tour"
                    anchorElement={menuRef.current}
                    closeMenu={() => setAccountOptionsMenuOpen(false)}
                    prevIcon
                    title={t('globalTitle')}
                    description={t('globalTourDescription')}
                    currentStep="3"
                    totalSteps="3"
                    prevClick={() =>
                      setMultichainProductTourStep(
                        multichainProductTourStep - 1,
                      )
                    }
                    onClick={() => {
                      hideProductTour();
                    }}
                    positionObj={productTourDirection === 'rtl' ? '88%' : '0%'}
                    productTourDirection={productTourDirection}
                  />
                ) : null}
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
                  }}
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
