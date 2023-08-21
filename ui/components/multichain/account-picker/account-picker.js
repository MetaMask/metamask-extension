import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import {
  Box,
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
  FlexDirection,
  FontWeight,
  IconColor,
  Size,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { shortenAddress } from '../../../helpers/utils/util';

export const AccountPicker = ({
  address,
  name,
  onClick,
  disabled,
  showAddress = false,
}) => {
  const useBlockie = useSelector((state) => state.metamask.useBlockie);
  const shortenedAddress = shortenAddress(toChecksumHexAddress(address));

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
      <Box
        display={Display.Flex}
        className="multichain-account-picker-container"
        flexDirection={FlexDirection.Column}
      >
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
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
        </Box>
        {showAddress ? (
          <Text
            color={TextColor.textAlternative}
            textAlign={TextAlign.Center}
            variant={TextVariant.bodySm}
          >
            {shortenedAddress}
          </Text>
        ) : null}
      </Box>
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
  /**
   * Represents if the account address should display
   */
  showAddress: PropTypes.bool,
};
