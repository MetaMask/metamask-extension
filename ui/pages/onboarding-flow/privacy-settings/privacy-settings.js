import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import Typography from '../../../components/ui/typography';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  setFeatureFlag,
  setUsePhishDetect,
  setUseTokenDetection,
} from '../../../store/actions';
import { ONBOARDING_PIN_EXTENSION_ROUTE } from '../../../helpers/constants/routes';

export default function PrivacySettings() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const [usePhishingDetection, setUsePhishingDetection] = useState(true);
  const [turnOnTokenDetection, setTurnOnTokenDetection] = useState(true);
  const [showIncomingTransactions, setShowIncomingTransactions] = useState(
    true,
  );

  const handleSubmit = () => {
    dispatch(
      setFeatureFlag('showIncomingTransactions', showIncomingTransactions),
    );
    dispatch(setUsePhishDetect(usePhishingDetection));
    dispatch(setUseTokenDetection(turnOnTokenDetection));
    history.push(ONBOARDING_PIN_EXTENSION_ROUTE);
  };

  const renderSetting = ({ value, setValue, title, description }) => {
    return (
      <Box justifyContent={JUSTIFY_CONTENT.CENTER} margin={3}>
        <div className="privacy-settings__setting">
          <Typography variant={TYPOGRAPHY.H5} fontWeight={FONT_WEIGHT.BOLD}>
            {title}
          </Typography>
          <Typography variant={TYPOGRAPHY.H6}>{description}</Typography>
        </div>
        <div className="privacy-settings__setting__toggle">
          <ToggleButton value={value} onToggle={(val) => setValue(!val)} />
        </div>
      </Box>
    );
  };

  return (
    <>
      <div className="privacy-settings">
        <div className="privacy-settings__header">
          <Typography variant={TYPOGRAPHY.H2} fontWeight={FONT_WEIGHT.BOLD}>
            {t('setAdvancedPrivacySettings')}
          </Typography>
          <Typography variant={TYPOGRAPHY.H4}>
            {t('setAdvancedPrivacySettingsDetails')}
          </Typography>
        </div>
        <div className="privacy-settings__settings">
          {renderSetting({
            value: showIncomingTransactions,
            setValue: setShowIncomingTransactions,
            title: t('showIncomingTransactions'),
            description: t('onboardingShowIncomingTransactionsDescription', [
              <a
                key="etherscan"
                href="https://etherscan.io/"
                target="_blank"
                rel="noreferrer"
              >
                {t('etherscan')}
              </a>,
              <a
                href="https://cn.etherscan.com/privacyPolicy"
                target="_blank"
                rel="noreferrer"
                key="privacyMsg"
              >
                {t('privacyMsg')}
              </a>,
            ]),
          })}
          {renderSetting({
            value: usePhishingDetection,
            setValue: setUsePhishingDetection,
            title: t('usePhishingDetection'),
            description: t('onboardingUsePhishingDetectionDescription', [
              <a
                href="https://www.jsdelivr.com"
                target="_blank"
                rel="noreferrer"
                key="jsDeliver"
              >
                {t('jsDeliver')}
              </a>,
              <a
                href="https://www.jsdelivr.com/terms/privacy-policy-jsdelivr-com"
                target="_blank"
                rel="noreferrer"
                key="privacyMsg"
              >
                {t('privacyMsg')}
              </a>,
            ]),
          })}
          {renderSetting({
            value: turnOnTokenDetection,
            setValue: setTurnOnTokenDetection,
            title: t('turnOnTokenDetection'),
            description: t('useTokenDetectionDescription'),
          })}
        </div>
        <Button type="primary" rounded onClick={handleSubmit}>
          {t('done')}
        </Button>
      </div>
    </>
  );
}
