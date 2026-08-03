import React from 'react';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxFlexDirection,
  ButtonBase,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { CaipAssetType } from '@metamask/utils';

import { ThemeType } from '../../../shared/constants/preferences';
import { getCaipAssetImageUrl } from '../../../shared/lib/asset-utils';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useTheme } from '../../hooks/useTheme';

const POPULAR_ASSETS: {
  assetId: CaipAssetType;
  name: string;
  symbol: string;
}[] = [
  {
    assetId: 'eip155:1/slip44:60' as CaipAssetType,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  {
    assetId:
      'bip122:000000000019d6689c085ae165831e93/slip44:0' as CaipAssetType,
    name: 'Bitcoin',
    symbol: 'BTC',
  },
  {
    assetId:
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501' as CaipAssetType,
    name: 'Solana',
    symbol: 'SOL',
  },
];

type DiscoverNoResultsStateProps = {
  query: string;
  onAssetPress: (assetId: CaipAssetType) => void;
};

export const DiscoverNoResultsState = ({
  query,
  onAssetPress,
}: DiscoverNoResultsStateProps) => {
  const t = useI18nContext();
  const theme = useTheme();
  const activityIcon =
    theme === ThemeType.dark
      ? './images/empty-state-activity-dark.png'
      : './images/empty-state-activity-light.png';

  return (
    <Box
      className="flex h-full flex-col items-center justify-center gap-4 px-4 pt-[60px] text-center"
      data-testid="discover-search-no-results"
    >
      <Box className="flex flex-col items-center gap-[18px]">
        <img
          src={activityIcon}
          alt=""
          width={72}
          height={72}
          aria-hidden="true"
          data-testid="discover-search-no-results-illustration"
        />
        <Box className="flex w-64 flex-col items-center gap-1">
          <Text variant={TextVariant.BodyMd} textAlign={TextAlign.Center}>
            {t('discoverSearchNoResultsFor', [query])}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Center}
          >
            {t('discoverSearchPopularAssets')}
          </Text>
        </Box>
      </Box>
      <Box className="flex w-full items-center justify-center gap-2">
        {POPULAR_ASSETS.map(({ assetId, name, symbol }) => (
          <ButtonBase
            key={assetId}
            className="h-10 rounded-full bg-muted px-3 hover:bg-muted-hover active:bg-pressed"
            data-testid={`discover-search-popular-asset-${symbol.toLowerCase()}`}
            onClick={() => onAssetPress(assetId)}
          >
            <Box
              className="items-center gap-3"
              flexDirection={BoxFlexDirection.Row}
            >
              <AvatarToken
                name={name}
                src={getCaipAssetImageUrl(assetId)}
                size={AvatarTokenSize.Md}
              />
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
                {symbol}
              </Text>
            </Box>
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
};
