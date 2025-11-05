import React, { useState, useEffect, useRef, useMemo } from 'react';
import { shortenAddress } from '../../../helpers/utils/util';

import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AvatarGroup } from '../../multichain/avatar-group';
import { AvatarType } from '../../multichain/avatar-group/avatar-group.types';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import { CopyParams } from '../multichain-address-row/multichain-address-row';

type MultichainAggregatedAddressListRowProps = {
  /**
   * List of chain ids associated with an address
   */
  chainIds: string[];
  /**
   * Address string to display (will be truncated)
   */
  address: string;
  /**
   * Name for the group of address
   */
  groupName: string;
  /**
   * Copy parameters for the address
   */
  copyActionParams: CopyParams;
  /**
   * Optional className for additional styling
   */
  className?: string;
};

export const MultichainAggregatedAddressListRow = ({
  chainIds,
  groupName,
  address,
  copyActionParams,
  className = '',
}: MultichainAggregatedAddressListRowProps) => {
  const t = useI18nContext();

  const truncatedAddress = shortenAddress(address); // Shorten address for display
  const [displayText, setDisplayText] = useState(truncatedAddress); // Text to display (address or copy message)
  const [copyIcon, setCopyIcon] = useState(IconName.Copy); // Default copy icon state
  const [addressCopied, setAddressCopied] = useState(false);

  // Track timeout ID for managing `setTimeout`
  const timeoutRef = useRef<number | null>(null);

  // Update `displayText` when the address prop changes
  useEffect(() => {
    setDisplayText(truncatedAddress);
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

  const networkData = useMemo(() => {
    return chainIds.map((chain) => {
      return {
        avatarValue:
          CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
            chain as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
          ],
      };
    });
  }, [chainIds]);

  // Handle "Copy" button click events
  const handleCopyClick = () => {
    // Clear existing timeout if clicking multiple times in rapid succession
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setAddressCopied(true);

    // Trigger copy callback and update UI state
    copyActionParams.callback();
    setDisplayText(copyActionParams.message);
    setCopyIcon(IconName.CopySuccess);

    // Reset state after 1 second and track the new timeout
    timeoutRef.current = window.setTimeout(() => {
      setDisplayText(truncatedAddress);
      setCopyIcon(IconName.Copy);
      timeoutRef.current = null; // Clear the reference after timeout resolves
      setAddressCopied(false);
    }, 1000);
  };

  return (
    <Box
      className={`multichain-address-row ${className}`}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      padding={4}
      gap={4}
      data-testid="multichain-address-row"
      backgroundColor={
        addressCopied
          ? BoxBackgroundColor.SuccessMuted
          : BoxBackgroundColor.BackgroundDefault
      }
      onClick={handleCopyClick}
    >
      <Box gap={4} flexDirection={BoxFlexDirection.Row}>
        <AvatarGroup
          limit={4}
          members={networkData}
          avatarType={AvatarType.NETWORK}
        />
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Bold}>
          {groupName}
        </Text>
      </Box>
      <Box
        gap={4}
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
      >
        <Text
          variant={TextVariant.BodyXs}
          fontWeight={FontWeight.Medium}
          color={
            addressCopied ? TextColor.SuccessDefault : TextColor.TextAlternative
          }
        >
          {displayText}
        </Text>
        <ButtonIcon
          iconName={copyIcon}
          onClick={handleCopyClick}
          size={ButtonIconSize.Sm}
          color={
            addressCopied ? IconColor.SuccessDefault : IconColor.IconAlternative
          }
          ariaLabel={t('copyAddressShort')}
        />
      </Box>
    </Box>
  );
};
