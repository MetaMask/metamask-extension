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
  FRACTIONS,
  BLOCK_SIZES,
  JustifyContent,
  Size,
} from '../../helpers/constants/design-system';

export const AccountListItem = ({ identity, selected = false }) => {
  const selectedBlockBackground = selected
    ? Color.primaryDefault
    : Color.transparent;
  const selectedBackground = selected
    ? 'rgba(3, 118, 201, 0.1)'
    : Color.transparent;

  return (
    <Box
      display={DISPLAY.FLEX}
      padding={1}
      gap={2}
      backgroundColor={selectedBlockBackground}
    >
      {/* "selected" blue box */}
      <Box
        width={1}
        marginInlineEnd={2}
        style={{
          width: '4px',
          borderRadius: '8px',
          // border: '1px solid red',
          overflow: 'hidden',
          background: selectedBackground,
        }}
        // backgroundColor={selectedBackground}
      >
        {' '}
      </Box>
      <AvatarAccount
        size={Size.SM}
        marginTop={3}
        address={identity.address}
      ></AvatarAccount>
      <Box marginTop={3} marginBottom={4} width={BLOCK_SIZES.FULL}>
        <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN}>
          {/* first row */}
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text width={FRACTIONS.HALF} ellipsis>
              {identity.name}
            </Text>
            <Text width={FRACTIONS.HALF} textAlign={TEXT_ALIGN.END}>
              $1,234.56
            </Text>
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
        marginTop={3}
        marginInlineEnd={5}
        ariaLabel=""
        iconName={ICON_NAMES.MORE_VERTICAL}
        size={ICON_SIZES.SM}
        onClick={() => {
          console.log('Open three-dot menu');
        }}
        width={2}
      />
    </Box>
  );
};

AccountListItem.propTypes = {
  identity: PropTypes.object.isRequired,
  selected: PropTypes.bool,
};

AccountListItem.displayName = 'AccountListItem';
