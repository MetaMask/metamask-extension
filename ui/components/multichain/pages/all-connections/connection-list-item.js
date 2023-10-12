import React from 'react';
import PropTypes from 'prop-types';
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
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  AvatarFavicon,
  BadgeWrapper,
  Box,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import { getURLHost } from '../../../../helpers/utils/util';

export const ConnectionListItem = ({ connection, onClick }) => {
  const t = useI18nContext();
  return (
    <Box
      as="button"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.baseline}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
      onClick={onClick}
      padding={4}
      gap={4}
    >
      <BadgeWrapper
        badge={
          <Icon
            name={IconName.Global}
            color={IconColor.iconDefault}
            size={IconSize.Xs}
            backgroundColor={BackgroundColor.backgroundDefault}
          />
        }
      >
        <AvatarFavicon src={connection.iconUrl} />
      </BadgeWrapper>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        width={BlockSize.FiveTwelfths}
      >
        <Text
          variant={TextVariant.bodyLgMedium}
          textAlign={TextAlign.Left}
          ellipsis
        >
          {connection.name}
        </Text>
        <Text
          display={Display.Flex}
          alignItems={AlignItems.flexStart}
          color={TextColor.textAlternative}
          variant={TextVariant.bodyMd}
        >
          {getURLHost(connection.origin)}
        </Text>
      </Box>
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.flexEnd}
        alignItems={AlignItems.center}
        style={{ flex: '1' }}
        gap={2}
      >
        <Text
          width={BlockSize.Max}
          color={TextColor.textAlternative}
          variant={TextVariant.bodyMd}
        >
          {connection.addresses.length}{' '}
          {connection.addresses.length > 1
            ? t('connectedaccounts')
            : t('connectedaccount')}
        </Text>
        <Icon
          display={Display.Flex}
          name={IconName.ArrowRight}
          color={IconColor.iconDefault}
          size={IconSize.Sm}
          backgroundColor={BackgroundColor.backgroundDefault}
        />
      </Box>
    </Box>
  );
};

ConnectionListItem.propTypes = {
  /**
   * The connection data to display
   */
  connection: PropTypes.object.isRequired,
  /**
   * The function to call when the connection is clicked
   */
  onClick: PropTypes.func.isRequired,
};
