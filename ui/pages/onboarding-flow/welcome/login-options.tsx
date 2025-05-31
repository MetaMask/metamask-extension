import React, { useCallback } from 'react';
import {
  Box,
  BoxProps,
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  PolymorphicRef,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FontWeight,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { LOGIN_TYPE, LoginType, LoginOptionType, LOGIN_OPTION } from './types';

export const SocialButton = React.forwardRef(
  (
    {
      icon,
      label,
      ...props
    }: { icon: React.ReactNode; label: string } & BoxProps<'button'>,
    ref?: PolymorphicRef<'button'>,
  ) => {
    return (
      <Text
        ref={ref}
        as="button"
        className="options-modal__plain-button"
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        width={BlockSize.Full}
        borderRadius={BorderRadius.XL}
        borderColor={BorderColor.borderMuted}
        backgroundColor={BackgroundColor.transparent}
        gap={2}
        {...props}
      >
        {icon}
        <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
          {label}
        </Text>
      </Text>
    );
  },
);

export default function LoginOptions({
  onClose,
  loginOption,
  handleLogin,
}: {
  onClose: () => void;
  loginOption: LoginOptionType;
  handleLogin: (loginType: LoginType) => void;
}) {
  const t = useI18nContext();

  const onLogin = useCallback(
    (loginType: LoginType) => {
      handleLogin(loginType);
    },
    [handleLogin],
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="options-modal"
      isClosedOnOutsideClick={false}
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm} alignItems={AlignItems.center}>
        <ModalHeader onClose={onClose}>
          <Text textAlign={TextAlign.Center} variant={TextVariant.headingMd}>
            {t('onboardingOptionTitle')}
          </Text>
        </ModalHeader>
        <Box paddingInline={4}>
          {/*
          SOCIAL: Add when social login is available
          <SocialButton
            icon={
              <img
                src="images/icons/google.svg"
                className="options-modal__social-icon"
                alt={t('onboardingOptionIcon', ['Google'])}
              />
            }
            label={
              loginOption === LOGIN_OPTION.EXISTING
                ? t('onboardingSignInWith', ['Google'])
                : t('onboardingContinueWith', ['Google'])
            }
            marginBottom={4}
            onClick={() => onLogin(LOGIN_TYPE.GOOGLE)}
          />
          <SocialButton
            icon={
              <Icon
                name={IconName.Apple}
                color={IconColor.iconDefault}
                size={IconSize.Lg}
              />
            }
            label={
              loginOption === LOGIN_OPTION.EXISTING
                ? t('onboardingSignInWith', ['Apple'])
                : t('onboardingContinueWith', ['Apple'])
            }
            marginBottom={2}
            onClick={() => onLogin(LOGIN_TYPE.APPLE)}
          />
          <Box
            alignItems={AlignItems.center}
            marginBottom={4}
            className="options-modal__or"
          >
            <Text
              width={BlockSize.Min}
              variant={TextVariant.bodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.textMuted}
              backgroundColor={BackgroundColor.backgroundDefault}
              paddingInline={2}
              marginInline="auto"
              textTransform={TextTransform.Uppercase}
              as="div"
              style={{
                position: 'relative',
                zIndex: 1,
              }}
            >
              {t('or')}
            </Text>
          </Box>
          */}
          <Button
            data-testid={
              loginOption === LOGIN_OPTION.EXISTING
                ? 'onboarding-import-with-srp-button'
                : 'onboarding-create-with-srp-button'
            }
            variant={ButtonVariant.Secondary}
            width={BlockSize.Full}
            size={ButtonSize.Lg}
            onClick={() => onLogin(LOGIN_TYPE.SRP)}
          >
            {loginOption === LOGIN_OPTION.EXISTING
              ? t('onboardingSrpImport')
              : t('onboardingSrpCreate')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}
