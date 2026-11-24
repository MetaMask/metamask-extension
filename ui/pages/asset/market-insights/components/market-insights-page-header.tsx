import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconColor,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const MARKET_INSIGHTS_VIEW_HEADER_TEST_ID =
  'market-insights-view-header';
export const MARKET_INSIGHTS_BACK_BUTTON_TEST_ID =
  'market-insights-back-button';

type MarketInsightsPageHeaderProps = {
  /** Returns to the previous screen. */
  onBackPress: () => void;
};

/**
 * Sticky page header with a back button and centered title.
 *
 * @param props - Component props.
 * @param props.onBackPress - Returns to the previous screen.
 * @returns The page header.
 */
export const MarketInsightsPageHeader = ({
  onBackPress,
}: MarketInsightsPageHeaderProps) => {
  const t = useI18nContext();

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      paddingBottom={3}
      paddingLeft={2}
      paddingRight={2}
      className="sticky top-0 z-10 bg-background-default pt-4"
      data-testid={MARKET_INSIGHTS_VIEW_HEADER_TEST_ID}
    >
      <ButtonIcon
        color={IconColor.IconDefault}
        size={ButtonIconSize.Md}
        ariaLabel={t('back') as string}
        iconName={IconName.ArrowLeft}
        onClick={onBackPress}
        data-testid={MARKET_INSIGHTS_BACK_BUTTON_TEST_ID}
      />
      <Text
        variant={TextVariant.HeadingSm}
        fontWeight={FontWeight.Bold}
        className="flex-1 text-center"
      >
        {t('marketInsightsTitle')}
      </Text>
      <Box className="w-8" />
    </Box>
  );
};
