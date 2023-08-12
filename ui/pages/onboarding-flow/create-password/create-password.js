import PropTypes from 'prop-types';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import zxcvbn from 'zxcvbn';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  ThreeStepProgressBar,
  TwoStepProgressBar,
  threeStepStages,
  twoStepStages,
} from '../../../components/app/step-progress-bar';
import { Icon, IconName } from '../../../components/component-library';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import CheckBox from '../../../components/ui/check-box';
import FormField from '../../../components/ui/form-field';
import Typography from '../../../components/ui/typography';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { PASSWORD_MIN_LENGTH } from '../../../helpers/constants/common';
import {
  AlignItems,
  FONT_WEIGHT,
  JustifyContent,
  TEXT_ALIGN,
  TypographyVariant,
} from '../../../helpers/constants/design-system';
import { FIRST_TIME_FLOW_TYPES } from '../../../helpers/constants/onboarding';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
} from '../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentKeyring, getFirstTimeFlowType } from '../../../selectors';

export default function CreatePassword({
  createNewAccount,
  importWithRecoveryPhrase,
  secretRecoveryPhrase,
  walletPassword,
}) {
  const t = useI18nContext();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordStrengthText, setPasswordStrengthText] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsChecked, setTermsChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const history = useHistory();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const trackEvent = useContext(MetaMetricsContext);
  const currentKeyring = useSelector(getCurrentKeyring);

  useEffect(() => {
    if (currentKeyring) {
      if (firstTimeFlowType === FIRST_TIME_FLOW_TYPES.IMPORT) {
        history.replace(ONBOARDING_COMPLETION_ROUTE);
      } else {
        history.replace(ONBOARDING_SECURE_YOUR_WALLET_ROUTE);
      }
    }
  }, [currentKeyring, history, firstTimeFlowType]);

  const isValid = useMemo(() => {
    if (!password || !confirmPassword || password !== confirmPassword) {
      return false;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return false;
    }

    return !passwordError && !confirmPasswordError;
  }, [password, confirmPassword, passwordError, confirmPasswordError]);

  const getPasswordStrengthLabel = (isTooShort, score) => {
    if (isTooShort) {
      return {
        className: 'create-password__weak',
        dataTestId: 'short-password-error',
        text: t('passwordNotLongEnough'),
        description: '',
      };
    }
    if (score >= 4) {
      return {
        className: 'create-password__strong',
        dataTestId: 'strong-password',
        text: t('strong'),
        description: '',
      };
    }
    if (score === 3) {
      return {
        className: 'create-password__average',
        dataTestId: 'average-password',
        text: t('average'),
        description: t('passwordStrengthDescription'),
      };
    }
    return {
      className: 'create-password__weak',
      dataTestId: 'weak-password',
      text: t('weak'),
      description: t('passwordStrengthDescription'),
    };
  };

  const handlePasswordChange = (passwordInput) => {
    const isTooShort =
      passwordInput.length && passwordInput.length < PASSWORD_MIN_LENGTH;
    const { score } = zxcvbn(passwordInput);
    const passwordStrengthLabel = getPasswordStrengthLabel(isTooShort, score);
    const passwordStrengthComponent = t('passwordStrength', [
      <span
        key={score}
        data-testid={passwordStrengthLabel.dataTestId}
        className={passwordStrengthLabel.className}
      >
        {passwordStrengthLabel.text}
      </span>,
    ]);
    const confirmError =
      !confirmPassword || passwordInput === confirmPassword
        ? ''
        : t('passwordsDontMatch');

    setPassword(passwordInput);
    setPasswordStrength(passwordStrengthComponent);
    setPasswordStrengthText(passwordStrengthLabel.description);
    setConfirmPasswordError(confirmError);
  };

  const handleConfirmPasswordChange = (confirmPasswordInput) => {
    const error =
      password === confirmPasswordInput ? '' : t('passwordsDontMatch');

    setConfirmPassword(confirmPasswordInput);
    setConfirmPasswordError(error);
  };

  useEffect(() => {
    setTimeout(async () => {
      await importWithRecoveryPhrase(walletPassword, secretRecoveryPhrase);
      history.push(ONBOARDING_COMPLETION_ROUTE);
    }, 1000);
  }, []);

  const handleCreate = async (event) => {
    event?.preventDefault();

    if (!isValid) {
      return;
    }

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletCreationAttempted,
    });

    // If secretRecoveryPhrase is defined we are in import wallet flow
    if (
      secretRecoveryPhrase &&
      firstTimeFlowType === FIRST_TIME_FLOW_TYPES.IMPORT
    ) {
      await importWithRecoveryPhrase(password, secretRecoveryPhrase);
      history.push(ONBOARDING_COMPLETION_ROUTE);
    } else {
      // Otherwise we are in create new wallet flow
      try {
        if (createNewAccount) {
          await createNewAccount(password);
        }
        history.push(ONBOARDING_SECURE_YOUR_WALLET_ROUTE);
      } catch (error) {
        setPasswordError(error.message);
      }
    }
  };

  return (
    <div className="create-password__wrapper" data-testid="create-password">
      {secretRecoveryPhrase &&
      firstTimeFlowType === FIRST_TIME_FLOW_TYPES.IMPORT ? (
        <TwoStepProgressBar
          stage={twoStepStages.PASSWORD_CREATE}
          marginBottom={4}
        />
      ) : (
        <ThreeStepProgressBar
          stage={threeStepStages.PASSWORD_CREATE}
          marginBottom={4}
        />
      )}
      <Typography variant={TypographyVariant.H2} fontWeight={FONT_WEIGHT.BOLD}>
        {t('createPassword')}
      </Typography>
      <Typography variant={TypographyVariant.H4} align={TEXT_ALIGN.CENTER}>
        {t('passwordSetupDetails')}
      </Typography>
      <Box justifyContent={JustifyContent.center} marginTop={3}>
        <form className="create-password__form" onSubmit={handleCreate}>
          <FormField
            dataTestId="create-password-new"
            autoFocus
            passwordStrength={passwordStrength}
            passwordStrengthText={passwordStrengthText}
            onChange={handlePasswordChange}
            password={!showPassword}
            titleText={t('newPassword')}
            value={password}
            titleDetail={
              <Typography variant={TypographyVariant.H7}>
                <a
                  href=""
                  data-testid="show-password"
                  className="create-password__form--password-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPassword(!showPassword);
                  }}
                >
                  {showPassword ? t('hide') : t('show')}
                </a>
              </Typography>
            }
          />
          <FormField
            dataTestId="create-password-confirm"
            onChange={handleConfirmPasswordChange}
            password={!showPassword}
            error={confirmPasswordError}
            titleText={t('confirmPassword')}
            value={confirmPassword}
            titleDetail={
              isValid && (
                <div className="create-password__form--checkmark">
                  <Icon name={IconName.Check} />
                </div>
              )
            }
          />
          <Box
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.spaceBetween}
            marginBottom={4}
          >
            <label className="create-password__form__terms-label">
              <CheckBox
                dataTestId="create-password-terms"
                onClick={() => setTermsChecked(!termsChecked)}
                checked={termsChecked}
              />
              <Typography
                variant={TypographyVariant.H5}
                boxProps={{ marginLeft: 3 }}
              >
                {t('passwordTermsWarning', [
                  <a
                    onClick={(e) => e.stopPropagation()}
                    key="create-password__link-text"
                    href={ZENDESK_URLS.PASSWORD_AND_SRP_ARTICLE}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="create-password__link-text">
                      {t('learnMoreUpperCase')}
                    </span>
                  </a>,
                ])}
              </Typography>
            </label>
          </Box>
          <Button
            data-testid={
              secretRecoveryPhrase &&
              firstTimeFlowType === FIRST_TIME_FLOW_TYPES.IMPORT
                ? 'create-password-import'
                : 'create-password-wallet'
            }
            type="primary"
            large
            className="create-password__form--submit-button"
            disabled={!isValid || !termsChecked}
            onClick={handleCreate}
          >
            {secretRecoveryPhrase &&
            firstTimeFlowType === FIRST_TIME_FLOW_TYPES.IMPORT
              ? t('importMyWallet')
              : t('createNewWallet')}
          </Button>
        </form>
      </Box>
    </div>
  );
}

CreatePassword.propTypes = {
  createNewAccount: PropTypes.func,
  importWithRecoveryPhrase: PropTypes.func,
  secretRecoveryPhrase: PropTypes.string,
};
