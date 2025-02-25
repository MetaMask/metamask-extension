import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  BackgroundColor,
  FontWeight,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { Box, Icon, IconName, IconSize, Text } from '../../component-library';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import {
  getDataCollectionForMarketing,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';

type StakeableLinkProps = {
  chainId: string;
  symbol?: string;
};

export const StakeableLink = ({ chainId, symbol }: StakeableLinkProps) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  return (
    <Box
      as="button"
      backgroundColor={BackgroundColor.transparent}
      data-testid={`staking-entrypoint-${chainId}`}
      gap={1}
      paddingInline={0}
      paddingInlineStart={1}
      paddingInlineEnd={1}
      tabIndex={0}
      onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        e.stopPropagation();
        const url = getPortfolioUrl(
          'stake',
          'ext_stake_button',
          metaMetricsId,
          isMetaMetricsEnabled,
          isMarketingEnabled,
        );
        global.platform.openTab({ url });
        trackEvent({
          event: MetaMetricsEventName.StakingEntryPointClicked,
          category: MetaMetricsEventCategory.Tokens,
          properties: {
            location: 'Token List Item',
            text: 'Stake',
            // FIXME: This might not be a number for non-EVM accounts
            chain_id: chainId,
            token_symbol: symbol,
          },
        });
      }}
    >
      <Text as="span">•</Text>
      <Text
        as="span"
        color={TextColor.primaryDefault}
        paddingInlineStart={1}
        paddingInlineEnd={1}
        fontWeight={FontWeight.Medium}
      >
        {t('stake')}
      </Text>
      <Icon
        name={IconName.Stake}
        size={IconSize.Sm}
        color={IconColor.primaryDefault}
      />
    </Box>
  );
};
