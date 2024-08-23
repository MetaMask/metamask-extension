import React from 'react';
import PropTypes from 'prop-types';
import { SubjectType } from '@metamask/permission-controller';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  AvatarFavicon,
  AvatarIcon,
  AvatarIconSize,
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapper,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../component-library';
import { getURLHost } from '../../../../../helpers/utils/util';
import { ConnectionListTooltip } from '../../permissions-page/connection-list-tooltip/connection-list-tooltip';
import {
  showEditAccountsModal,
  showEditNetworksModal,
} from '../../../../../store/actions';
import { useDispatch } from 'react-redux';

export const SiteCell = ({}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  return (
    <>
      <Box
        data-testid="connection-list-item"
        as="button"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.baseline}
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundDefault}
        // onClick={onClick}
        padding={4}
        gap={4}
        className="multichain-connection-list-item"
      >
        <AvatarIcon
          iconName={IconName.Wallet}
          size={AvatarIconSize.Md}
          iconProps={{
            size: IconSize.Sm,
          }}
          color={IconColor.iconAlternative}
          backgroundColor={BackgroundColor.backgroundAlternative}
        />
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.FiveTwelfths}
          style={{ alignSelf: 'center', flexGrow: '1' }}
        >
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Left}
            ellipsis
          >
            {t('accountsPermissionsTitle')}
          </Text>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
            gap={1}
          >
            <Text
              as="span"
              width={BlockSize.Max}
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMd}
            >
              {t('connectedWith')}
            </Text>
            {/* <ConnectionListTooltip connection={connection} /> */}
          </Box>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexEnd}
          alignItems={AlignItems.center}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={2}
          onClick={() => {
            dispatch(showEditAccountsModal());
          }}
        >
          <Icon
            display={Display.Flex}
            name={IconName.MoreVertical}
            color={IconColor.iconDefault}
            size={IconSize.Sm}
            backgroundColor={BackgroundColor.backgroundDefault}
          />
        </Box>
      </Box>
      <Box
        data-testid="connection-list-item"
        as="button"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.baseline}
        width={BlockSize.Full}
        backgroundColor={BackgroundColor.backgroundDefault}
        // onClick={onClick}
        padding={4}
        gap={4}
        className="multichain-connection-list-item"
      >
        <AvatarIcon
          iconName={IconName.Data}
          size={AvatarIconSize.Md}
          iconProps={{
            size: IconSize.Sm,
          }}
          color={IconColor.iconAlternative}
          backgroundColor={BackgroundColor.backgroundAlternative}
        />
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.FiveTwelfths}
          style={{ alignSelf: 'center', flexGrow: '1' }}
        >
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Left}
            ellipsis
          >
            {t('permission_walletSwitchEthereumChain')}
          </Text>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
            gap={1}
          >
            <Text
              as="span"
              width={BlockSize.Max}
              color={TextColor.textAlternative}
              variant={TextVariant.bodyMd}
            >
              {t('connectedWith')}
            </Text>
            {/* <ConnectionListTooltip connection={connection} /> */}
          </Box>
        </Box>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.flexEnd}
          alignItems={AlignItems.center}
          style={{ flex: '1', alignSelf: 'center' }}
          gap={2}
          onClick={() => {
            dispatch(showEditNetworksModal());
          }}
        >
          <Icon
            display={Display.Flex}
            name={IconName.MoreVertical}
            color={IconColor.iconDefault}
            size={IconSize.Sm}
            backgroundColor={BackgroundColor.backgroundDefault}
          />
        </Box>
      </Box>
    </>
  );
};

SiteCell.propTypes = {
  /**
   * The connection data to display
   */
  connection: PropTypes.object.isRequired,
  /**
   * The function to call when the connection is clicked
   */
  onClick: PropTypes.func.isRequired,
};
