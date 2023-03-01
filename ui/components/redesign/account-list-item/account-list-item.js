import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';
import {
  AvatarAccount,
  ButtonIcon,
  Text,
  ICON_NAMES,
  ICON_SIZES,
} from '../../component-library';
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
} from '../../../helpers/constants/design-system';

export const AccountListItem = ({ identity, selected = false, onClick }) => {
  return (
    <Box
      display={DISPLAY.FLEX}
      padding={1}
      gap={2}
      backgroundColor={selected ? Color.primaryMuted : Color.transparent}
      className={classnames('account-list-item', {
        'account-list-item--selected': selected,
      })}
      as="a"
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
    >
      <Box
        marginInlineEnd={2}
        backgroundColor={selected ? Color.primaryDefault : Color.transparent}
        className="account-list-item__active-indicator"
      ></Box>
      <AvatarAccount
        size={Size.SM}
        marginTop={3}
        address={identity.address}
      ></AvatarAccount>
      <Box
        marginTop={3}
        marginBottom={4}
        width={BLOCK_SIZES.FULL}
        className="account-list-item__content"
      >
        <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN}>
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.spaceBetween}
          >
            <Text width={FRACTIONS.HALF} ellipsis>
              {identity.name}
            </Text>
            <Text width={FRACTIONS.HALF} textAlign={TEXT_ALIGN.END}>
              {identity.balance}
            </Text>
          </Box>
        </Box>
        <Box
          display={DISPLAY.FLEX}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Text variant={TextVariant.bodySm} color={Color.textAlternative}>
            {identity.address}
          </Text>
          <Text
            variant={TextVariant.bodySm}
            color={Color.textAlternative}
            textAlign={TEXT_ALIGN.END}
          >
            {identity.tokenBalance}
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
  onClick: PropTypes.func.isRequired,
};

AccountListItem.displayName = 'AccountListItem';
