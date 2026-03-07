import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  BackgroundColor,
  BorderRadius,
  Display,
  AlignItems,
  FontWeight,
  IconColor,
  TextColor,
  TextVariant,
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
  const { trackEvent } = useContext(MetaMetricsContext);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  return (
    <Box
      as="button"
      backgroundColor={BackgroundColor.backgroundMuted}
      borderRadius={BorderRadius.SM}
      display={Display.Flex}
      alignItems={AlignItems.center}
      paddingLeft={2}
      paddingRight={2}
      data-testid={`staking-entrypoint-${chainId}`}
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
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: chainId,
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            token_symbol: symbol,
          },
        });
      }}
    >
      <Text
        variant={TextVariant.bodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.primaryDefault}
      >
        {t('earn')}
      </Text>
      <Icon
        name={IconName.Stake}
        size={IconSize.Xs}
        color={IconColor.primaryDefault}
        marginLeft={1}
      />
    </Box>
  );
};
