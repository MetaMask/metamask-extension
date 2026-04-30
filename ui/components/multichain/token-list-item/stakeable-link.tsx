import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
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
    <button
      type="button"
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
      className="cursor-pointer border-none p-0 m-0 bg-transparent"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        backgroundColor={BoxBackgroundColor.BackgroundMuted}
        paddingLeft={2}
        paddingRight={2}
        className="rounded"
      >
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          color={TextColor.PrimaryDefault}
        >
          {t('earn')}
        </Text>
        <Icon
          name={IconName.Stake}
          size={IconSize.Xs}
          color={IconColor.PrimaryDefault}
          className="ml-1"
        />
      </Box>
    </button>
  );
};
