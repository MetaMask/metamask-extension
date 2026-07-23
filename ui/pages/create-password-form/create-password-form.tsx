import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Box,
  Text,
  TextVariant,
  TextColor,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  ButtonVariant,
  ButtonSize,
  Checkbox,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxBackgroundColor,
  IconColor,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import PasswordForm from '../../components/app/password-form/password-form';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { useBoolean } from '../../hooks/useBoolean';

type CreatePasswordFormProps = {
  isSocialLoginFlow: boolean;
  onSubmit: (password: string, termsChecked: boolean) => Promise<void>;
  onBack: (event: React.MouseEvent<HTMLButtonElement>) => void;
  loading?: boolean;
};

const CreatePasswordForm = ({
  isSocialLoginFlow,
  onSubmit,
  onBack,
  loading = false,
}: CreatePasswordFormProps) => {
  const t = useI18nContext();
  const [password, setPassword] = useState('');
  const {
    value: termsChecked,
    setValue: setTermsChecked,
    toggle,
  } = useBoolean();
  const hasUserInteractedWithTermsRef = useRef(false);
  const geolocation = useSelector(
    (state: { metamask: { location: string } }) => state.metamask?.location,
  );

  const { trackEvent, createEventBuilder } = useAnalytics();

  useEffect(() => {
    if (
      isSocialLoginFlow &&
      // For Social login users in US region, we set the marketing consent to true by default for the first time render
      geolocation === 'US' &&
      !hasUserInteractedWithTermsRef.current
    ) {
      setTermsChecked(true);
      hasUserInteractedWithTermsRef.current = true;
    }
  }, [setTermsChecked, isSocialLoginFlow, geolocation]);

  const handleCreatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(password, termsChecked);
  };

  const handleLearnMoreClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
  ): void => {
    event.stopPropagation();
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ExternalLinkClicked)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          text: 'Learn More',
          location: 'create_password',
          url: ZENDESK_URLS.PASSWORD_ARTICLE,
        })
        .build(),
    );
  };

  const createPasswordLink = (
    <a
      onClick={handleLearnMoreClick}
      key="create-password__link-text"
      href={ZENDESK_URLS.PASSWORD_ARTICLE}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="create-password__link-text">
        {t('learnMoreUpperCaseWithDot')}
      </span>
    </a>
  );

  const checkboxLabel = isSocialLoginFlow
    ? t('createPasswordMarketing')
    : t('passwordTermsWarning');

  return (
    <Box
      asChild
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      gap={4}
      className="create-password h-full w-full"
      data-testid="create-password"
    >
      <form onSubmit={handleCreatePassword}>
        <Box>
          <Box className="mb-4 w-full">
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              color={loading ? IconColor.IconMuted : IconColor.IconDefault}
              size={ButtonIconSize.Md}
              data-testid="create-password-back-button"
              type="button"
              onClick={onBack}
              ariaLabel={t('back')}
              disabled={loading}
            />
          </Box>
          <Box className="mb-4 w-full">
            <Text variant={TextVariant.HeadingLg}>{t('createPassword')}</Text>
            {isSocialLoginFlow ? (
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('createPasswordDetailsSocial', [
                  <Text
                    key="create-password-details-social-reset"
                    variant={TextVariant.BodyMd}
                    color={TextColor.WarningDefault}
                    asChild
                  >
                    <span>{t('createPasswordDetailsSocialReset')}</span>
                  </Text>,
                ])}
              </Text>
            ) : (
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('createPasswordDetails')}
              </Text>
            )}
          </Box>
          <PasswordForm
            onChange={(newPassword) => setPassword(newPassword)}
            disabled={loading}
          />
          <Box
            className="create-password__terms-container rounded-lg"
            marginTop={6}
            backgroundColor={BoxBackgroundColor.BackgroundMuted}
            padding={3}
          >
            <Checkbox
              id="create-password-terms"
              data-testid="create-password-terms"
              className="items-start"
              isSelected={termsChecked}
              isDisabled={loading}
              onChange={() => {
                hasUserInteractedWithTermsRef.current = true;
                toggle();
              }}
              label={
                <Text
                  asChild
                  variant={TextVariant.BodySm}
                  color={TextColor.TextDefault}
                >
                  <span>
                    {checkboxLabel}
                    {!isSocialLoginFlow && (
                      <>
                        <br />
                        {createPasswordLink}
                      </>
                    )}
                  </span>
                </Text>
              }
            />
          </Box>
        </Box>
        <Box>
          <Button
            type="submit"
            data-testid="create-password-submit"
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="create-password__form--submit-button w-full"
            disabled={
              !password || (!isSocialLoginFlow && !termsChecked) || loading
            }
            isLoading={loading}
          >
            {t('createPasswordCreate')}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CreatePasswordForm;
