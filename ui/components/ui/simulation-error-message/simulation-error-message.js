import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import ActionableMessage from '../actionable-message';
import { I18nContext } from '../../../../.storybook/i18n';

export default function SimulationErrorMessage({
  userAcknowledgedGasMissing = false,
  setUserAcknowledgedGasMissing,
}) {
  const t = useContext(I18nContext);

  return (
    <ActionableMessage
      message={t('simulationErrorMessageV2')}
      useIcon
      iconFillColor="var(--color-error-default)"
      type="danger"
      primaryActionV2={
        userAcknowledgedGasMissing === true
          ? undefined
          : {
              label: t('proceedWithTransaction'),
              onClick: setUserAcknowledgedGasMissing,
            }
      }
    />
  );
}

SimulationErrorMessage.propTypes = {
  userAcknowledgedGasMissing: PropTypes.bool,
  setUserAcknowledgedGasMissing: PropTypes.func,
};
