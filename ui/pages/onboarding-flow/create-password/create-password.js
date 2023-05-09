import React, { useState, useMemo, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import zxcvbn from 'zxcvbn';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../../components/ui/button';
import {
  TextAlign,
  TextVariant,
  JustifyContent,
  FontWeight,
  AlignItems,
} from '../../../helpers/constants/design-system';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
} from '../../../helpers/constants/routes';
import FormField from '../../../components/ui/form-field';
import Box from '../../../components/ui/box';
import CheckBox from '../../../components/ui/check-box';
import {
  ThreeStepProgressBar,
  threeStepStages,
  TwoStepProgressBar,
  twoStepStages,
} from '../../../components/app/step-progress-bar';
import { PASSWORD_MIN_LENGTH } from '../../../helpers/constants/common';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { getFirstTimeFlowType, getCurrentKeyring } from '../../../selectors';
import { FIRST_TIME_FLOW_TYPES } from '../../../helpers/constants/onboarding';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { Icon, IconName, Text } from '../../../components/component-library';

export default function CreatePassword({
  createNewAccount,
  importWithRecoveryPhrase,
  secretRecoveryPhrase,
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
      <Text
        variant={TextVariant.headingLg}
        as="h2"
      >
        {t('createPassword')}
      </Text>
      <Text variant={TextVariant.headingSm} as="h4" align={TextAlign.Center}>
        {t('passwordSetupDetails')}
      </Text>
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
              <Text variant={TextVariant.bodySm} as="h6">
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
              </Text>
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
              <Text variant={TextVariant.bodyMd} as="h5" marginLeft={3}>
                {t('passwordTermsWarning', [
                  <a
                    onClick={(e) => e.stopPropagation()}
                    key="create-password__link-text"
                    href={ZENDESK_URLS.PASSWORD_ARTICLE}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="create-password__link-text">
                      {t('learnMoreUpperCase')}
                    </span>
                  </a>,
                ])}
              </Text>
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
