import { NameType } from '@metamask/name-controller';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  AlignItems,
  BorderColor,
  Display,
  FlexDirection,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { getPetnamesEnabled } from '../../../../../selectors';
import {
  AvatarAccount,
  AvatarAccountSize,
  Box,
  Text,
} from '../../../../component-library';
import NicknamePopovers from '../../../modals/nickname-popovers';
import Name from '../../../name/name';
import { useFallbackDisplayName } from './hook';

export type ConfirmInfoRowAddressProps = {
  address: string;
};

export const ConfirmInfoRowAddress = ({
  address,
}: ConfirmInfoRowAddressProps) => {
  const isPetNamesEnabled = useSelector(getPetnamesEnabled);
  const { displayName, hexAddress } = useFallbackDisplayName(address);
  const [isNicknamePopoverShown, setIsNicknamePopoverShown] = useState(false);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
    >
      {isPetNamesEnabled ? (
        <Name value={hexAddress} type={NameType.ETHEREUM_ADDRESS} />
      ) : (
        <>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            alignItems={AlignItems.center}
            onClick={() => setIsNicknamePopoverShown(true)}
          >
            <AvatarAccount
              address={address}
              size={AvatarAccountSize.Xs}
              borderColor={BorderColor.transparent}
            />
            <Text
              marginLeft={2}
              color={TextColor.inherit}
              data-testid="confirm-info-row-display-name"
            >
              {displayName}
            </Text>
          </Box>
          {isNicknamePopoverShown ? (
            <NicknamePopovers
              onClose={() => setIsNicknamePopoverShown(false)}
              address={hexAddress}
            />
          ) : null}
        </>
      )}
    </Box>
  );
};
