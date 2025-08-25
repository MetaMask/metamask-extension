import React, { useContext } from 'react';
import {
  AlignItems,
  IconColor,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Box,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  ButtonSize,
  Button,
  ButtonVariant,
  Icon,
  IconSize,
  IconName,
  ButtonLinkSize,
  ButtonLink,
} from '../../../components/component-library';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SUPPORT_LINK } from '../../../helpers/constants/common';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { LOGIN_ERROR, LoginErrorType } from './types';

type LoginErrorModalProps = {
  onClose: () => void;
  loginError: LoginErrorType;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function LoginErrorModal({
  onClose,
  loginError,
}: LoginErrorModalProps) {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);

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
    return t('loginErrorGenericDescription', [
      <ButtonLink
        key="loginErrorGenericDescription"
        size={ButtonLinkSize.Inherit}
        externalLink
        href={SUPPORT_LINK}
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
      >
        {t('loginErrorGenericSupport')}
      </ButtonLink>,
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
    <Modal isOpen onClose={onClose} data-testid="login-error-modal">
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader onClose={onClose}>
          <Box textAlign={TextAlign.Center}>
            <Icon
              name={IconName.Danger}
              size={IconSize.Xl}
              color={IconColor.warningDefault}
            />
            <Text
              variant={TextVariant.headingMd}
              textAlign={TextAlign.Center}
              marginTop={4}
            >
              {getTitle()}
            </Text>
          </Box>
        </ModalHeader>
        <Box paddingLeft={4} paddingRight={4}>
          <Text variant={TextVariant.bodyMd}>{getDescription()}</Text>
          <Box marginTop={6}>
            <Button
              data-testid="login-error-modal-button"
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              onClick={onClose}
              block
            >
              {getButtonText()}
            </Button>
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}
