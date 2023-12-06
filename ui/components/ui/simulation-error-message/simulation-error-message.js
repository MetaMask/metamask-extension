import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BannerAlert } from '../../component-library';
import { SEVERITIES } from '../../../helpers/constants/design-system';

import { I18nContext } from '../../../../.storybook/i18n';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventUiCustomization,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';

export default function SimulationErrorMessage({
  userAcknowledgedGasMissing = false,
  setUserAcknowledgedGasMissing,
}) {
  const t = useContext(I18nContext);

  const trackEvent = useContext(MetaMetricsContext);

  useEffect(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Transactions,
      event: MetaMetricsEventName.SimulationFails,
      properties: {
        ui_customizations: [
          MetaMetricsEventUiCustomization.GasEstimationFailed,
        ],
      },
    });
  }, []);

  return userAcknowledgedGasMissing === true ? (
    <BannerAlert severity={SEVERITIES.DANGER}>
      {t('simulationErrorMessageV2')}
    </BannerAlert>
  ) : (
    <BannerAlert
      severity={SEVERITIES.DANGER}
      actionButtonLabel={t('proceedWithTransaction')}
      actionButtonOnClick={setUserAcknowledgedGasMissing}
    >
      {t('simulationErrorMessageV2')}
    </BannerAlert>
  );
}

SimulationErrorMessage.propTypes = {
  userAcknowledgedGasMissing: PropTypes.bool,
  setUserAcknowledgedGasMissing: PropTypes.func,
};
