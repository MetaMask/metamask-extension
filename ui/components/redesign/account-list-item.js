import React from 'react';
import PropTypes from 'prop-types';
import Box from '../ui/box/box';
import {
  AvatarAccount,
  ButtonIcon,
  Text,
  ICON_NAMES,
  ICON_SIZES,
} from '../component-library';
import {
  Color,
  TEXT_ALIGN,
  DISPLAY,
  TextVariant,
  FLEX_DIRECTION,
  JustifyContent,
  Size,
  BorderRadius,
} from '../../helpers/constants/design-system';

import './account-list-item.scss';

export const AccountListItem = ({ identity, selected = false }) => {
  return (
    <Box
      className="account-list-item"
      display={DISPLAY.FLEX}
      padding={4}
      gap={2}
      backgroundColor={selected ? Color.primaryMuted : Color.backgroundDefault}
      as="a"
      href=""
    >
      {selected && (
        <Box
          className="account-list-item__selected-indicator"
          borderRadius={BorderRadius.pill}
          backgroundColor={Color.primaryDefault}
        />
      )}
      <AvatarAccount size={Size.SM} address={identity.address} />
      <Box
        className="account-list-item__body"
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN}>
          {/* first row */}
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.spaceBetween}
            gap={2}
          >
            <Text ellipsis>{identity.name}</Text>
            <Text textAlign={TEXT_ALIGN.END}>$1,234.56</Text>
          </Box>
        </Box>
        <Box
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.spaceBetween}
        >
          {/* second row */}
          <Text variant={TextVariant.bodySm} color={Color.textAlternative}>
            {identity.address}
          </Text>
          <Text
            variant={TextVariant.bodySm}
            color={Color.textAlternative}
            textAlign={TEXT_ALIGN.END}
          >
            {identity.balance}
          </Text>
        </Box>
      </Box>
      <ButtonIcon
        ariaLabel="More"
        iconName={ICON_NAMES.MORE_VERTICAL}
        size={ICON_SIZES.SM}
        onClick={() => {
          console.log('Open three-dot menu');
        }}
      />
    </Box>
  );
};

AccountListItem.propTypes = {
  identity: PropTypes.object.isRequired,
  selected: PropTypes.bool,
};

AccountListItem.displayName = 'AccountListItem';
