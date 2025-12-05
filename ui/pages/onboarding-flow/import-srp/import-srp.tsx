import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useDispatch, useSelector } from 'react-redux';
import { isValidMnemonic } from '@ethersproject/hdnode';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentKeyring } from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getHDEntropyIndex } from '../../../selectors/selectors';
import {
  Text,
  Box,
  Button,
  IconName,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
} from '../../../components/component-library';
import {
  forceUpdateMetamaskState,
  resetOnboarding,
} from '../../../store/actions';
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
  const dispatch = useDispatch();
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState('');
  const [srpError, setSrpError] = useState('');
  const navigate = useNavigate();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const t = useI18nContext();
  const currentKeyring = useSelector(getCurrentKeyring);
  const isWalletResetInProgress = useSelector(getIsWalletResetInProgress);

  useEffect(() => {
    if (currentKeyring && !isWalletResetInProgress) {
      navigate(ONBOARDING_CREATE_PASSWORD_ROUTE, { replace: true });
    }
  }, [currentKeyring, navigate, isWalletResetInProgress]);
  const trackEvent = useContext(MetaMetricsContext);

  const onBack = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // reset onboarding flow
    await dispatch(resetOnboarding());
    await forceUpdateMetamaskState(dispatch);

    navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
  };

  const onContinue = useCallback(() => {
    let newSrpError = '';
    if (
      hasUpperCase(secretRecoveryPhrase) ||
      !isValidMnemonic(secretRecoveryPhrase)
    ) {
      newSrpError = t('invalidSeedPhraseNotFound');
    }

    setSrpError(newSrpError);

    if (newSrpError) {
      return;
    }

    submitSecretRecoveryPhrase?.(secretRecoveryPhrase);

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecurityPhraseConfirmed,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hd_entropy_index: hdEntropyIndex,
      },
    });
    navigate(ONBOARDING_CREATE_PASSWORD_ROUTE);
  }, [
    secretRecoveryPhrase,
    t,
    hdEntropyIndex,
    trackEvent,
    navigate,
    submitSecretRecoveryPhrase,
  ]);

  useEffect(() => {
    setSrpError('');
  }, [secretRecoveryPhrase]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
      gap={4}
      className="import-srp"
      data-testid="import-srp"
    >
      <Box>
        <Box marginBottom={4}>
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            color={IconColor.iconDefault}
            size={ButtonIconSize.Md}
            data-testid="import-srp-back-button"
            onClick={onBack}
            ariaLabel={t('back')}
          />
        </Box>
        <Box textAlign={TextAlign.Left} marginBottom={2}>
          <Text variant={TextVariant.headingLg}>{t('importAWallet')}</Text>
        </Box>
        <SrpInputForm
          error={srpError}
          setSecretRecoveryPhrase={setSecretRecoveryPhrase}
          onClearCallback={() => setSrpError('')}
        />
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        textAlign={TextAlign.Left}
      >
        <Button
          width={BlockSize.Full}
          size={ButtonSize.Lg}
          type="primary"
          data-testid="import-srp-confirm"
          onClick={onContinue}
          disabled={!secretRecoveryPhrase.trim() || Boolean(srpError)}
          className="import-srp__continue-button"
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
}
