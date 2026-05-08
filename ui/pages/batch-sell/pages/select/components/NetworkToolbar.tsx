import React, { useMemo } from 'react';

import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { CaipChainId } from '@metamask/utils';
import { NetworkChip } from './NetworkChip';

type NetworkToolbarProps = {
  selectedNetworkChainId: CaipChainId;
  networks: {
    chainId: CaipChainId;
    name: string;
    imageUrl: string;
  }[];
  onClick: (chainId: CaipChainId) => void;
};

export const NetworkToolbar = ({
  selectedNetworkChainId,
  networks,
  onClick,
}: NetworkToolbarProps) => {
  return (
    <Box
      paddingHorizontal={4}
      className="w-full"
      data-testid="batch-sell-select-network-toolbar"
    >
      <Box
        gap={2}
        paddingVertical={3}
        flexDirection={BoxFlexDirection.Row}
        style={{
          overflowX: 'auto',
        }}
      >
        {networks.map((network) => (
          <NetworkChip
            key={network.chainId}
            network={network}
            isSelected={network.chainId === selectedNetworkChainId}
            onClick={onClick}
          />
        ))}
      </Box>
    </Box>
  );
};
