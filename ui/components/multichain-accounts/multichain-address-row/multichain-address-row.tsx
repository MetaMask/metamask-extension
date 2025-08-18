import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconColor,
  IconName,
  Text,
  TextVariant,
  TextColor,
  BoxJustifyContent,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  twMerge,
} from '@metamask/design-system-react';
import { shortenAddress } from '../../../helpers/utils/util';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { getImageForChainId } from '../../../selectors/multichain';

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

  const networkImageSrc = getImageForChainId(chainId);
  const truncatedAddress = shortenAddress(address);

  const handleCopyClick = () => {
    handleCopy(address);
  };

  const handleQrClick = () => {
    console.log('QR code clicked for address:', address);
  };

  return (
    <Box
      className={twMerge('w-full flex', className)}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      padding={4}
      gap={4}
      data-testid="multichain-address-row"
    >
      <AvatarNetwork
        size={AvatarNetworkSize.Md}
        name={networkName}
        src={networkImageSrc}
        data-testid="multichain-address-row-network-icon"
      />

      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        className="flex-1 min-w-0"
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextDefault}
          data-testid="multichain-address-row-network-name"
          ellipsis
          className="w-full"
        >
          {networkName}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          data-testid="multichain-address-row-address"
          className="w-full"
        >
          {truncatedAddress}
        </Text>
      </Box>

      {/* Action buttons */}
      <Box alignItems={BoxAlignItems.Center} gap={4}>
        <ButtonIcon
          iconName={copied ? IconName.CopySuccess : IconName.Copy}
          size={ButtonIconSize.Md}
          onClick={handleCopyClick}
          ariaLabel="Copy address"
          color={IconColor.IconDefault}
          data-testid="multichain-address-row-copy-button"
        />

        <ButtonIcon
          iconName={IconName.QrCode}
          size={ButtonIconSize.Md}
          onClick={handleQrClick}
          ariaLabel="Show QR code"
          color={IconColor.IconDefault}
          data-testid="multichain-address-row-qr-button"
        />
      </Box>
    </Box>
  );
};

export default MultichainAddressRow;
