import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
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
import { setShowCopyAddressToast } from '../../../ducks/app/app';

export type CopyParams = {
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
  const dispatch = useDispatch();
  const networkImageSrc = getImageForChainId(
    chainId.startsWith(KnownCaipNamespace.Eip155)
      ? convertCaipToHexChainId(chainId as CaipChainId)
      : chainId,
  );

  const truncatedAddress = shortenAddress(address); // Shorten address for display
  const [copyIcon, setCopyIcon] = useState(IconName.Copy); // Default copy icon state

  // Track timeout ID for managing `setTimeout`
  const timeoutRef = useRef<number | null>(null);

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

    // Trigger copy callback
    copyActionParams.callback();

    // Show toast notification
    dispatch(setShowCopyAddressToast('address'));

    // Update icon to success state
    setCopyIcon(IconName.CopySuccess);

    // Reset icon after 400ms (brief visual feedback)
    timeoutRef.current = window.setTimeout(() => {
      setCopyIcon(IconName.Copy);
      timeoutRef.current = null; // Clear the reference after timeout resolves
    }, 400);
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
          color={TextColor.textAlternative}
          data-testid="multichain-address-row-address"
        >
          {truncatedAddress}
        </Text>
      </Box>
      <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
        <ButtonIcon
          iconName={copyIcon}
          size={ButtonIconSize.Md}
          onClick={handleCopyClick}
          ariaLabel={t('copyAddressShort')}
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
