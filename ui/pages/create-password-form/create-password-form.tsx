import React, { useState, useContext } from 'react';
import {
  IconColor,
  JustifyContent,
  AlignItems,
  TextVariant,
  TextColor,
  BlockSize,
  FlexDirection,
  Display,
  BackgroundColor,
  BorderRadius,
} from '../../helpers/constants/design-system';
import {
  Button,
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  ButtonVariant,
  ButtonSize,
  Text,
  Checkbox,
} from '../../components/component-library';
import PasswordForm from '../../components/app/password-form/password-form';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';

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
  const [termsChecked, setTermsChecked] = useState(false);

  const trackEvent = useContext(MetaMetricsContext);

  const handleCreatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(password, termsChecked);
  };

  const handleLearnMoreClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.ExternalLinkClicked,
      properties: {
        text: 'Learn More',
        location: 'create_password',
        url: ZENDESK_URLS.PASSWORD_ARTICLE,
      },
    });
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
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
      width={BlockSize.Full}
      gap={4}
      as="form"
      className="create-password"
      data-testid="create-password"
      onSubmit={handleCreatePassword}
    >
      <Box>
        <Box
          justifyContent={JustifyContent.flexStart}
          marginBottom={4}
          width={BlockSize.Full}
        >
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            color={loading ? IconColor.iconMuted : IconColor.iconDefault}
            size={ButtonIconSize.Md}
            data-testid="create-password-back-button"
            type="button"
            onClick={onBack}
            ariaLabel={t('back')}
            disabled={loading}
          />
        </Box>
        <Box
          justifyContent={JustifyContent.flexStart}
          marginBottom={4}
          width={BlockSize.Full}
        >
          <Text variant={TextVariant.headingLg} as="h2">
            {t('createPassword')}
          </Text>
          {isSocialLoginFlow ? (
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              as="h2"
            >
              {t('createPasswordDetailsSocial')}
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.warningDefault}
                as="span"
              >
                {t('createPasswordDetailsSocialReset')}
              </Text>
            </Text>
          ) : (
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              as="h2"
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
          className="create-password__terms-container"
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={6}
          backgroundColor={BackgroundColor.backgroundMuted}
          padding={3}
          borderRadius={BorderRadius.LG}
        >
          <Checkbox
            inputProps={{ 'data-testid': 'create-password-terms' }}
            alignItems={AlignItems.flexStart}
            isChecked={termsChecked}
            isDisabled={loading}
            onChange={() => {
              setTermsChecked(!termsChecked);
            }}
            label={
              <Text variant={TextVariant.bodySm} color={TextColor.textDefault}>
                {checkboxLabel}
                {!isSocialLoginFlow && (
                  <>
                    <br />
                    {createPasswordLink}
                  </>
                )}
              </Text>
            }
          />
        </Box>
      </Box>
      <Box>
        <Button
          data-testid="create-password-submit"
          variant={ButtonVariant.Primary}
          width={BlockSize.Full}
          size={ButtonSize.Lg}
          className="create-password__form--submit-button"
          disabled={
            !password || (!isSocialLoginFlow && !termsChecked) || loading
          }
          loading={loading}
        >
          {t('createPasswordCreate')}
        </Button>
      </Box>
    </Box>
  );
};

export default CreatePasswordForm;
