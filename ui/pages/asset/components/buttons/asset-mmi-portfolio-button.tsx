import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { ButtonPrimary } from '../../../../components/component-library';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { BlockSize } from '../../../../helpers/constants/design-system';
import { t } from '../../../../../app/scripts/translate';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../../shared/constants/metametrics';
import { getMmiPortfolioUrl } from '../../../../selectors/institutional/selectors';

const AssetMmiPortfolioButton = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const mmiPortfolioUrl = useSelector(getMmiPortfolioUrl);
  return (
    <ButtonPrimary
      width={BlockSize.Full}
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
  );
};

export default AssetMmiPortfolioButton;
