import { useDispatch } from 'react-redux';
import React, { useCallback, useState } from 'react';
import { setOnboardingActiveStep } from '../../../../../ducks/rewards';
import { OnboardingStep } from '../../../../../ducks/rewards/types';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  ModalBody,
  TextField,
  TextFieldSize,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import useValidateReferralCode from '../../hooks/useValidateReferralCode';
import LoadingIndicator from '../../../../ui/loading-indicator';
import RewardsErrorBanner from '../RewardsErrorBanner';
import {
  REWARDS_ONBOARD_OPTIN_LEGAL_LEARN_MORE_URL,
  REWARDS_ONBOARD_TERMS_URL,
} from './constants';
import { Link } from '@material-ui/core';

const OnboardingStep4: React.FC = () => {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const handleNext = useCallback(() => {
    // TODO: handle opt-in with referral code
  }, [dispatch]);

  // TODO: use opt-in hook
  const [optinLoading, setOptinLoading] = useState(false);
  const [optinError, setOptinError] = useState(false);

  const {
    referralCode,
    setReferralCode: handleReferralCodeChange,
    isValidating: isValidatingReferralCode,
    isValid: referralCodeIsValid,
    isUnknownError: isUnknownErrorReferralCode,
  } = useValidateReferralCode();

  const referralCodeIsError =
    referralCode.length >= 6 &&
    !referralCodeIsValid &&
    !isValidatingReferralCode &&
    !isUnknownErrorReferralCode;

  console.log('referralCodeIsValid', referralCodeIsValid);
  console.log('referralCode', referralCode);
  console.log('isValidatingReferralCode', isValidatingReferralCode);
  console.log('isUnknownErrorReferralCode', isUnknownErrorReferralCode);

  const renderIcon = () => {
    if (isValidatingReferralCode) {
      return (
        <LoadingIndicator alt={undefined} title={undefined} isLoading={true} />
      );
    }

    if (referralCodeIsValid) {
      return (
        <Icon
          name={IconName.Confirmation}
          size={IconSize.Lg}
          color={IconColor.SuccessDefault}
        />
      );
    }

    if (referralCode.length >= 6) {
      return (
        <Icon
          name={IconName.Error}
          size={IconSize.Lg}
          color={IconColor.ErrorDefault}
        />
      );
    }

    return null;
  };

  const renderStepImage = () => (
    <img
      src="/images/rewards/rewards-onboarding-step4.png"
      className="z-10 object-contain self-center my-4"
      width={100}
      height={100}
      alt={t('rewardsOnboardingStep4Title')}
    />
  );

  const renderStepInfo = () => (
    <Box className="flex flex-col min-h-30 gap-4">
      <Text variant={TextVariant.HeadingLg} className="text-center my-2">
        {t('rewardsOnboardingStep4Title')}
      </Text>
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Bold}
        className="text-center mt-8 mb-2"
      >
        {t('rewardsOnboardingStep4ReferralCodeInput')}
      </Text>
      <Box className="relative">
        <TextField
          placeholder={t('rewardsOnboardingStep4ReferralCodePlaceholder')}
          value={referralCode}
          autoCapitalize="characters"
          onChange={(e) => handleReferralCodeChange(e.target.value)}
          disabled={optinLoading}
          size={TextFieldSize.Lg}
          className="w-full"
          style={{
            backgroundColor: optinLoading
              ? 'bg-background-pressed'
              : 'bg-background-default',
            borderColor: referralCodeIsError
              ? 'border-error-default'
              : 'border-muted',
          }}
          endAccessory={renderIcon()}
          error={referralCodeIsError}
        />
        {referralCodeIsError && (
          <Text className="text-error-default">
            {t('rewardsOnboardingStep4ReferralCodeError')}
          </Text>
        )}
      </Box>

      {isUnknownErrorReferralCode && (
        <RewardsErrorBanner
          title={t('rewardsOnboardingStep4ReferralCodeUnknownError')}
          description={t(
            'rewardsOnboardingStep4ReferralCodeUnknownErrorDescription',
          )}
        />
      )}
    </Box>
  );

  /**
   * Renders the action buttons section
   */
  const renderActions = () => (
    <Box className="flex flex-col justify-end flex-1 mb-2">
      <Button
        size={ButtonSize.Lg}
        onClick={handleNext}
        className="w-full bg-white my-2"
      >
        {t('rewardsOnboardingStepOptIn')}
      </Button>
    </Box>
  );

  const renderLegalDisclaimer = () => {
    const openTermsOfUse = () => {
      window.open(REWARDS_ONBOARD_TERMS_URL, '_blank', 'noopener,noreferrer');
    };

    const openLearnMore = () => {
      window.open(
        REWARDS_ONBOARD_OPTIN_LEGAL_LEARN_MORE_URL,
        '_blank',
        'noopener,noreferrer',
      );
    };

    return (
      <Box className="w-full flex-row mt-4">
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          className="justify-center flex-wrap gap-2"
        >
          <Text
            variant={TextVariant.BodySm}
            className="text-alternative text-center"
          >
            {t('rewardsOnboardingStep4LegalDisclaimer1')}{' '}
            <Link className="text-primary-default" onClick={openTermsOfUse}>
              {t('rewardsOnboardingStep4LegalDisclaimer2')}
            </Link>
            {t('rewardsOnboardingStep4LegalDisclaimer3')}{' '}
            <Link className="text-primary-default" onClick={openLearnMore}>
              {t('rewardsOnboardingStep4LegalDisclaimer4')}
            </Link>
            .{' '}
          </Text>
        </Box>
      </Box>
    );
  };

  return (
    <ModalBody className="w-full h-full pt-8 pb-4 flex flex-col">
      {/* Error Section */}
      {optinError && (
        <RewardsErrorBanner
          title={t('rewardsOnboardingStep4OptInError')}
          description={t('rewardsOnboardingStep4OptInErrorDescription')}
        />
      )}

      {/* Image Section */}
      {renderStepImage()}

      {/* Title Section */}
      {renderStepInfo()}

      {/* Actions Section */}
      {renderActions()}

      {/* Legal Disclaimer Section */}
      {renderLegalDisclaimer()}
    </ModalBody>
  );
};

export default OnboardingStep4;
