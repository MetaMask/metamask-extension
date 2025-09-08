import React, { useState } from 'react';
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
  BackgroundColor,
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
import { getImageForChainId } from '../../../selectors/multichain';
import { convertCaipToHexChainId } from '../../../../shared/modules/network.utils';

type CopyParams = {
  /**
   * Message to display when the copy callback is executed
   */
  message: string;
  /**
   * Callback function to execute when the copy action is triggered
   */
  callback: () => void;
};

type QrParams = {
  /**
   * Callback function to execute when the QR code action is triggered
   */
  callback: (
    address: string,
    networkName: string,
    networkImageSrc?: string,
  ) => void;
};

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
   * Copy parameters for the address
   */
  copyActionParams: CopyParams;
  /**
   * QR code parameters for the address
   */
  qrActionParams?: QrParams;
  /**
   * Optional className for additional styling
   */
  className?: string;
};

export const MultichainAddressRow = ({
  chainId,
  networkName,
  address,
  copyActionParams,
  qrActionParams,
  className = '',
}: MultichainAddressRowProps) => {
  // We're mixing hex with caip chain ids so its necessary
  // to use the hex format for EVMs and caip for non EVMs.
  const networkImageSrc = getImageForChainId(
    chainId.startsWith(KnownCaipNamespace.Eip155)
      ? convertCaipToHexChainId(chainId as CaipChainId)
      : chainId,
  );

  const truncatedAddress = shortenAddress(address);

  // State for managing blinking effect and temporary message
  const [subText, setSubText] = useState(truncatedAddress);
  const [copyIcon, setCopyIcon] = useState(IconName.Copy);

  const handleCopyClick = () => {
    // Execute the copy callback
    copyActionParams.callback();

    setSubText(copyActionParams.message);
    setCopyIcon(IconName.CopySuccess);

    const timeoutId = setTimeout(() => {
      setSubText(truncatedAddress);
      setCopyIcon(IconName.Copy);
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  const handleQrClick = () => {
    qrActionParams?.callback(address, networkName, networkImageSrc);
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
      backgroundColor={BackgroundColor.backgroundDefault}
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
          {subText} {/* Use dynamic address content */}
        </Text>
      </Box>
      {/* Action buttons */}
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={4}>
        <ButtonIcon
          iconName={copyIcon}
          size={ButtonIconSize.Md}
          onClick={handleCopyClick} // Trigger blinking on copy
          ariaLabel="Copy address"
          color={IconColor.iconDefault}
          data-testid="multichain-address-row-copy-button"
        />
        {qrActionParams ? (
          <ButtonIcon
            iconName={IconName.QrCode}
            size={ButtonIconSize.Md}
            onClick={handleQrClick}
            ariaLabel="Show QR code"
            color={IconColor.iconDefault}
            data-testid="multichain-address-row-qr-button"
          />
        ) : null}
      </Box>
    </Box>
  );
};

export default MultichainAddressRow;
