import React, { useState, useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  TwoStepProgressBarHardware,
  twoStepStagesHardware,
} from '../../../components/app/step-progress-bar';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import Typography from '../../../components/ui/typography';
import {
  FONT_WEIGHT,
  TEXT_ALIGN,
  TypographyVariant,
} from '../../../helpers/constants/design-system';
import { ONBOARDING_CREATE_PASSWORD_ROUTE, ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import SrpInput from '../../../components/app/srp-input';
import { getCurrentKeyring } from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import ConnectHardwareForm from '../../create-account/connect-hardware';

export default function ImportSRP({ submitSecretRecoveryPhrase }) {
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState('');
  const history = useHistory();
  const t = useI18nContext();
  const currentKeyring = useSelector(getCurrentKeyring);

  useEffect(() => {
    if (currentKeyring) {
      // history.replace(ONBOARDING_CREATE_PASSWORD_ROUTE);
    }
  }, [currentKeyring, history]);
  const trackEvent = useContext(MetaMetricsContext);

  return (
    <div className="import-srp" data-testid="import-srp">

    <TwoStepProgressBarHardware
      stage={twoStepStagesHardware.CONNECT_HARDWARE_ACCOUNTS}
      marginBottom={4}
    />

    <ConnectHardwareForm nextRoute={ONBOARDING_COMPLETION_ROUTE} history={history} />

    </div>
  );
}

ImportSRP.propTypes = {
  submitSecretRecoveryPhrase: PropTypes.func,
};
