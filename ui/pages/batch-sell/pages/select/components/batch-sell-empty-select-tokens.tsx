import React, { useCallback } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { ThemeType } from '../../../../../../shared/constants/preferences';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useTheme } from '../../../../../hooks/useTheme';
import {
  getAnalyticsId,
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
  getDataCollectionForMarketing,
} from '../../../../../selectors';
import { getPortfolioUrl } from '../../../../../helpers/utils/portfolio';

export const BatchSellEmptySelectTokens = () => {
  const t = useI18nContext();
  const theme = useTheme();
  const analyticsId = useSelector(getAnalyticsId);
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const isOptedIn = useSelector(getOptedIn);
  const isMetaMetricsEnabled = completedMetaMetricsOnboarding && isOptedIn;
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const defiIcon =
    theme === ThemeType.dark
      ? '/images/empty-state-defi-dark.png'
      : '/images/empty-state-defi-light.png';

  const navigateToPortfolioDiscover = useCallback(() => {
    const url = getPortfolioUrl(
      'explore/tokens',
      'ext_batch_sell_empty',
      analyticsId,
      isMetaMetricsEnabled ?? undefined,
      isMarketingEnabled,
    );
    globalThis.platform.openTab({ url });
  }, [analyticsId, isMetaMetricsEnabled, isMarketingEnabled]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full w-full"
      data-testid="batch-sell-select-empty-page"
    >
      <Box
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        flexDirection={BoxFlexDirection.Column}
        gap={3}
        padding={4}
        className="flex-1"
      >
        <img alt={t('defiIcon')} src={defiIcon} className="h-[72px] w-[72px]" />
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          gap={3}
          paddingHorizontal={4}
        >
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            className="w-[240px] text-center"
          >
            {t('batchSellEmptyStateDescription')}
          </Text>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={navigateToPortfolioDiscover}
            className="self-center"
          >
            {t('exploreTokens')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
