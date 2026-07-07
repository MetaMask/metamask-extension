import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  IconColor,
  BoxJustifyContent,
  BoxAlignItems,
  BoxFlexDirection,
  TextVariant,
  Text,
  Box,
  Button,
  IconName,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { ONBOARDING_CREATE_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentKeyring } from '../../../../shared/lib/selectors/keyring';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import { useOnboardingReset } from '../hooks/useOnboardingReset';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import SrpInputForm from '../../srp-input-form';
import { getIsWalletResetInProgress } from '../../../ducks/metamask/metamask';

type ImportSRPProps = {
  submitSecretRecoveryPhrase: (secretRecoveryPhrase: string) => void;
};

const hasUpperCase = (draftSrp: string) => {
  return draftSrp !== draftSrp.toLowerCase();
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ImportSRP({
  submitSecretRecoveryPhrase,
}: ImportSRPProps) {
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState('');
  const [srpError, setSrpError] = useState('');
  const navigate = useNavigate();
  const resetOnboardingAndReturn = useOnboardingReset();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const t = useI18nContext();
  const currentKeyring = useSelector(getCurrentKeyring);
  const isWalletResetInProgress = useSelector(getIsWalletResetInProgress);

  useEffect(() => {
    if (currentKeyring && !isWalletResetInProgress) {
      navigate(ONBOARDING_CREATE_PASSWORD_ROUTE, { replace: true });
    }
  }, [currentKeyring, navigate, isWalletResetInProgress]);
  const { trackEvent, createEventBuilder } = useAnalytics();

  const onBack = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await resetOnboardingAndReturn();
  };

  const onContinue = useCallback(() => {
    let newSrpError = '';
    if (hasUpperCase(secretRecoveryPhrase)) {
      newSrpError = t('invalidSeedPhraseNotFound');
    }

    setSrpError(newSrpError);

    if (newSrpError) {
      return;
    }

    submitSecretRecoveryPhrase?.(secretRecoveryPhrase);

    trackEvent(
      createEventBuilder(
        MetaMetricsEventName.OnboardingWalletSecurityPhraseConfirmed,
      )
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          hd_entropy_index: hdEntropyIndex,
        })
        .build(),
    );
    navigate(ONBOARDING_CREATE_PASSWORD_ROUTE);
  }, [
    secretRecoveryPhrase,
    t,
    hdEntropyIndex,
    createEventBuilder,
    trackEvent,
    navigate,
    submitSecretRecoveryPhrase,
  ]);

  useEffect(() => {
    setSrpError('');
  }, [secretRecoveryPhrase]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      className="import-srp h-full"
      gap={4}
      data-testid="import-srp"
    >
      <Box>
        <Box marginBottom={4}>
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            color={IconColor.IconDefault}
            size={ButtonIconSize.Md}
            data-testid="import-srp-back-button"
            onClick={onBack}
            ariaLabel={t('back')}
          />
        </Box>
        <Box className="text-left mb-2">
          <Text variant={TextVariant.HeadingLg}>{t('importAWallet')}</Text>
        </Box>
        <SrpInputForm
          error={srpError}
          setSecretRecoveryPhrase={setSecretRecoveryPhrase}
          onClearCallback={() => setSrpError('')}
        />
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        justifyContent={BoxJustifyContent.Center}
        alignItems={BoxAlignItems.Center}
        className="w-full text-left"
      >
        <Button
          size={ButtonSize.Lg}
          variant={ButtonVariant.Primary}
          data-testid="import-srp-confirm"
          onClick={onContinue}
          disabled={!secretRecoveryPhrase.trim() || Boolean(srpError)}
          className="import-srp__continue-button w-full"
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
}
