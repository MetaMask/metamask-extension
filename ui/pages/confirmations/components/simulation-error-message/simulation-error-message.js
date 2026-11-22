import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { BannerAlert } from '../../../../components/component-library';
import { Severity } from '../../../../helpers/constants/design-system';

import { I18nContext } from '../../../../../.storybook/i18n';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventUiCustomization,
} from '../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../hooks/useAnalytics';

export default function SimulationErrorMessage({
  userAcknowledgedGasMissing = false,
  setUserAcknowledgedGasMissing,
}) {
  const t = React.useContext(I18nContext);

  const { trackEvent, createEventBuilder } = useAnalytics();
  const hasTrackedSimulationFails = useRef(false);

  useEffect(() => {
    if (hasTrackedSimulationFails.current) {
      return;
    }

    trackEvent(
      createEventBuilder(MetaMetricsEventName.SimulationFails)
        .addCategory(MetaMetricsEventCategory.Transactions)
        .addProperties({
          ui_customizations: [
            MetaMetricsEventUiCustomization.GasEstimationFailed,
          ],
        })
        .build(),
    );
    hasTrackedSimulationFails.current = true;
  }, [createEventBuilder, trackEvent]);

  return userAcknowledgedGasMissing === true ? (
    <BannerAlert severity={Severity.Danger}>
      {t('simulationErrorMessageV2')}
    </BannerAlert>
  ) : (
    <BannerAlert
      severity={Severity.Danger}
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
