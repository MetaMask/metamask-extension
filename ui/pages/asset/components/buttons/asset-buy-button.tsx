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
import { Asset } from '../asset-v2';
import Tooltip from '../../../../components/ui/tooltip';
import { getIsBuyableChain } from '../../../../selectors';
import useRamps from '../../../../hooks/experiences/useRamps';

const AssetBuyButton = ({ asset }: { asset: Asset }) => {
  const isBuyableChain = useSelector(getIsBuyableChain);
  const trackEvent = useContext(MetaMetricsContext);
  const { openBuyCryptoInPdapp } = useRamps();

  return (
    <Box width={BlockSize.Full}>
      <Tooltip
        disabled={isBuyableChain}
        title={t('currentlyUnavailable')}
        position="top"
      >
        <ButtonSecondary
          disabled={!isBuyableChain}
          padding={5}
          width={BlockSize.Full}
          onClick={() => {
            openBuyCryptoInPdapp();
            trackEvent({
              event: MetaMetricsEventName.NavBuyButtonClicked,
              category: MetaMetricsEventCategory.Navigation,
              properties: {
                location: 'Token Overview',
                text: 'Buy',
                chain_id: asset.chainId,
                token_symbol: asset.symbol,
              },
            });
          }}
        >
          {t('buy')}
        </ButtonSecondary>
      </Tooltip>
    </Box>
  );
};

export default AssetBuyButton;
