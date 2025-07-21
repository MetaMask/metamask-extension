import React from 'react';
import {
  AlignItems,
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
import { MultichainNetwork } from '../../../selectors/multichain';

type MultichainAddressRowProps = {
  /**
   * Network object containing nickname, chainId, and rpcPrefs with imageUrl
   */
  network: MultichainNetwork;
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
  network,
  address,
  className = '',
}: MultichainAddressRowProps) => {
  const [copied, handleCopy] = useCopyToClipboard();

  const networkImageSrc = network.network.rpcPrefs?.imageUrl;
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
      padding={4}
      gap={4}
      data-testid="multichain-address-row"
    >
      <AvatarNetwork
        size={AvatarNetworkSize.Md}
        name={network.nickname}
        src={networkImageSrc}
        borderRadius={BorderRadius.LG}
        data-testid="multichain-address-row-network-icon"
      />

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        style={{ flex: 1 }}
      >
        <Text
          variant={TextVariant.bodyMdMedium}
          color={TextColor.textDefault}
          data-testid="multichain-address-row-network-name"
        >
          {network.nickname}
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
