import React, { useMemo } from 'react';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { PerpsSlider } from '../../../../../components/app/perps/perps-slider';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import {
  formatCurrencyAmount,
  formatTokenAmount,
} from '../../../../bridge/utils/quote';
import { getIntlLocale } from '../../../../../ducks/locale/locale';

type QuotesListItemProps = {
  asset: BatchSellAsset;
  sendAmountPercent: number;
  canDeleteAssets: boolean;
  onSlippagePercentChangeClick: (asset: BatchSellAsset) => void;
  onSendAmountPercentChange: (
    asset: BatchSellAsset,
    newSendAmountPercent: number,
  ) => void;
  onAssetDeleteClick: (asset: BatchSellAsset) => void;
};

export const QuotesListItem = ({
  asset,
  sendAmountPercent,
  onSendAmountPercentChange,
  onSlippagePercentChangeClick,
  onAssetDeleteClick,
  canDeleteAssets,
}: QuotesListItemProps) => {
  const currency = useSelector(getCurrentCurrency);
  const locale = useSelector(getIntlLocale);

  const selectedFiatAmount = useMemo(() => {
    const amount = (asset.fiatBalance ?? 0) * (sendAmountPercent / 100);
    return formatCurrencyAmount(amount.toString(), currency, 2);
  }, [asset.fiatBalance, sendAmountPercent, currency]);

  const selectedNativeAmount = useMemo(() => {
    const amount = new BigNumber(asset.balance).mul(sendAmountPercent / 100);
    return formatTokenAmount(locale, amount.toString(), asset.symbol);
  }, [asset.balance, locale, sendAmountPercent, asset.symbol]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      paddingHorizontal={4}
      paddingVertical={2}
      gap={2}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={4}
        alignItems={BoxAlignItems.Center}
      >
        <AvatarToken
          name={asset.symbol}
          src={asset.image}
          size={AvatarTokenSize.Lg}
        />
        <Box gap={1} className="flex-1">
          {selectedFiatAmount && (
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {selectedFiatAmount}
            </Text>
          )}
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {selectedNativeAmount} • {sendAmountPercent}%
          </Text>
        </Box>
        <ButtonIcon
          ariaLabel=""
          className="text-icon-alternative"
          iconName={IconName.Customize}
          size={ButtonIconSize.Md}
          onClick={() => onSlippagePercentChangeClick(asset)}
        />
        <ButtonIcon
          ariaLabel=""
          className="text-icon-alternative"
          iconName={IconName.RemoveMinus}
          size={ButtonIconSize.Md}
          disabled={!canDeleteAssets}
          onClick={() => onAssetDeleteClick(asset)}
        />
      </Box>
      <Box paddingRight={3}>
        <PerpsSlider
          min={0}
          max={100}
          step={25}
          value={sendAmountPercent}
          markInterval={1}
          onChange={(_, value) =>
            onSendAmountPercentChange(
              asset,
              Array.isArray(value) ? value[0] : value,
            )
          }
        />
      </Box>
    </Box>
  );
};
