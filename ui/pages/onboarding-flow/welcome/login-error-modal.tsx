import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Text,
  ButtonSize,
  Button,
  ButtonVariant,
  Icon,
  IconSize,
  IconName,
  IconColor,
  TextAlign,
  TextVariant,
  TextButton,
  TextButtonSize,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../../components/component-library';
import { AlignItems } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SUPPORT_LINK } from '../../../helpers/constants/common';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getSocialLoginType } from '../../../selectors';
import { LOGIN_ERROR, LoginErrorType } from './types';

type LoginErrorModalProps = {
  onDone: () => void;
  loginError: LoginErrorType;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function LoginErrorModal({
  onDone,
  loginError,
}: LoginErrorModalProps) {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const socialLoginType = useSelector(getSocialLoginType);

  const getTitle = () => {
    if (loginError === LOGIN_ERROR.UNABLE_TO_CONNECT) {
      return t('loginErrorConnectTitle');
    }
    if (loginError === LOGIN_ERROR.SESSION_EXPIRED) {
      return t('loginErrorSessionExpiredTitle');
    }
    return t('loginErrorGenericTitle');
  };

  const getDescription = () => {
    if (loginError === LOGIN_ERROR.UNABLE_TO_CONNECT) {
      return t('loginErrorConnectDescription');
    }
    if (loginError === LOGIN_ERROR.SESSION_EXPIRED) {
      return t('loginErrorSessionExpiredDescription');
    }
    if (loginError === LOGIN_ERROR.RESET_WALLET && socialLoginType) {
      return t('loginErrorResetWalletDescription', [socialLoginType]);
    }

    return t('loginErrorGenericDescription', [
      <TextButton
        key="loginErrorGenericDescription"
        size={TextButtonSize.BodyMd}
        onClick={() => {
          trackEvent(
            {
              category: MetaMetricsEventCategory.Onboarding,
              event: MetaMetricsEventName.SupportLinkClicked,
              properties: {
                url: SUPPORT_LINK,
                location: 'Welcome page',
              },
            },
            {
              contextPropsIntoEventProperties: [
                MetaMetricsContextProp.PageTitle,
              ],
            },
          );
        }}
        asChild
        className="hover:bg-transparent active:bg-transparent w-fit"
      >
        <a href={SUPPORT_LINK} target="_blank" rel="noopener noreferrer">
          {t('loginErrorGenericSupport')}
        </a>
      </TextButton>,
    ]);
  };

  const getButtonText = () => {
    if (loginError === LOGIN_ERROR.UNABLE_TO_CONNECT) {
      return t('loginErrorConnectButton');
    }
    if (loginError === LOGIN_ERROR.SESSION_EXPIRED) {
      return t('loginErrorSessionExpiredButton');
    }
    return t('loginErrorGenericButton');
  };

  return (
    <Modal isOpen onClose={onDone} data-testid="login-error-modal">
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader onClose={onDone}>
          <Box className="text-center">
            <Icon
              name={IconName.Danger}
              size={IconSize.Xl}
              color={IconColor.WarningDefault}
            />
            <Text
              variant={TextVariant.HeadingMd}
              textAlign={TextAlign.Center}
              className="mt-4"
            >
              {getTitle()}
            </Text>
          </Box>
        </ModalHeader>
        <Box paddingLeft={4} paddingRight={4}>
          <Text variant={TextVariant.BodyMd}>{getDescription()}</Text>
          <Box marginTop={6}>
            <Button
              data-testid="login-error-modal-button"
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              onClick={onDone}
              className="w-full"
            >
              {getButtonText()}
            </Button>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}
