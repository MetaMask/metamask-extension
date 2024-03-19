import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { Box, ButtonPrimary } from '../../../../components/component-library';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  BlockSize,
  BorderColor,
} from '../../../../helpers/constants/design-system';
import { t } from '../../../../../app/scripts/translate';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../../shared/constants/metametrics';
import { getMmiPortfolioUrl } from '../../../../selectors/institutional/selectors';
import Tooltip from '../../../../components/ui/tooltip';

const AssetMmiPortfolioButton = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const mmiPortfolioUrl = useSelector(getMmiPortfolioUrl);
  return (
    <Box width={BlockSize.Full}>
      <Tooltip disabled={true}>
        <ButtonPrimary
          width={BlockSize.Full}
          padding={5}
          borderColor={BorderColor.primaryDefault}
          onClick={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Navigation,
              event: MetaMetricsEventName.MMIPortfolioButtonClicked,
            });
            global.platform.openTab({
              url: mmiPortfolioUrl,
            });
          }}
        >
          {t('viewInPortfolio')}
        </ButtonPrimary>
      </Tooltip>
    </Box>
  );
};

export default AssetMmiPortfolioButton;
