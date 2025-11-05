import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIconSize,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { shortenAddress } from '../../../helpers/utils/util';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { AvatarGroup } from '../../multichain/avatar-group';
import { AvatarType } from '../../multichain/avatar-group/avatar-group.types';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import { CopyParams } from '../multichain-address-row/multichain-address-row';
import { getNetworksByScopes } from '../../../../shared/modules/selectors/networks';
import { convertCaipToHexChainId } from '../../../../shared/modules/network.utils';
import { ButtonIcon, IconName } from '../../component-library';
import { IconColor } from '../../../helpers/constants/design-system';

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
  address,
  copyActionParams,
  className = '',
}: MultichainAggregatedAddressListRowProps) => {
  const t = useI18nContext();

  const truncatedAddress = shortenAddress(address); // Shorten address for display
  const [displayText, setDisplayText] = useState(truncatedAddress); // Text to display (address or copy message)
  const [copyIcon, setCopyIcon] = useState(IconName.Copy); // Default copy icon state
  const [addressCopied, setAddressCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Track timeout ID for managing `setTimeout`
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      let hexChainId = chain;
      // Convert CAIP chain ID to hex format for EVM chains
      if (chain.startsWith('eip155:')) {
        try {
          hexChainId = convertCaipToHexChainId(chain as `${string}:${string}`);
        } catch {
          // If conversion fails, fall back to using the original chain ID
          hexChainId = chain;
        }
      }
      return {
        avatarValue:
          CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
            hexChainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
          ],
      };
    });
  }, [chainIds]);

  const networks = useSelector((state) => getNetworksByScopes(state, chainIds));

  const groupName = useMemo(() => {
    return chainIds.some((chain) => chain.startsWith('eip155:'))
      ? t('networkNameEthereum')
      : networks[0]?.name;
  }, [chainIds, t, networks]);

  // Helper function to get text color based on state
  const getTextColor = () => {
    if (addressCopied) {
      return TextColor.SuccessDefault;
    }
    if (isHovered) {
      return TextColor.PrimaryDefaultHover;
    }
    return TextColor.TextAlternative;
  };

  // Helper function to get icon color based on state
  const getIconColor = () => {
    if (addressCopied) {
      return IconColor.successDefault;
    }
    if (isHovered) {
      return IconColor.primaryDefault;
    }
    return IconColor.iconAlternative;
  };

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
    timeoutRef.current = setTimeout(() => {
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
          color={getTextColor()}
        >
          {displayText}
        </Text>
        <ButtonIcon
          iconName={copyIcon}
          size={ButtonIconSize.Sm}
          color={getIconColor()}
          ariaLabel={t('copyAddressShort')}
        />
      </Box>
    </Box>
  );
};
