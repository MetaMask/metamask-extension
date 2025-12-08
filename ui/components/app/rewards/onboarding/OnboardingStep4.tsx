import React, { useCallback } from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextButton,
  TextButtonSize,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import {
  ModalBody,
  TextField,
  TextFieldSize,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useValidateReferralCode } from '../../../../hooks/rewards/useValidateReferralCode';
import LoadingIndicator from '../../../ui/loading-indicator';
import RewardsErrorBanner from '../RewardsErrorBanner';
import { useOptIn } from '../../../../hooks/rewards/useOptIn';
import { selectOnboardingReferralCode } from '../../../../ducks/rewards/selectors';
import {
  REWARDS_ONBOARD_OPTIN_LEGAL_LEARN_MORE_URL,
  REWARDS_ONBOARD_TERMS_URL,
} from './constants';
import ProgressIndicator from './ProgressIndicator';

type OnboardingStep4Props = {
  rewardPoints?: number;
  shieldSubscriptionId?: string;
};

const OnboardingStep4: React.FC<OnboardingStep4Props> = ({
  rewardPoints,
  shieldSubscriptionId,
}) => {
  const t = useI18nContext();

  const { optinLoading, optinError, optin } = useOptIn({
    rewardPoints,
    shieldSubscriptionId,
  });
  const onboardingReferralCode = useSelector(selectOnboardingReferralCode);

  const {
    referralCode,
    setReferralCode: handleReferralCodeChange,
    isValidating: isValidatingReferralCode,
    isValid: referralCodeIsValid,
    isUnknownError: isUnknownErrorReferralCode,
  } = useValidateReferralCode(
    onboardingReferralCode
      ? onboardingReferralCode.trim().toUpperCase()
      : undefined,
  );
  const handleNext = useCallback(async () => {
    await optin(referralCode);
  }, [optin, referralCode]);

  const renderIcon = () => {
    if (isValidatingReferralCode) {
      return (
        <LoadingIndicator
          alt={t('rewardsOptInVerifyingReferralCode')}
          title={t('rewardsOptInVerifyingReferralCode')}
          isLoading={true}
          style={{ width: 32, height: 32, left: 5 }}
        />
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

  const referralCodeIsError =
    referralCode.length >= 6 &&
    !referralCodeIsValid &&
    !isValidatingReferralCode &&
    !isUnknownErrorReferralCode;

  const isDisabled =
    optinLoading ||
    (!referralCodeIsValid && Boolean(referralCode)) ||
    isUnknownErrorReferralCode;

  const renderStepInfo = () => (
    <Box
      className="flex flex-col flex-1 gap-4 justify-center"
      data-testid="rewards-onboarding-step4-info"
    >
      <img
        src="https://images.ctfassets.net/9sy2a0egs6zh/2W921m9iDZsozDlv1pNx4z/c04e3577afd665ae5434d8b7115c4bcc/rewards-onboarding-step4.png"
        className="z-10 object-contain self-center"
        width={100}
        height={100}
        alt={t('rewardsOnboardingStep4Title')}
      />

      <Text variant={TextVariant.HeadingLg} className="text-center">
        {referralCodeIsValid
          ? t('rewardsOnboardingStep4TitleWithReferralCode')
          : t('rewardsOnboardingStep4Title')}
      </Text>
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Bold}
        className="text-center mt-8"
      >
        {t('rewardsOnboardingStep4ReferralCodeInput')}
      </Text>
      <Box className="relative" style={{ height: 64 }}>
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
          <Text variant={TextVariant.BodySm} className="text-error-default">
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
    <Box
      className="flex flex-col justify-end my-2"
      data-testid="rewards-onboarding-step4-actions"
    >
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        onClick={handleNext}
        className="w-full my-2"
        disabled={isDisabled}
        isDisabled={isDisabled}
        isLoading={optinLoading}
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
      <Box
        className="w-full flex-row mt-2"
        data-testid="rewards-onboarding-step4-legal-disclaimer"
      >
        <Text
          variant={TextVariant.BodySm}
          className="text-alternative text-center"
        >
          {t('rewardsOnboardingStep4LegalDisclaimer', [
            <TextButton
            size={TextButtonSize.BodySm}
            className="text-primary-default"
            onClick={openTermsOfUse}
            >
              {t('rewardsOnboardingStep4LegalDisclaimerTermsLink')}
            </TextButton>,
             <TextButton
             size={TextButtonSize.BodySm}
             className="text-primary-default"
             onClick={openLearnMore}
            >
              {t('rewardsOnboardingStep4LegalDisclaimerLearnMoreLink')}
            </TextButton>,
          ])}
        </Text>
      </Box>
    );
  };

  return (
    <ModalBody
      className="w-full h-full pt-8 pb-4 flex flex-col"
      data-testid="rewards-onboarding-step4-container"
    >
      {/* Progress Indicator */}
      <ProgressIndicator
        totalSteps={4}
        currentStep={4}
        data-testid="rewards-onboarding-step4-progress"
      />

      {/* Error Section */}
      {optinError && (
        <Box className="pt-4">
          <RewardsErrorBanner
            title={t('rewardsOnboardingStep4OptInError')}
            description={optinError}
          />
        </Box>
      )}

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
