import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { Box, ButtonSecondary } from '../../../../components/component-library';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { BlockSize } from '../../../../helpers/constants/design-system';
import { t } from '../../../../../app/scripts/translate';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../../shared/constants/metametrics';
import { AssetType } from '../../../../../shared/constants/transaction';
import { getIsBridgeChain, getMetaMetricsId } from '../../../../selectors';
import { getPortfolioUrl } from '../../../../helpers/utils/portfolio';
import { Asset } from '../asset-v2';
import Tooltip from '../../../../components/ui/tooltip';

const AssetBridgeButton = ({ asset }: { asset: Asset }) => {
  const isBridgeChain = useSelector(getIsBridgeChain);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const trackEvent = useContext(MetaMetricsContext);

  return (
    <Box width={BlockSize.Full}>
      <Tooltip
        disabled={isBridgeChain}
        title={t('currentlyUnavailable')}
        position="top"
      >
        <ButtonSecondary
          disabled={!isBridgeChain}
          width={BlockSize.Full}
          padding={5}
          onClick={() => {
            const portfolioUrl = getPortfolioUrl(
              'bridge',
              'ext_bridge_button',
              metaMetricsId,
            );
            global.platform.openTab({
              url: `${portfolioUrl}&token=${
                asset.type === AssetType.native ? 'native' : asset.address
              }`,
            });
            trackEvent({
              category: MetaMetricsEventCategory.Navigation,
              event: MetaMetricsEventName.BridgeLinkClicked,
              properties: {
                location: 'Asset Overview',
                text: 'Bridge',
                chain_id: asset.chainId,
                token_symbol: asset.symbol,
              },
            });
          }}
        >
          {t('bridge')}
        </ButtonSecondary>
      </Tooltip>
    </Box>
  );
};

export default AssetBridgeButton;
