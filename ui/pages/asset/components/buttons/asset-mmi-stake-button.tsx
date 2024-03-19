import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { ButtonSecondary } from '../../../../components/component-library';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { BlockSize } from '../../../../helpers/constants/design-system';
import { t } from '../../../../../app/scripts/translate';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../../../shared/constants/metametrics';
import { getMmiPortfolioUrl } from '../../../../selectors/institutional/selectors';

const AssetMmiStakeButton = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const mmiPortfolioUrl = useSelector(getMmiPortfolioUrl);
  return (
    <ButtonSecondary
      width={BlockSize.Full}
      onClick={() => {
        trackEvent({
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.MMIPortfolioButtonClicked,
        });
        global.platform.openTab({
          url: `${mmiPortfolioUrl}/stake`,
        });
      }}
    >
      {t('stake')}
    </ButtonSecondary>
  );
};

export default AssetMmiStakeButton;
