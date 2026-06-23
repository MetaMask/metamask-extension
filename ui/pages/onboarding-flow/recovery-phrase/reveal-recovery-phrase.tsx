import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Text,
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
  ButtonIcon,
  IconName,
  ButtonIconSize,
  TextVariant,
  TextAlign,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
  IconColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  FormTextFieldSize,
  FormTextField,
  TextFieldType,
} from '../../../components/component-library';
import { FontWeight as DesignSystemFontWeight } from '../../../helpers/constants/design-system';
import { getSeedPhrase } from '../../../store/actions';
import {
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVIEW_SRP_ROUTE,
  MANAGE_WALLET_RECOVERY_ROUTE,
} from '../../../helpers/constants/routes';
import { getSeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import { useIsFirefox } from '../../../hooks/useIsFirefox';
import { useOnboardingSearchParams } from '../hooks/useOnboardingSearchParams';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RevealRecoveryPhrase({
  setSecretRecoveryPhrase,
}: {
  setSecretRecoveryPhrase: (seedPhrase: string) => void;
}) {
  const navigate = useNavigate();
  const t = useI18nContext();
  const isFirefox = useIsFirefox();
  const {
    isFromReminder,
    isFromSettingsSecurity,
    nextRouteQueryString,
  } = useOnboardingSearchParams();
  const hasSeedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);

  const [password, setPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);

  useEffect(() => {
    if (hasSeedPhraseBackedUp) {
      navigate(
        isFirefox ? ONBOARDING_COMPLETION_ROUTE : ONBOARDING_METAMETRICS,
        { replace: true },
      );
    }
  }, [navigate, hasSeedPhraseBackedUp, isFirefox]);

  const onSubmit = useCallback(
    async (_password: string) => {
      try {
        const seedPhrase = await getSeedPhrase(_password);
        setSecretRecoveryPhrase(seedPhrase);
        navigate(
          `${ONBOARDING_REVIEW_SRP_ROUTE}${
            nextRouteQueryString ? `?${nextRouteQueryString}` : ''
          }`,
          { replace: true },
        );
      } catch (error) {
        setIsIncorrectPasswordError(true);
      }
    },
    [setSecretRecoveryPhrase, navigate, nextRouteQueryString],
  );

  const returnToPreviousPage = useCallback(() => {
    if (isFromSettingsSecurity) {
      navigate(MANAGE_WALLET_RECOVERY_ROUTE, { replace: true });
    } else {
      navigate(DEFAULT_ROUTE, { replace: true });
    }
  }, [navigate, isFromSettingsSecurity]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      gap={6}
      className="reveal-recovery-phrase h-full"
      data-testid="reveal-recovery-phrase"
    >
      <Box className="w-full">
        <Box
          className="recovery-phrase__header grid w-full"
          alignItems={BoxAlignItems.Center}
          gap={3}
          marginBottom={4}
        >
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            color={IconColor.IconDefault}
            size={ButtonIconSize.Md}
            data-testid="reveal-recovery-phrase-back-button"
            onClick={returnToPreviousPage}
            ariaLabel={t('back')}
          />
          <Text variant={TextVariant.HeadingSm} textAlign={TextAlign.Center}>
            {t('revealSecretRecoveryPhrase')}
          </Text>
          <ButtonIcon
            iconName={IconName.Close}
            color={IconColor.IconDefault}
            size={ButtonIconSize.Md}
            data-testid="reveal-recovery-phrase-close-button"
            onClick={returnToPreviousPage}
            ariaLabel={t('close')}
          />
        </Box>
        <Box className="w-full" asChild>
          <form
            onSubmit={(e: FormEvent<HTMLElement>) => {
              e.preventDefault();
              onSubmit(password);
            }}
          >
            <FormTextField
              size={FormTextFieldSize.Lg}
              id="account-details-authenticate"
              label={t('enterYourPasswordContinue')}
              onChange={(e) => {
                setPassword(e.target.value);
                setIsIncorrectPasswordError(false);
              }}
              value={password}
              error={isIncorrectPasswordError}
              helpText={
                isIncorrectPasswordError
                  ? t('unlockPageIncorrectPassword')
                  : null
              }
              type={TextFieldType.Password}
              labelProps={{ fontWeight: DesignSystemFontWeight.Medium }}
              autoFocus
            />
          </form>
        </Box>
      </Box>
      <Box className="w-full">
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          data-testid="reveal-recovery-phrase-continue"
          className="reveal-recovery-phrase__footer--button w-full"
          onClick={() => onSubmit(password)}
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
}
