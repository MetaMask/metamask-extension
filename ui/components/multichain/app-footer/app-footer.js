import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  CONNECTED_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import { Box, Icon, IconName, IconSize, Text } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import IconButton from '../../ui/icon-button/icon-button';

export const AppFooter = () => {
  const t = useI18nContext();
  const history = useHistory();
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
        onClick={() => {
          history.push(DEFAULT_ROUTE);
        }}
      >
        <Icon
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
        width={BlockSize.OneThird}
        padding={2}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
      >
        <IconButton
          className="app-footer__button"
          Icon={
            <Icon
              color={IconColor.primaryInverse}
              name={IconName.SwapVertical}
              size={IconSize.Lg}
            />
          }
          data-testid="app-Footer-actions-button"
          onClick={() => {
            console.log('clicked');
          }}
        />
      </Box>
      <Box
        className="app-footer__button"
        width={BlockSize.OneThird}
        padding={2}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        onClick={() => {
          history.push(CONNECTED_ROUTE);
        }}
      >
        <Icon
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
