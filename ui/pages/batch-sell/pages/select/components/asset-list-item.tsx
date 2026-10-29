import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Checkbox,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
// Follow same pattern as with the global PercentageChange component.
// eslint-disable-next-line import-x/no-restricted-paths
import { formatValue } from '../../../../../../app/scripts/lib/util';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import {
  formatCurrencyAmount,
  formatTokenAmount,
  // eslint-disable-next-line import-x/no-restricted-paths
} from '../../../../bridge/utils/quote';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import { getIntlLocale } from '../../../../../ducks/locale/locale';

type AssetListItemProps = {
  asset: BatchSellAsset;
  selected: boolean;
  onSelect: (asset: BatchSellAsset) => void;
  onDeselect: (asset: BatchSellAsset) => void;
};

export const AssetListItem = ({
  asset,
  selected,
  onSelect,
  onDeselect,
}: AssetListItemProps) => {
  const currency = useSelector(getCurrentCurrency);
  const locale = useSelector(getIntlLocale);

  const percentageChangeTextColor = useMemo(() => {
    if (asset.percentageChange === 0 || !asset.percentageChange) {
      return TextColor.TextAlternative;
    }

    return asset.percentageChange < 0
      ? TextColor.ErrorDefault
      : TextColor.SuccessDefault;
  }, [asset.percentageChange]);

  return (
    <Box
      paddingHorizontal={4}
      paddingVertical={3}
      gap={3}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      data-testid="batch-sell-select-asset-list-item"
    >
      <AvatarToken
        size={AvatarTokenSize.Md}
        name={asset.name}
        src={asset.iconUrl ?? undefined}
      />
      <Box gap={1} className="flex-1">
        <Box>
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {asset.name}
          </Text>
        </Box>
        <Box flexDirection={BoxFlexDirection.Row} gap={1}>
          {asset.tokenFiatPrice !== undefined && (
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextAlternative}
            >
              {formatCurrencyAmount(
                asset.tokenFiatPrice.toString(),
                currency,
                2,
              )}
            </Text>
          )}
          {asset.percentageChange !== undefined &&
            asset.percentageChange !== 0 && (
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                color={percentageChangeTextColor}
              >
                {' • '}
                {formatValue(asset.percentageChange, false)}
              </Text>
            )}
        </Box>
      </Box>
      <Box gap={1} className="text-right">
        {asset.tokenFiatAmount !== undefined &&
          asset.tokenFiatAmount !== null && (
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {formatCurrencyAmount(
                asset.tokenFiatAmount.toString(),
                currency,
                2,
              )}
            </Text>
          )}
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
        >
          {formatTokenAmount(locale, asset.balance ?? '0', asset.symbol)}
        </Text>
      </Box>
      <Box>
        <Checkbox
          id={`batch-sell-asset-checkbox-${asset.assetId}`}
          isSelected={selected}
          onChange={(isSelected) =>
            isSelected ? onSelect(asset) : onDeselect(asset)
          }
        />
      </Box>
    </Box>
  );
};
