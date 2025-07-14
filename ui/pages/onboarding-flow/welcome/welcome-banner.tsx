import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  IconName,
  Text,
} from '../../../components/component-library';
import {
  BlockSize,
  TextTransform,
  TextVariant,
} from '../../../helpers/constants/design-system';
import TermsOfUsePopup from '../../../components/app/terms-of-use-popup';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setTermsOfUseLastAgreed } from '../../../store/actions';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function WelcomeBanner({ onAccept }: { onAccept: () => void }) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);

  const onAcceptTermsOfUse = useCallback(() => {
    setShowTermsOfUse(false);
    dispatch(setTermsOfUseLastAgreed(new Date().getTime()));
    onAccept();
  }, [dispatch, onAccept]);

  return (
    <Box className="welcome-banner" paddingInline={6}>
      <Box className="welcome-banner__wrapper" width={BlockSize.Full}>
        <Text
          data-testid="onboarding-welcome-banner-title"
          className="welcome-banner__title"
          as="h2"
          textTransform={TextTransform.Uppercase}
          marginBottom={8}
        >
          {t('welcomeTitle')}
        </Text>
        <Text
          variant={TextVariant.bodyLgMedium}
          className="welcome-banner__description"
          marginBottom={6}
        >
          {t('welcomeDescription')}
        </Text>
        <ButtonBase
          data-testid="onboarding-get-started-button"
          className="welcome-banner__button"
          size={ButtonBaseSize.Lg}
          onClick={() => setShowTermsOfUse(true)}
          endIconName={IconName.Arrow2Right}
          textTransform={TextTransform.Uppercase}
        >
          {t('welcomeGetStarted')}
        </ButtonBase>
      </Box>
      {showTermsOfUse && (
        <TermsOfUsePopup
          onAccept={onAcceptTermsOfUse}
          onClose={() => setShowTermsOfUse(false)}
        />
      )}
    </Box>
  );
}
