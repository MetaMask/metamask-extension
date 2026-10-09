import React from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { MONEY_START_EARNING_LABEL_KEY } from '../../../../hooks/money/use-money-asset-overview-ctas';
import { TooltipText } from '../tooltip-text';

export const MONEY_ASSET_OVERVIEW_BALANCE_CTA_TEST_ID =
  'money-asset-overview-balance-cta';

export type MoneyAssetOverviewBalanceDescriptionProps = {
  tokenSymbol: string;
  apyPercent: number;
  projectedEarnings: string;
  privacyMode: boolean;
  onTooltipOpen: () => void;
};

export const MoneyAssetOverviewBalanceDescription = ({
  tokenSymbol,
  apyPercent,
  projectedEarnings,
  privacyMode,
  onTooltipOpen,
}: MoneyAssetOverviewBalanceDescriptionProps) => {
  const t = useI18nContext();

  return (
    <Box
      paddingLeft={4}
      paddingRight={4}
      paddingBottom={2}
      data-testid={`${MONEY_ASSET_OVERVIEW_BALANCE_CTA_TEST_ID}-description`}
    >
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('moneyEarnBalanceDescription', [
          tokenSymbol,
          <TooltipText
            key="projected-earnings"
            text={projectedEarnings}
            isHidden={privacyMode}
            variant={TextVariant.BodyMd}
            color={TextColor.SuccessDefault}
            onOpen={onTooltipOpen}
            data-testid={`${MONEY_ASSET_OVERVIEW_BALANCE_CTA_TEST_ID}-earnings`}
          >
            {t('moneyAccountProjectedBalanceTooltip', [String(apyPercent)])}
          </TooltipText>,
        ])}
      </Text>
    </Box>
  );
};

export const MoneyAssetOverviewBalanceApy = ({ apy }: { apy: string }) => {
  const t = useI18nContext();

  return (
    <Text
      variant={TextVariant.BodySm}
      fontWeight={FontWeight.Medium}
      color={TextColor.SuccessDefault}
      data-testid={`${MONEY_ASSET_OVERVIEW_BALANCE_CTA_TEST_ID}-apy`}
    >
      {t('moneyEarnApy', [apy])}
    </Text>
  );
};

export const MoneyAssetOverviewBalanceCta = ({
  onStartEarning,
}: {
  onStartEarning: () => void;
}) => {
  const t = useI18nContext();

  return (
    <Box paddingLeft={4} paddingRight={4} paddingTop={2}>
      <Button
        isFullWidth
        size={ButtonSize.Lg}
        variant={ButtonVariant.Primary}
        onClick={onStartEarning}
        data-testid={`${MONEY_ASSET_OVERVIEW_BALANCE_CTA_TEST_ID}-start-earning`}
      >
        {t(MONEY_START_EARNING_LABEL_KEY)}
      </Button>
    </Box>
  );
};
