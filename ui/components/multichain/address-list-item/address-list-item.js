import React from 'react';
import PropTypes from 'prop-types';

import { useSelector } from 'react-redux';
import {
  AvatarAccount,
  Box,
  AvatarAccountVariant,
  Text,
} from '../../component-library';
import {
  Color,
  TextAlign,
  TextVariant,
  FlexDirection,
  Size,
  BorderColor,
  Display,
  BlockSize,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { getUseBlockie } from '../../../selectors';

export const AddressListItem = ({ label, address, onClick }) => {
  const useBlockie = useSelector(getUseBlockie);

  return (
    <Box
      display={Display.Flex}
      padding={4}
      as="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.transparent}
      className="address-list-item"
    >
      <AvatarAccount
        borderColor={BorderColor.transparent}
        size={Size.SM}
        address={address}
        variant={
          useBlockie
            ? AvatarAccountVariant.Blockies
            : AvatarAccountVariant.Jazzicon
        }
        marginInlineEnd={2}
      />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        style={{ overflow: 'hidden' }}
      >
        <Text
          variant={TextVariant.bodyMdMedium}
          padding={0}
          width={BlockSize.Full}
          textAlign={TextAlign.Left}
          ellipsis
          data-testid="address-list-item-label"
        >
          {label}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          color={Color.textAlternative}
          ellipsis
          data-testid="address-list-item-address"
        >
          {address}
        </Text>
      </Box>
    </Box>
  );
};

AddressListItem.propTypes = {
  /**
   * Label
   */
  label: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
    PropTypes.string,
  ]).isRequired,
  /**
   * Address
   */
  address: PropTypes.string.isRequired,
  /**
   * Onclick
   */
  onClick: PropTypes.func.isRequired,
};

AddressListItem.displayName = 'AddressListItem';
