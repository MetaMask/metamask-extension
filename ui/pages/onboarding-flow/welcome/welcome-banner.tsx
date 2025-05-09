import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import {
  ButtonBase,
  ButtonBaseSize,
  IconName,
  Text,
} from '../../../components/component-library';
import { TextVariant } from '../../../helpers/constants/design-system';
import TermsOfUsePopup from '../../../components/app/terms-of-use-popup';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setTermsOfUseLastAgreed } from '../../../store/actions';

export default function WelcomeBanner({ onAccept }: { onAccept: () => void }) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);

  const onAcceptTermsOfUse = () => {
    dispatch(setTermsOfUseLastAgreed(new Date().getTime()));
    onAccept();
  };

  return (
    <div className="welcome-banner">
      <div className="welcome-banner__wrapper">
        <Text className="welcome-banner__title" as="h2" marginBottom={8}>
          {t('welcomeTitle')}
        </Text>
        <Text className="welcome-banner__description" marginBottom={6}>
          {t('welcomeDescription')}
        </Text>
        <ButtonBase
          data-testid="onboarding-get-started-button"
          className="welcome-banner__button"
          size={ButtonBaseSize.Lg}
          onClick={() => setShowTermsOfUse(true)}
          endIconName={IconName.Arrow2Right}
        >
          <Text
            className="welcome-banner__button-text"
            variant={TextVariant.bodyMdMedium}
          >
            {t('welcomeGetStarted')}
          </Text>
        </ButtonBase>
      </div>
      <TermsOfUsePopup
        isOpen={showTermsOfUse}
        onClose={() => setShowTermsOfUse(false)}
        onAccept={() => {
          setShowTermsOfUse(false);
          onAcceptTermsOfUse();
        }}
      />
    </div>
  );
}

WelcomeBanner.propTypes = {
  onAccept: PropTypes.func.isRequired,
};
