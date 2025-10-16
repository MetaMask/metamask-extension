import React, { useState, useEffect, useRef } from 'react';
import { CaipChainId, KnownCaipNamespace } from '@metamask/utils';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
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
import { useI18nContext } from '../../../hooks/useI18nContext';

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
    chainId: CaipChainId,
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
  const t = useI18nContext();
  const networkImageSrc = getImageForChainId(
    chainId.startsWith(KnownCaipNamespace.Eip155)
      ? convertCaipToHexChainId(chainId as CaipChainId)
      : chainId,
  );

  const truncatedAddress = shortenAddress(address); // Shorten address for display
  const [subText, setSubText] = useState(truncatedAddress); // Message below the network name
  const [copyIcon, setCopyIcon] = useState(IconName.Copy); // Default copy icon state
  const [addressCopied, setAddressCopied] = useState(false);

  // Track timeout ID for managing `setTimeout`
  const timeoutRef = useRef<number | null>(null);

  // Update `subText` when the address prop changes
  useEffect(() => {
    setSubText(truncatedAddress);
  }, [address, truncatedAddress]);

  // Cleanup timeout when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Handle "Copy" button click events
  const handleCopyClick = () => {
    // Clear existing timeout if clicking multiple times in rapid succession
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setAddressCopied(true);

    // Trigger copy callback and update UI state
    copyActionParams.callback();
    setSubText(copyActionParams.message);
    setCopyIcon(IconName.CopySuccess);

    // Reset state after 1 second and track the new timeout
    timeoutRef.current = window.setTimeout(() => {
      setSubText(truncatedAddress);
      setCopyIcon(IconName.Copy);
      timeoutRef.current = null; // Clear the reference after timeout resolves
      setAddressCopied(false);
    }, 1000);
  };

  // Handle "QR Code" button click
  const handleQrClick = () => {
    qrActionParams?.callback(
      address,
      networkName,
      formatChainIdToCaip(chainId),
      networkImageSrc,
    );
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
      backgroundColor={
        addressCopied
          ? BackgroundColor.successMuted
          : BackgroundColor.backgroundDefault
      }
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
        style={{ flex: 1, minWidth: 0 }} // Ensure the text shrinks properly
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
          color={
            addressCopied ? TextColor.successDefault : TextColor.textAlternative
          }
          data-testid="multichain-address-row-address"
        >
          {subText}
        </Text>
      </Box>
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
        <ButtonIcon
          iconName={copyIcon}
          size={ButtonIconSize.Md}
          onClick={handleCopyClick}
          ariaLabel={t('copyAddressShort')}
          color={
            addressCopied ? IconColor.successDefault : IconColor.iconDefault
          }
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
