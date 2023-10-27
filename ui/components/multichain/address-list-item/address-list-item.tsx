import React from 'react';

import { useSelector } from 'react-redux';
import {
  AvatarAccount,
  Box,
  AvatarAccountVariant,
  Text,
  AvatarAccountSize,
} from '../../component-library';
import {
  TextAlign,
  TextVariant,
  FlexDirection,
  BorderColor,
  Display,
  BlockSize,
  BackgroundColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { getUseBlockie } from '../../../selectors';

interface AddressListItemProps {
  label: string;
  address: string;
  onClick: () => void;
}

export const AddressListItem = ({
  label,
  address,
  onClick,
}: AddressListItemProps) => {
  const useBlockie = useSelector(getUseBlockie);

  return (
    <Box
      display={Display.Flex}
      padding={4}
      as="button"
      onClick={(e: Event): any => {
        e.stopPropagation();
        onClick();
      }}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.transparent}
      className="address-list-item"
    >
      <AvatarAccount
        borderColor={BorderColor.transparent}
        size={AvatarAccountSize.Sm}
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
          color={TextColor.textAlternative}
          ellipsis
          data-testid="address-list-item-address"
        >
          {address}
        </Text>
      </Box>
    </Box>
  );
};
