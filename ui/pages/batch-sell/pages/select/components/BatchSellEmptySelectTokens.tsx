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
import { getMetaMetricsId, getParticipateInMetaMetrics, getDataCollectionForMarketing } from '../../../../../selectors';
import { getPortfolioUrl } from '../../../../../helpers/utils/portfolio';

export const BatchSellEmptySelectTokens = () => {
  const t = useI18nContext();
  const theme = useTheme();
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const defiIcon =
    theme === ThemeType.dark
      ? '/images/empty-state-defi-dark.png'
      : '/images/empty-state-defi-light.png';

  const navigateToExplorer = useCallback(() => {
    const url = getPortfolioUrl(
      'explore/tokens',
      'ext_batch_sell_empty',
      metaMetricsId,
      isMetaMetricsEnabled,
      isMarketingEnabled,
    );
    global.platform.openTab({ url });
  }, [metaMetricsId, isMetaMetricsEnabled, isMarketingEnabled]);

  return (
    <Box flexDirection={BoxFlexDirection.Column} className="h-full w-full">
      <Box
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        flexDirection={BoxFlexDirection.Column}
        gap={3}
        padding={4}
        className="flex-1"
      >
        <img src={defiIcon} className="h-[72px] w-[72px]" />
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
            onClick={navigateToExplorer}
            className="self-center"
          >
            {t('exploreTokens')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
