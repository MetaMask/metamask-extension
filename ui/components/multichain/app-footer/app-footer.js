import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  CONNECTED_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
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

export const AppFooter = () => {
  const t = useI18nContext();
  const location = useLocation();

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
        className="app-footer__button"
        width={BlockSize.OneThird}
        padding={2}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
      >
        <ButtonIcon
          data-testid="app-footer-wallet-button"
          color={
            activeWallet ? IconColor.primaryDefault : IconColor.iconAlternative
          }
          iconName={IconName.Wallet}
          size={ButtonIconSize.Lg}
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
        width={BlockSize.OneThird}
        padding={2}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
      >
        <ButtonIcon
          className="app-footer__button"
          data-testid="app-footer-actions-button"
          iconName={IconName.SwapVertical}
          color={IconColor.primaryInverse}
          backgroundColor={BackgroundColor.primaryDefault}
          size={ButtonIconSize.Lg}
          borderRadius={BorderRadius.full}
        />
      </Box>
      <Box
        className="app-footer__button"
        width={BlockSize.OneThird}
        padding={2}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
      >
        <ButtonIcon
          data-testid="app-footer-connections-button"
          color={
            activeConnections
              ? IconColor.primaryDefault
              : IconColor.iconAlternative
          }
          iconName={IconName.Global}
          size={ButtonIconSize.Lg}
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
