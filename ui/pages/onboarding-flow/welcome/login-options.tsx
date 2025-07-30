import React from 'react';
import {
  Box,
  BoxProps,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
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
  IconColor,
  JustifyContent,
  TextColor,
  TextTransform,
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
          {t('onboardingOptionTitle')}
        </ModalHeader>
        <Box paddingInline={4}>
          <SocialButton
            data-testid={
              loginOption === LOGIN_OPTION.EXISTING
                ? 'onboarding-import-with-google-button'
                : 'onboarding-create-with-google-button'
            }
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
            onClick={() => handleLogin(LOGIN_TYPE.GOOGLE)}
          />
          <SocialButton
            data-testid={
              loginOption === LOGIN_OPTION.EXISTING
                ? 'onboarding-import-with-apple-button'
                : 'onboarding-create-with-apple-button'
            }
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
            onClick={() => handleLogin(LOGIN_TYPE.APPLE)}
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
          <Button
            data-testid={
              loginOption === LOGIN_OPTION.EXISTING
                ? 'onboarding-import-with-srp-button'
                : 'onboarding-create-with-srp-button'
            }
            variant={ButtonVariant.Secondary}
            width={BlockSize.Full}
            size={ButtonSize.Lg}
            onClick={() => handleLogin(LOGIN_TYPE.SRP)}
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
