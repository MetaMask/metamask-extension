import React from 'react';
import { CaipChainId, KnownCaipNamespace } from '@metamask/utils';

import {
  AlignItems,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../component-library';
import { shortenAddress } from '../../../helpers/utils/util';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { getImageForChainId } from '../../../selectors/multichain';
import { convertCaipToHexChainId } from '../../../../shared/modules/network.utils';

type MultichainAddressRowProps = {
  /**
   * Chain ID to identify the network
   */
  chainId: string;
  /**
   * Network name to display
   */
  networkName: string;
  /**
   * Address string to display (will be truncated)
   */
  address: string;
  /**
   * Optional className for additional styling
   */
  className?: string;
};

export const MultichainAddressRow = ({
  chainId,
  networkName,
  address,
  className = '',
}: MultichainAddressRowProps) => {
  const [copied, handleCopy] = useCopyToClipboard();

  // We're mixing hex with caip chain ids so its necessary
  // to use the hex format for EVMs and caip for non EVMs.
  const networkImageSrc = getImageForChainId(
    chainId.startsWith(KnownCaipNamespace.Eip155)
      ? convertCaipToHexChainId(chainId as CaipChainId)
      : chainId,
  );
  const truncatedAddress = shortenAddress(address);

  const handleCopyClick = () => {
    handleCopy(address);
  };

  const handleQrClick = () => {
    console.log('QR code clicked for address:', address);
  };

  return (
    <Box
      className={`multichain-address-row ${className}`}
      display={Display.Flex}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.spaceBetween}
      paddingTop={4}
      paddingBottom={4}
      gap={4}
      data-testid="multichain-address-row"
    >
      <AvatarNetwork
        size={AvatarNetworkSize.Md}
        name={networkName}
        src={networkImageSrc}
        borderRadius={BorderRadius.LG}
        data-testid="multichain-address-row-network-icon"
      />

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        // Parent Box with flex: 1 needs minWidth: 0 to allow it to shrink below its content size.
        // Without that, the flex item would expand the entire row to fit the text content
        // instead of being constrained by the grid cell.
        style={{ flex: 1, minWidth: 0 }}
      >
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textDefault}
          data-testid="multichain-address-row-network-name"
          ellipsis={true}
          width={BlockSize.Full}
        >
          {networkName}
        </Text>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          data-testid="multichain-address-row-address"
        >
          {truncatedAddress}
        </Text>
      </Box>

      {/* Action buttons */}
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={4}>
        <ButtonIcon
          iconName={copied ? IconName.CopySuccess : IconName.Copy}
          size={ButtonIconSize.Md}
          onClick={handleCopyClick}
          ariaLabel="Copy address"
          color={IconColor.iconDefault}
          data-testid="multichain-address-row-copy-button"
        />

        <ButtonIcon
          iconName={IconName.QrCode}
          size={ButtonIconSize.Md}
          onClick={handleQrClick}
          ariaLabel="Show QR code"
          color={IconColor.iconDefault}
          data-testid="multichain-address-row-qr-button"
        />
      </Box>
    </Box>
  );
};

export default MultichainAddressRow;
