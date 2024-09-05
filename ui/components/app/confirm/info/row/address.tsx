import { NameType } from '@metamask/name-controller';
import React, { memo, useState } from 'react';
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
import { shortenAddress } from '../../../../../helpers/utils/util';
import { useFallbackDisplayName } from './hook';

export type ConfirmInfoRowAddressProps = {
  address: string;
  isSnapUsingThis?: boolean;
};

export const ConfirmInfoRowAddress = memo(
  ({ address, isSnapUsingThis }: ConfirmInfoRowAddressProps) => {
    const isPetNamesEnabled = useSelector(getPetnamesEnabled);
    const { displayName, hexAddress } = useFallbackDisplayName(address);
    const [isNicknamePopoverShown, setIsNicknamePopoverShown] = useState(false);
    const handleDisplayNameClick = () => setIsNicknamePopoverShown(true);
    const onCloseHandler = () => setIsNicknamePopoverShown(false);

    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
      >
        {
          // PetNames on this component are disabled for snaps until the `<Name />`
          // component can support variations. See this comment for context: //
          // https://github.com/MetaMask/metamask-extension/pull/23487#discussion_r1525055546
          isPetNamesEnabled && !isSnapUsingThis ? (
            <Name value={hexAddress} type={NameType.ETHEREUM_ADDRESS} />
          ) : (
            <>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Row}
                alignItems={AlignItems.center}
                onClick={isSnapUsingThis ? () => null : handleDisplayNameClick}
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
                  {isSnapUsingThis ? shortenAddress(address) : displayName}
                </Text>
              </Box>
              {isNicknamePopoverShown ? (
                <NicknamePopovers
                  onClose={onCloseHandler}
                  address={hexAddress}
                />
              ) : null}
            </>
          )
        }
      </Box>
    );
  },
);
