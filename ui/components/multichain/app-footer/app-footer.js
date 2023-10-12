import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  CONNECTED_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import {
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
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { showSelectActionModal } from './app-footer-actions';

export const AppFooter = () => {
  const t = useI18nContext();
  const location = useLocation();
  const dispatch = useDispatch();

  const walletRoute = `#${DEFAULT_ROUTE}`;
  const connectedRoute = `#${CONNECTED_ROUTE}`;
  const activeWallet = location.pathname === DEFAULT_ROUTE;
  const activeConnections = location.pathname === CONNECTED_ROUTE;

  return (
    <Box
      className="app-footer"
      width={BlockSize.Full}
      height={BlockSize.Min}
      backgroundColor={BackgroundColor.backgroundDefault}
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={2}
      paddingBottom={2}
    >
      <Box
        as="a"
        href={walletRoute}
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
            activeWallet ? IconColor.primaryDefault : IconColor.iconAlternative
          }
          name={IconName.Wallet}
          size={IconSize.Lg}
        />
        <Text
          color={
            activeWallet ? TextColor.primaryDefault : TextColor.textAlternative
          }
          variant={TextVariant.bodyMd}
        >
          {t('wallet')}
        </Text>
      </Box>
      <Box
        as="button"
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
          className="app-footer__button"
          data-testid="app-footer-actions-button"
          iconName={IconName.SwapVertical}
          color={IconColor.primaryInverse}
          backgroundColor={BackgroundColor.primaryDefault}
          size={ButtonIconSize.Lg}
          borderRadius={BorderRadius.full}
          onClick={() => dispatch(showSelectActionModal())}
        />
      </Box>
      <Box
        as="a"
        href={connectedRoute}
        className="app-footer__button"
        width={BlockSize.OneThird}
        padding={2}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        tabIndex={0}
      >
        <Icon
          data-testid="app-footer-connections-button"
          color={
            activeConnections
              ? IconColor.primaryDefault
              : IconColor.iconAlternative
          }
          name={IconName.Global}
          size={IconSize.Lg}
        />
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
  );
};
