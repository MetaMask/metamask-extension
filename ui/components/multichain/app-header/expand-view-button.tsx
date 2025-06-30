import React, { useContext } from 'react';
import { ButtonIcon, ButtonIconSize, IconName } from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

const METRICS_LOCATION = 'AppHeader';

export const ExpandViewButton = () => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const handleExpandView = () => {
    if (global?.platform?.openExtensionInBrowser) {
      global.platform.openExtensionInBrowser();
      trackEvent({
        event: MetaMetricsEventName.AppWindowExpanded,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          location: METRICS_LOCATION,
        },
      });
    }
  };

  return (
    <ButtonIcon
      iconName={IconName.Expand}
      ariaLabel={t('expandView')}
      onClick={handleExpandView}
      size={ButtonIconSize.Md}
    />
  );
};
