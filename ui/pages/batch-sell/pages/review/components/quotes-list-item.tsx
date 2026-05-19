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
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { CaipAssetType } from '@metamask/utils';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { PerpsSlider } from '../../../../../components/app/perps/perps-slider';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import {
  formatCurrencyAmount,
  formatTokenAmount,
} from '../../../../bridge/utils/quote';
import { getIntlLocale } from '../../../../../ducks/locale/locale';
import { BatchSellQuotesResults } from '../types';
import { Skeleton } from '../../../../../components/component-library/skeleton';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Tag } from '../../../../../components/component-library';
import {
  BackgroundColor,
  TextColor as TextColorLegacy,
} from '../../../../../helpers/constants/design-system';
import {
  MAX_SEND_PERCENT,
  MIN_SEND_PERCENT,
  SEND_PERCENTS_STEPS,
} from '../../../../../constants/batch-sell';

type QuotesListItemProps = {
  asset: BatchSellAsset;
  quote?: BatchSellQuotesResults['quotes'][CaipAssetType];
  isLoading: boolean;
  sendAmountPercent: number;
  canDeleteAssets: boolean;
  onSlippagePercentChangeClick: (asset: BatchSellAsset) => void;
  onSendAmountPercentChange: (
    asset: BatchSellAsset,
    newSendAmountPercent: number,
  ) => void;
  onAssetDeleteClick: (asset: BatchSellAsset) => void;
  enabled: boolean;
};

export const QuotesListItem = ({
  asset,
  sendAmountPercent,
  onSendAmountPercentChange,
  onSlippagePercentChangeClick,
  onAssetDeleteClick,
  canDeleteAssets,
  quote,
  isLoading,
  enabled,
}: QuotesListItemProps) => {
  const t = useI18nContext();
  const currency = useSelector(getCurrentCurrency);
  const locale = useSelector(getIntlLocale);

  // Show skeleton while quotes are being (re)fetched or before the first
  // result lands. Only surface "no quote available" once we have a settled
  // result with `hasQuote: false`.
  const showSkeleton = (isLoading || !quote) && enabled;
  const showNoQuoteAvailable =
    (!isLoading && quote && !quote.hasQuote) || !enabled;

  const quoteFiatAmount = useMemo(
    () =>
      formatCurrencyAmount(
        // Default to an arbitary string to enable skeleton
        (quote?.receivedAmountFiat ?? 1234.34).toString(),
        currency,
        2,
      ),
    [quote, currency],
  );

  const selectedNativeAmount = useMemo(() => {
    const amount = new BigNumber(asset.balance ?? '0').mul(
      sendAmountPercent / 100,
    );
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
          src={asset.iconUrl ?? undefined}
          size={AvatarTokenSize.Lg}
        />
        <Box gap={1} className="flex-1">
          <Skeleton isLoading={showSkeleton} width="50%">
            <Box flexDirection={BoxFlexDirection.Row} gap={2}>
              {showNoQuoteAvailable ? (
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.ErrorDefault}
                >
                  {t('noQuoteAvailable')}
                </Text>
              ) : (
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {quoteFiatAmount}
                </Text>
              )}
              {quote?.hasHighPriceImpactWarning && (
                <Tag
                  iconName={IconName.Danger}
                  label={t('bridgePriceImpactHigh')}
                  textVariant={TextVariant.BodyXs}
                  className="font-medium"
                  labelProps={{ color: TextColor.WarningDefault } as never}
                  startIconProps={{ className: 'text-warning-default' }}
                  backgroundColor={BackgroundColor.warningMuted}
                  iconSize={IconSize.Xs}
                />
              )}
            </Box>
          </Skeleton>

          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {selectedNativeAmount} • {sendAmountPercent}%
          </Text>
        </Box>
        <ButtonIcon
          ariaLabel={t('swapAdjustSlippage')}
          className="text-icon-alternative"
          iconName={IconName.Customize}
          size={ButtonIconSize.Md}
          onClick={() => onSlippagePercentChangeClick(asset)}
        />
        <ButtonIcon
          ariaLabel={t('delete')}
          className="text-icon-alternative"
          iconName={IconName.RemoveMinus}
          size={ButtonIconSize.Md}
          disabled={!canDeleteAssets}
          onClick={() => onAssetDeleteClick(asset)}
        />
      </Box>
      <Box paddingRight={3}>
        <PerpsSlider
          min={MIN_SEND_PERCENT}
          max={MAX_SEND_PERCENT}
          step={SEND_PERCENTS_STEPS}
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
