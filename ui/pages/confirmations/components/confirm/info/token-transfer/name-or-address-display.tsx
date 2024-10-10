import { NameType } from '@metamask/name-controller';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useFallbackDisplayName } from '../../../../../../components/app/confirm/info/row/hook';
import NicknamePopovers from '../../../../../../components/app/modals/nickname-popovers';
import Name from '../../../../../../components/app/name';
import {
  AvatarAccount,
  AvatarAccountSize,
  Box,
  Text,
} from '../../../../../../components/component-library';
import {
  AlignItems,
  BorderColor,
  Display,
  FlexDirection,
  TextColor,
} from '../../../../../../helpers/constants/design-system';
import { getPetnamesEnabled } from '../../../../../../selectors';

export const NameOrAddressDisplay = ({ address }: { address: string }) => {
  const isPetNamesEnabled = useSelector(getPetnamesEnabled);
  const { displayName, hexAddress } = useFallbackDisplayName(address);
  const [isNicknamePopoverShown, setIsNicknamePopoverShown] = useState(false);
  const handleDisplayNameClick = () => setIsNicknamePopoverShown(true);
  const onCloseHandler = () => setIsNicknamePopoverShown(false);

  if (isPetNamesEnabled) {
    return <Name value={hexAddress} type={NameType.ETHEREUM_ADDRESS} />;
  }

  return (
    <>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        onClick={handleDisplayNameClick}
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
        <NicknamePopovers onClose={onCloseHandler} address={hexAddress} />
      ) : null}
    </>
  );
};
