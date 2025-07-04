import React, { useState, useContext, useCallback, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  TextAlign,
  TextVariant,
  JustifyContent,
  AlignItems,
  FlexDirection,
  Display,
  BlockSize,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  Box,
  Button,
  Text,
  ButtonSize,
  ButtonVariant,
  ButtonLink,
  ButtonLinkSize,
} from '../../../components/component-library';
import { getHDEntropyIndex, getIsSocialLoginFlow } from '../../../selectors';
import SRPDetailsModal from '../../../components/app/srp-details-modal';
import { getCompletedOnboarding } from '../../../ducks/metamask/metamask';
import SkipSRPBackup from './skip-srp-backup-popover';

export default function SecureYourWallet() {
  const history = useHistory();
  const t = useI18nContext();
  const { search } = useLocation();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const [showSkipSRPBackupPopover, setShowSkipSRPBackupPopover] =
    useState(false);
  const [showSrpDetailsModal, setShowSrpDetailsModal] = useState(false);
  const searchParams = new URLSearchParams(search);
  const isFromReminderParam = searchParams.get('isFromReminder')
    ? '/?isFromReminder=true'
    : '';
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const onboardingCompleted = useSelector(getCompletedOnboarding);

  const trackEvent = useContext(MetaMetricsContext);

  const handleOnShowSrpDetailsModal = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.SrpDefinitionClicked,
      properties: {
        location: 'secure_your_wallet',
      },
    });
    setShowSrpDetailsModal(true);
  }, [trackEvent]);

  const handleClickRecommended = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecurityStarted,
      properties: {
        hd_entropy_index: hdEntropyIndex,
      },
    });
    history.push(`${ONBOARDING_REVIEW_SRP_ROUTE}${isFromReminderParam}`);
  };

  const handleClickNotRecommended = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecuritySkipInitiated,
      properties: {
        hd_entropy_index: hdEntropyIndex,
      },
    });
    setShowSkipSRPBackupPopover(true);
  };

  useEffect(() => {
    // During the onboarding flow, this page does not belong to the social login flow,
    // so we need to redirect to the other pages (based on the browser)
    if (!onboardingCompleted && isSocialLoginFlow) {
      history.replace(ONBOARDING_WELCOME_ROUTE);
    }
  }, [onboardingCompleted, history, isSocialLoginFlow]);

  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.flexStart}
      flexDirection={FlexDirection.Column}
      gap={4}
      height={BlockSize.Full}
      className="secure-your-wallet"
      data-testid="secure-your-wallet"
    >
      <Box>
        {showSkipSRPBackupPopover && (
          <SkipSRPBackup
            onClose={() => setShowSkipSRPBackupPopover(false)}
            secureYourWallet={handleClickRecommended}
          />
        )}
        {showSrpDetailsModal && (
          <SRPDetailsModal onClose={() => setShowSrpDetailsModal(false)} />
        )}
        <Box
          justifyContent={JustifyContent.flexStart}
          marginBottom={4}
          width={BlockSize.Full}
        >
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {t('stepOf', [2, 3])}
          </Text>
          <Text variant={TextVariant.headingLg} as="h2">
            {t('seedPhraseIntroTitle')}
          </Text>
        </Box>
        <Box
          className="secure-your-wallet__srp-design-container"
          marginBottom={6}
          width={BlockSize.Full}
          textAlign={TextAlign.Center}
        >
          <img
            className="secure-your-wallet__srp-design-image"
            src="./images/srp-lock-design.png"
            alt={t('srpDesignImageAlt')}
          />
        </Box>
        <Box>
          <Text color={TextColor.textAlternative} marginBottom={6} as="div">
            {t('secureWalletWalletSaveSrp', [
              [
                <ButtonLink
                  key="secureWalletWalletSaveSrp"
                  size={ButtonLinkSize.Inherit}
                  onClick={handleOnShowSrpDetailsModal}
                >
                  {t('secretRecoveryPhrase')}
                </ButtonLink>,
              ],
            ])}
          </Text>
          <Text color={TextColor.textAlternative}>
            {t('secureWalletWalletRecover')}
          </Text>
        </Box>
      </Box>

      <Box
        width={BlockSize.Full}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={4}
      >
        <Button
          data-testid="secure-wallet-recommended"
          size={ButtonSize.Lg}
          block
          onClick={handleClickRecommended}
        >
          {t('secureWalletGetStartedButton')}
        </Button>
        <Button
          data-testid="secure-wallet-later"
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          block
          onClick={handleClickNotRecommended}
        >
          {t('secureWalletRemindLaterButton')}
        </Button>
      </Box>
    </Box>
  );
}
