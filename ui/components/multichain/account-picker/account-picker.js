import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  ButtonBase,
  ICON_NAMES,
  AvatarAccount,
  AvatarAccountVariant,
  Text,
} from '../../component-library';
import {
  BackgroundColor,
  BorderRadius,
  DISPLAY,
  FONT_WEIGHT,
  Size,
} from '../../../helpers/constants/design-system';

export const AccountPicker = ({ address, name, onClick }) => {
  const useBlockie = useSelector((state) => state.metamask.useBlockie);

  return (
    <ButtonBase
      className="multichain-account-picker"
      onClick={onClick}
      backgroundColor={BackgroundColor.transparent}
      endIconName={ICON_NAMES.ARROW_DOWN}
      borderRadius={BorderRadius.LG}
      ellipsis
      textProps={{ display: DISPLAY.FLEX, gap: 2 }}
    >
      <AvatarAccount
        variant={
          useBlockie
            ? AvatarAccountVariant.Blockies
            : AvatarAccountVariant.Jazzicon
        }
        address={address}
        size={Size.SM}
      />
      <Text as="span" fontWeight={FONT_WEIGHT.BOLD} ellipsis>
        {name}
      </Text>
    </ButtonBase>
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
