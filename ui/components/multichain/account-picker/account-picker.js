import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  Button,
  AvatarAccount,
  AvatarAccountVariant,
  Icon,
  IconName,
  Text,
} from '../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  DISPLAY,
  FONT_WEIGHT,
  IconColor,
  Size,
} from '../../../helpers/constants/design-system';

export const AccountPicker = ({ address, name, onClick }) => {
  const useBlockie = useSelector((state) => state.metamask.useBlockie);

  return (
    <Button
      className="multichain-account-picker"
      onClick={onClick}
      backgroundColor={BackgroundColor.transparent}
      borderRadius={BorderRadius.LG}
      ellipsis
      textProps={{
        display: DISPLAY.FLEX,
        gap: 2,
        alignItems: AlignItems.center,
      }}
    >
      <AvatarAccount
        variant={
          useBlockie
            ? AvatarAccountVariant.Blockies
            : AvatarAccountVariant.Jazzicon
        }
        address={address}
        size={Size.XS}
      />
      <Text as="span" fontWeight={FONT_WEIGHT.BOLD} ellipsis>
        {name}
      </Text>
      <Icon
        name={IconName.ArrowDown}
        color={IconColor.iconDefault}
        size={Size.SM}
      />
    </Button>
  );
};

AccountPicker.propTypes = {
  /**
   * Account name
   */
  name: PropTypes.string.isRequired,
  /**
   * Account address, used for blockie or jazzicon
   */
  address: PropTypes.string.isRequired,
  /**
   * Action to perform when the account picker is clicked
   */
  onClick: PropTypes.func.isRequired,
};
