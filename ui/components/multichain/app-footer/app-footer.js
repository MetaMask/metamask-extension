import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ALL_CONNECTIONS,
  CONNECTIONS,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import {
  AvatarFavicon,
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  Box,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  Size,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  getConnectedSubjectsForAllAddresses,
  getCurrentNetwork,
  getOriginOfCurrentTab,
  getSelectedAddress,
  getTestNetworkBackgroundColor,
} from '../../../selectors';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { showSelectActionModal } from './app-footer-actions';

export const AppFooter = () => {
  const t = useI18nContext();
  const location = useLocation();
  const dispatch = useDispatch();
  const history = useHistory();

  const activeWallet = location.pathname === DEFAULT_ROUTE;
  const activeConnections = location.pathname === CONNECTIONS;
  const isUnlocked = useSelector((state) => state.metamask.isUnlocked);
  const isFullScreen = getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN;
  const selectedAddress = useSelector(getSelectedAddress);

  const currentTabOrigin = useSelector(getOriginOfCurrentTab);
  const connectedSites = useSelector(getConnectedSubjectsForAllAddresses);
  const connectedSite = connectedSites[selectedAddress]?.find(
    ({ origin }) => origin === currentTabOrigin,
  );
  const connectedAvatar = connectedSite?.iconUrl;
  const connectedAvatarName = connectedSite?.name;

  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);

  const currentChain = useSelector(getCurrentNetwork);

  return (
    <>
      {isUnlocked ? (
        <>
          <Box
            className="app-footer"
            data-test-id="app-footer"
            width={BlockSize.Full}
            backgroundColor={BackgroundColor.backgroundAlternative}
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
          >
            <Box
              className="app-footer__contents"
              width={BlockSize.Full}
              display={Display.Flex}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.spaceBetween}
              backgroundColor={BackgroundColor.backgroundDefault}
              flexDirection={FlexDirection.Row}
              padding={2}
              paddingLeft={4}
              paddingRight={4}
              gap={2}
            >
              <Box
                as="a"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  history.push(DEFAULT_ROUTE);
                }}
                className="app-footer__button"
                width={BlockSize.OneThird}
                padding={2}
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                alignItems={AlignItems.center}
                tabIndex={0}
              >
                <Icon
                  data-testid="app-footer-wallet-button"
                  color={
                    activeWallet
                      ? IconColor.primaryDefault
                      : IconColor.iconAlternative
                  }
                  name={IconName.Wallet}
                  size={IconSize.Lg}
                />
                <Text
                  color={
                    activeWallet
                      ? TextColor.primaryDefault
                      : TextColor.textAlternative
                  }
                  variant={TextVariant.bodyMd}
                >
                  {t('wallet')}
                </Text>
              </Box>
              <Box
                width={BlockSize.OneThird}
                padding={2}
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.center}
                backgroundColor={BackgroundColor.backgroundDefault}
                tabIndex={0}
              >
                <ButtonIcon
                  className="app-footer__actions-button"
                  data-testid="app-footer-actions-button"
                  iconName={IconName.SwapVertical}
                  color={IconColor.primaryInverse}
                  backgroundColor={BackgroundColor.primaryDefault}
                  borderRadius={BorderRadius.full}
                  size={ButtonIconSize.Lg}
                  onClick={() => dispatch(showSelectActionModal())}
                  ariaLabel={t('selectActionButton')}
                />
              </Box>
              <Box
                as="a"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  history.push(isFullScreen ? ALL_CONNECTIONS : CONNECTIONS);
                }}
                className="app-footer__button"
                width={BlockSize.OneThird}
                padding={2}
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                alignItems={AlignItems.center}
                tabIndex={0}
              >
                {connectedSite ? (
                  <Box alignItems={AlignItems.center}>
                    <BadgeWrapper
                      display={Display.Flex}
                      className="app-footer__connected-badge"
                      badge={
                        <AvatarNetwork
                          backgroundColor={testNetworkBackgroundColor}
                          size={AvatarNetworkSize.Xs}
                          name={currentChain.nickname}
                          src={currentChain.rpcPrefs?.imageUrl}
                          borderWidth={2}
                          borderColor={BorderColor.borderDefault}
                        />
                      }
                    >
                      <AvatarFavicon
                        size={Size.SM}
                        src={connectedAvatar}
                        name={connectedAvatarName}
                      />
                    </BadgeWrapper>
                  </Box>
                ) : (
                  <Icon
                    color={
                      activeConnections
                        ? IconColor.primaryDefault
                        : IconColor.iconAlternative
                    }
                    name={IconName.Global}
                    size={IconSize.Lg}
                  />
                )}
                <Text
                  color={
                    activeConnections
                      ? TextColor.primaryDefault
                      : TextColor.textAlternative
                  }
                  variant={TextVariant.bodyMd}
                >
                  {t('connections')}
                </Text>
              </Box>
            </Box>
          </Box>
        </>
      ) : null}
    </>
  );
};
