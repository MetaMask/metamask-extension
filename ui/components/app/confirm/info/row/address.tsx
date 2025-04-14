import { NameType } from '@metamask/name-controller';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { memo, useState } from 'react';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { Box, Text } from '../../../../component-library';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import NicknamePopovers from '../../../modals/nickname-popovers';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import Name from '../../../name/name';
import { shortenAddress } from '../../../../../helpers/utils/util';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import Identicon from '../../../../ui/identicon';
import { useFallbackDisplayName } from './hook';

export type ConfirmInfoRowAddressProps = {
  address: string;
  chainId: string;
  isSnapUsingThis?: boolean;
};

export const ConfirmInfoRowAddress = memo(
  ({ address, chainId, isSnapUsingThis }: ConfirmInfoRowAddressProps) => {
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
          isSnapUsingThis ? (
            <>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Row}
                alignItems={AlignItems.center}
                onClick={isSnapUsingThis ? () => null : handleDisplayNameClick}
              >
                <Identicon address={address} diameter={16} />
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
          ) : (
            <Name
              value={hexAddress}
              type={NameType.ETHEREUM_ADDRESS}
              preferContractSymbol
              variation={chainId}
            />
          )
        }
      </Box>
    );
  },
);
