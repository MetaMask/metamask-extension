import React, { ReactChild } from 'react';

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
import { shortenAddress } from '../../../helpers/utils/util';
import Tooltip from '../../ui/tooltip';

interface AddressListItemProps {
  label: string | ReactChild;
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
      onClick={(e: React.MouseEvent) => {
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
          className="address-list-item__label"
        >
          {label}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          ellipsis
          data-testid="address-list-item-address"
          as="div"
        >
          <Tooltip title={address} position="bottom">
            {shortenAddress(address)}
          </Tooltip>
        </Text>
      </Box>
    </Box>
  );
};
