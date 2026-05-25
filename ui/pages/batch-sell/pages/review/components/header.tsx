import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxFlexWrap,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonVariant,
  FontWeight,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
// eslint-disable-next-line import-x/no-restricted-paths
import { formatCurrencyAmount } from '../../../../bridge/utils/quote';
import { Skeleton } from '../../../../../components/component-library/skeleton';

type HeaderProps = {
  quotesAreFetching: boolean;
  atLeastOneQuoteAvailable: boolean;
  anyEnabledAsset: boolean;
  totalReceivedFiat?: number;
  selectedAsset: {
    symbol: string;
    image?: string | null;
  };
  onTotalReceivedFiatIconClick: () => void;
  onSelectReceivedAssetClick: () => void;
};

export const Header = ({
  quotesAreFetching,
  atLeastOneQuoteAvailable,
  anyEnabledAsset,
  totalReceivedFiat,
  selectedAsset,
  onSelectReceivedAssetClick: onSelectAssetClick,
  onTotalReceivedFiatIconClick,
}: HeaderProps) => {
  const t = useI18nContext();
  const currency = useSelector(getCurrentCurrency);
  const formattedTotalReceive = useMemo(() => {
    if (!atLeastOneQuoteAvailable) {
      return formatCurrencyAmount('0', currency, 2);
    }

    return totalReceivedFiat === undefined
      ? '12345' // Hardcoded value to allow skeleton to render
      : formatCurrencyAmount(totalReceivedFiat.toString(), currency, 2);
  }, [totalReceivedFiat, currency, atLeastOneQuoteAvailable]);

  return (
    <Box paddingHorizontal={4} paddingBottom={6} gap={1}>
      <Box
        alignItems={BoxAlignItems.Center}
        flexDirection={BoxFlexDirection.Row}
        gap={1}
      >
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {t('totalReceived')}
        </Text>
        <ButtonIcon
          size={ButtonIconSize.Sm}
          iconName={IconName.Info}
          onClick={onTotalReceivedFiatIconClick}
          ariaLabel={t('totalReceived')}
        />
      </Box>
      <Box
        alignItems={BoxAlignItems.Center}
        flexDirection={BoxFlexDirection.Row}
        gap={1}
        justifyContent={BoxJustifyContent.Between}
        flexWrap={BoxFlexWrap.Wrap}
      >
        <Skeleton
          isLoading={
            quotesAreFetching && anyEnabledAsset && !atLeastOneQuoteAvailable
          }
        >
          <Text
            variant={
              (formattedTotalReceive?.length ?? 0) > 10
                ? TextVariant.DisplayMd
                : TextVariant.DisplayLg
            }
            color={TextColor.SuccessDefault}
            className="min-w-0 break-words"
          >
            {formattedTotalReceive}
          </Text>
        </Skeleton>

        <Button
          variant={ButtonVariant.Secondary}
          onClick={onSelectAssetClick}
          className="flex flex-row items-center gap-2 shrink-0"
        >
          <AvatarToken
            size={AvatarTokenSize.Sm}
            name={selectedAsset.symbol}
            src={selectedAsset.image ?? undefined}
          />
          <Text variant={TextVariant.ButtonLabelMd}>
            {selectedAsset.symbol}
          </Text>
        </Button>
      </Box>
    </Box>
  );
};
