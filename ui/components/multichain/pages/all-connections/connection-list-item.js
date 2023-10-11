import React from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  FlexWrap,
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

export const ConnectionListItem = ({ key, connection }) => {
  const t = useI18nContext();
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.baseline}
      width={BlockSize.Full}
      padding={4}
      gap={4}
      key={key}
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
        <Text variant={TextVariant.bodyLgMedium} ellipsis>
          {connection.name}
        </Text>
        <Text color={TextColor.textAlternative} variant={TextVariant.bodyMd}>
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
  key: PropTypes.string.isRequired,
  connection: PropTypes.object.isRequired,
};
