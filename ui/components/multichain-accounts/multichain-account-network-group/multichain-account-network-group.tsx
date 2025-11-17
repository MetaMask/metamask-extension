import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import { Box } from '@metamask/design-system-react';
import { AvatarGroup } from '../../multichain/avatar-group';
import { AvatarType } from '../../multichain/avatar-group/avatar-group.types';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import { convertCaipToHexChainId } from '../../../../shared/modules/network.utils';
import { getInternalAccountListSpreadByScopesByGroupId } from '../../../selectors/multichain-accounts/account-tree';

export type MultichainAccountNetworkGroupProps = {
  /**
   * The account group ID to fetch networks for
   */
  groupId?: AccountGroupId;
  /**
   * Array of specific chain IDs to display
   * - If provided with groupId: shows only chains that exist in both the group and this list
   * - If provided without groupId: shows only these specific chains
   */
  chainIds?: string[];
  /**
   * Whether to exclude test networks (default: true)
   */
  excludeTestNetworks?: boolean;
  /**
   * Maximum number of avatars to display before showing "+X"
   */
  limit?: number;
  /**
   * Optional className for additional styling
   */
  className?: string;
};

/**
 * A reusable component that displays a group of network avatars.
 * Can fetch networks based on account group ID or accept explicit chain IDs.
 * Handles conversion from CAIP chain IDs to hex format for EVM chains.
 *
 * @param props - The component props
 * @param props.groupId - The account group ID to fetch networks for. When provided, fetches chain IDs from the account group.
 * @param props.chainIds - Array of specific chain IDs to display. Behavior depends on groupId:
 * - If provided with groupId: shows only chains that exist in both the group and this list (intersection)
 * - If provided without groupId: shows only these specific chains
 * @param props.excludeTestNetworks - Whether to exclude test networks from display. Defaults to true.
 * @param props.limit - Maximum number of avatars to display before showing "+X" indicator. Defaults to 4.
 * @param props.className - Optional CSS class name for additional styling
 * @returns A React component displaying network avatars in a group
 */
export const MultichainAccountNetworkGroup: React.FC<
  MultichainAccountNetworkGroupProps
> = ({
  groupId,
  chainIds,
  excludeTestNetworks = true,
  limit = 4,
  className,
}) => {
  // Fetch chain IDs from account group if groupId is provided
  const accountGroupScopes = useSelector((state) =>
    groupId
      ? getInternalAccountListSpreadByScopesByGroupId(state, groupId)
      : [],
  );

  const filteredChainIds = useMemo(() => {
    // If only filterChainIds is provided (no groupId), show those chains
    if (chainIds && !groupId) {
      return chainIds;
    }

    // If groupId is provided
    if (groupId && accountGroupScopes.length > 0) {
      // Extract unique chain IDs from account group scopes
      const groupChainIds = new Set<string>();
      accountGroupScopes.forEach((item) => {
        groupChainIds.add(item.scope);
      });

      // If filterChainIds is also provided, show intersection
      if (chainIds) {
        const filterSet = new Set(chainIds);
        return Array.from(groupChainIds).filter((chainId) =>
          filterSet.has(chainId),
        );
      }

      // Otherwise, show all chains from the group
      return Array.from(groupChainIds);
    }

    return [];
  }, [chainIds, groupId, accountGroupScopes]);

  const networkData = useMemo(() => {
    if (excludeTestNetworks) {
      // TODO: Add test network filtering logic here
      // For now, we'll keep all networks
    }

    // Define chain priority - these chains will appear first in this order
    const chainPriority: Record<string, number> = {
      // Ethereum mainnet
      'eip155:1': 1,
      '0x1': 1,
      // Linea mainnet
      'eip155:59144': 2,
      '0xe708': 2,
      // Solana mainnet
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': 3,
      // Bitcoin mainnet
      'bip122:000000000019d6689c085ae165831e93': 4,
    };

    // Sort chainIds based on priority
    const sortedChainIds = [...filteredChainIds].sort((a, b) => {
      const priorityA = chainPriority[a] || 999;
      const priorityB = chainPriority[b] || 999;
      return priorityA - priorityB;
    });

    return sortedChainIds
      .map((chain) => {
        let hexChainId = chain;
        // Convert CAIP chain ID to hex format for EVM chains
        if (chain.startsWith('eip155:')) {
          try {
            hexChainId = convertCaipToHexChainId(
              chain as `${string}:${string}`,
            );
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
      })
      .filter((network) => network.avatarValue); // Only include networks with valid avatar images
  }, [filteredChainIds, excludeTestNetworks]);

  return (
    <Box
      style={{
        flexShrink: 1,
        width: 'fit-content',
      }}
    >
      <AvatarGroup
        limit={limit}
        members={networkData}
        avatarType={AvatarType.NETWORK}
        className={className}
      />
    </Box>
  );
};
