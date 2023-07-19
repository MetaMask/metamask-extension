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
  Display,
  FontWeight,
  IconColor,
  Size,
} from '../../../helpers/constants/design-system';

export const AccountPicker = ({ address, name, onClick, disabled }) => {
  const useBlockie = useSelector((state) => state.metamask.useBlockie);

  return (
    <Button
      className="multichain-account-picker"
      data-testid="account-menu-icon"
      onClick={onClick}
      backgroundColor={BackgroundColor.transparent}
      borderRadius={BorderRadius.LG}
      ellipsis
      textProps={{
        display: Display.Flex,
        gap: 2,
        alignItems: AlignItems.center,
      }}
      disabled={disabled}
    >
      <AvatarAccount
        variant={
          useBlockie
            ? AvatarAccountVariant.Blockies
            : AvatarAccountVariant.Jazzicon
        }
        address={address}
        size={Size.XS}
        borderColor={BackgroundColor.backgroundDefault} // we currently don't have white color for border hence using backgroundDefault as the border
      />
      <Text as="span" fontWeight={FontWeight.Bold} ellipsis>
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
  /**
   * Represents if the AccountPicker should be actionable
   */
  disabled: PropTypes.bool.isRequired,
};
