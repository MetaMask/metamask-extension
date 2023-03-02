/*
  TODO:

    1.  Add third content row for "Hardware" pill / label

  NEXT COMPONENTS:

    1.  AccountListItemOptions
    2.  AccountList
    3.  AccountListPopover

*/

import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { useI18nContext } from '../../../hooks/useI18nContext';

import Box from '../../ui/box/box';
import {
  AvatarAccount,
  ButtonIcon,
  Text,
  ICON_NAMES,
  ICON_SIZES,
  AvatarFavicon,
} from '../../component-library';
import {
  Color,
  TEXT_ALIGN,
  DISPLAY,
  TextVariant,
  FLEX_DIRECTION,
  BorderRadius,
  JustifyContent,
  Size,
} from '../../../helpers/constants/design-system';

export const AccountListItem = ({
  identity,
  selected = false,
  onClick,
  isHardware = false,
  connectedAvatar,
}) => {
  const t = useI18nContext();

  return (
    <Box
      display={DISPLAY.FLEX}
      padding={4}
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
      {selected && (
        <Box
          className="account-list-item__selected-indicator"
          borderRadius={BorderRadius.pill}
          backgroundColor={Color.primaryDefault}
        />
      )}
      <AvatarAccount size={Size.SM} address={identity.address}></AvatarAccount>
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        className="account-list-item__content"
      >
        <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN}>
          <Box
            display={DISPLAY.FLEX}
            justifyContent={JustifyContent.spaceBetween}
            gap={2}
          >
            <Text ellipsis>{identity.name}</Text>
            <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW}>
              {connectedAvatar ? (
                <AvatarFavicon
                  size={Size.SM}
                  src={connectedAvatar}
                  marginInlineEnd={2}
                />
              ) : null}
              <Text textAlign={TEXT_ALIGN.END}>{identity.balance}</Text>
            </Box>
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
        {isHardware ? <Box></Box> : null}
      </Box>
      <ButtonIcon
        ariaLabel={t('options')}
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
  onClick: PropTypes.func.isRequired,
  isHardware: PropTypes.bool,
  connectedAvatar: PropTypes.string,
};

AccountListItem.displayName = 'AccountListItem';
