import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Text,
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
  ButtonIcon,
  IconName,
  ButtonIconSize,
  FormTextFieldSize,
  FormTextField,
  TextFieldType,
} from '../../../components/component-library';
import {
  TextVariant,
  JustifyContent,
  BlockSize,
  IconColor,
  Display,
  FlexDirection,
  AlignItems,
  FontWeight,
  TextAlign,
} from '../../../helpers/constants/design-system';
import { getSeedPhrase } from '../../../store/actions';
import {
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVIEW_SRP_ROUTE,
  REVEAL_SRP_LIST_ROUTE,
} from '../../../helpers/constants/routes';
import { getSeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function RevealRecoveryPhrase({
  setSecretRecoveryPhrase,
}: {
  setSecretRecoveryPhrase: (seedPhrase: string) => void;
}) {
  const navigate = useNavigate();
  const t = useI18nContext();
  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const isFromReminder = searchParams.get('isFromReminder');
  const isFromSettingsSecurity = searchParams.get('isFromSettingsSecurity');
  const hasSeedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);
  const queryParams = new URLSearchParams();
  if (isFromReminder) {
    queryParams.set('isFromReminder', isFromReminder);
  }
  if (isFromSettingsSecurity) {
    queryParams.set('isFromSettingsSecurity', isFromSettingsSecurity);
  }
  const nextRouteQueryString = queryParams.toString();

  const [password, setPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);

  useEffect(() => {
    if (hasSeedPhraseBackedUp) {
      const isFirefox = getBrowserName() === PLATFORM_FIREFOX;
      navigate(
        isFirefox ? ONBOARDING_COMPLETION_ROUTE : ONBOARDING_METAMETRICS,
        { replace: true },
      );
    }
  }, [navigate, hasSeedPhraseBackedUp]);

  const onSubmit = useCallback(
    async (_password) => {
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
      navigate(REVEAL_SRP_LIST_ROUTE, { replace: true });
    } else {
      navigate(DEFAULT_ROUTE, { replace: true });
    }
  }, [navigate, isFromSettingsSecurity]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.center}
      height={BlockSize.Full}
      gap={6}
      className="reveal-recovery-phrase"
      data-testid="reveal-recovery-phrase"
    >
      <Box width={BlockSize.Full}>
        <Box
          className="recovery-phrase__header"
          display={Display.Grid}
          alignItems={AlignItems.center}
          gap={3}
          marginBottom={4}
          width={BlockSize.Full}
        >
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            color={IconColor.iconDefault}
            size={ButtonIconSize.Md}
            data-testid="reveal-recovery-phrase-back-button"
            onClick={returnToPreviousPage}
            ariaLabel={t('back')}
          />
          <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
            {t('revealSecretRecoveryPhrase')}
          </Text>
          <ButtonIcon
            iconName={IconName.Close}
            color={IconColor.iconDefault}
            size={ButtonIconSize.Md}
            data-testid="reveal-recovery-phrase-close-button"
            onClick={returnToPreviousPage}
            ariaLabel={t('close')}
          />
        </Box>
        <Box
          width={BlockSize.Full}
          as="form"
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
              isIncorrectPasswordError ? t('unlockPageIncorrectPassword') : null
            }
            type={TextFieldType.Password}
            labelProps={{ fontWeight: FontWeight.Medium }}
            autoFocus
          />
        </Box>
      </Box>
      <Box width={BlockSize.Full}>
        <Button
          width={BlockSize.Full}
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          data-testid="reveal-recovery-phrase-continue"
          className="reveal-recovery-phrase__footer--button"
          onClick={() => onSubmit(password)}
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
}
