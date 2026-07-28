import React, { useState, useEffect, useRef, useMemo } from 'react';
import classnames from 'clsx';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  Text,
  TextVariant,
  TextAlign,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { shortenAddress } from '../../../helpers/utils/util';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { CopyParams } from '../multichain-address-row/multichain-address-row';
import { getNetworksByScopes } from '../../../../shared/lib/selectors/networks';
import { MultichainAccountNetworkGroup } from '../multichain-account-network-group';
import { normalizeSafeAddress } from '../../../../shared/lib/multichain/address';

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

  const truncatedAddress = shortenAddress(normalizeSafeAddress(address)); // Shorten address for display
  const [displayText, setDisplayText] = useState(truncatedAddress); // Text to display (address or copy message)
  const [copyIcon, setCopyIcon] = useState<IconName>(IconName.Copy); // Default copy icon state
  const [addressCopied, setAddressCopied] = useState(false);
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

  const networks = useSelector((state) => getNetworksByScopes(state, chainIds));

  const groupName = useMemo(() => {
    if (networks[0]?.name === 'Bitcoin') {
      return t('networkNameBitcoinSegwit');
    }

    return chainIds.some((chain) => chain.startsWith('eip155:'))
      ? t('networkNameEthereum')
      : networks[0]?.name;
  }, [chainIds, t, networks]);

  // Handle "Copy" button click events
  const handleCopyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
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
      className={classnames(
        'multichain-aggregated-address-row group',
        className,
        {
          'hover:bg-muted': !addressCopied,
          'bg-success-muted': addressCopied,
        },
      )}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      gap={2}
      paddingTop={1}
      paddingBottom={1}
      data-testid="multichain-address-row"
      onClick={handleCopyClick}
    >
      <Box
        gap={2}
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
      >
        <MultichainAccountNetworkGroup chainIds={chainIds} limit={4} />
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {groupName}
        </Text>
      </Box>
      <Box
        gap={1}
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.End}
        alignItems={BoxAlignItems.Center}
      >
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          textAlign={TextAlign.Right}
          className={classnames({
            'text-alternative group-hover:text-primary-default-hover':
              !addressCopied,
            'text-success-default': addressCopied,
          })}
          style={{ minWidth: '100px' }}
        >
          {displayText}
        </Text>
        <Icon
          name={copyIcon}
          size={IconSize.Sm}
          className={classnames({
            'text-icon-alternative group-hover:text-primary-default':
              !addressCopied,
            'text-success-default': addressCopied,
          })}
          aria-label={t('copyAddressShort')}
        />
      </Box>
    </Box>
  );
};
