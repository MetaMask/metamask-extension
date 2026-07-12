import React, { useMemo } from 'react';
import { type CaipChainId } from '@metamask/utils';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonBase,
  Text,
  TextVariant,
  FontWeight,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export type RampsNetworkOption = {
  chainId: CaipChainId;
  name: string;
  image?: string;
};

export type RampsNetworkFilterBarProps = {
  networks: RampsNetworkOption[];
  selectedChainId: CaipChainId | null;
  onChange: (chainId: CaipChainId | null) => void;
};

export function RampsNetworkFilterBar({
  networks,
  selectedChainId,
  onChange,
}: RampsNetworkFilterBarProps) {
  const t = useI18nContext();

  const pills = useMemo(
    () => [
      {
        key: 'all',
        label: t('allNetworks'),
        chainId: null as CaipChainId | null,
        image: undefined,
      },
      ...networks.map((network) => ({
        key: network.chainId,
        label: network.name,
        chainId: network.chainId,
        image: network.image,
      })),
    ],
    [networks, t],
  );

  return (
    <Box
      className="overflow-x-auto px-4 py-3"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
      data-testid="ramps-network-filter-bar"
    >
      {pills.map((pill) => {
        const isSelected =
          pill.chainId === selectedChainId ||
          (pill.chainId === null && selectedChainId === null);

        return (
          <ButtonBase
            key={pill.key}
            onClick={() => onChange(pill.chainId)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 min-w-0 h-auto ${
              isSelected
                ? 'bg-primary-default text-primary-inverse'
                : 'bg-background-alternative hover:bg-hover active:bg-pressed text-text-default'
            }`}
            data-testid={`ramps-network-filter-${pill.key}`}
            aria-pressed={isSelected}
          >
            {pill.image ? (
              <AvatarNetwork
                size={AvatarNetworkSize.Xs}
                name={pill.label}
                src={pill.image}
              />
            ) : null}
            <Text
              variant={TextVariant.BodySm}
              fontWeight={isSelected ? FontWeight.Medium : FontWeight.Regular}
            >
              {pill.label}
            </Text>
          </ButtonBase>
        );
      })}
    </Box>
  );
}

export default RampsNetworkFilterBar;
