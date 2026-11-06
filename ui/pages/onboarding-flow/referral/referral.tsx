import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconColor,
  IconName,
  Label,
  Text,
  TextColor,
  TextField,
  TextFieldSize,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import { markOnboardingReferralAccepted } from '../../../helpers/referral-rebate';

const PROTOTYPE_REFERRAL_CODE = '8F3A21';

/**
 * Last onboarding step for a new wallet. Shows the same referral offer as the
 * home invite, laid out like the password screen. Continuing or skipping both
 * finish onboarding.
 */
export default function OnboardingReferral() {
  const t = useI18nContext();
  const navigate = useNavigate();

  const finish = useCallback(() => {
    navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
  }, [navigate]);

  const accept = useCallback(() => {
    markOnboardingReferralAccepted();
    finish();
  }, [finish]);

  const handleBack = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      navigate(ONBOARDING_METAMETRICS, { replace: true });
    },
    [navigate],
  );

  return (
    <Box
      asChild
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      gap={4}
      className="h-full w-full"
      data-testid="onboarding-referral"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          accept();
        }}
      >
        <Box>
          <Box className="mb-4 w-full">
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              color={IconColor.IconDefault}
              size={ButtonIconSize.Md}
              data-testid="onboarding-referral-back"
              type="button"
              onClick={handleBack}
              ariaLabel={t('back')}
            />
          </Box>
          <Box className="mb-4 w-full">
            <Text variant={TextVariant.HeadingLg}>
              {t('referralRebateInviteTitle')}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('referralRebateInviteDescription')}
            </Text>
          </Box>
          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Label htmlFor="onboarding-referral-code">
              {t('referralRebateInviteCodeLabel')}
            </Label>
            <TextField
              id="onboarding-referral-code"
              value={PROTOTYPE_REFERRAL_CODE}
              isReadOnly
              size={TextFieldSize.Lg}
              className="h-14 w-full"
              inputProps={{ className: 'px-4 font-medium' }}
              data-testid="onboarding-referral-code"
            />
          </Box>
        </Box>
        <Box flexDirection={BoxFlexDirection.Column} gap={2}>
          <Button
            type="submit"
            data-testid="onboarding-referral-continue"
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isFullWidth
          >
            {t('continue')}
          </Button>
          <Button
            type="button"
            data-testid="onboarding-referral-skip"
            variant={ButtonVariant.Tertiary}
            size={ButtonSize.Lg}
            isFullWidth
            className="text-default"
            onClick={finish}
          >
            {t('referralRebateInviteSkip')}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
