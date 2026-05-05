import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { useNavigate } from 'react-router-dom';
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
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { resetWallet } from '../../../store/actions';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { LOGIN_ERROR, LoginErrorType } from './types';

type LoginErrorModalProps = {
  onClose: () => void;
  loginError: LoginErrorType;
};

/**
 * Modal component to display seedless onboarding nonrecoverable error messages.
 * Upon acknowledgement, the modal is closed and the wallet is in reset wallet flow.
 * User will be redirected to the onboarding welcome page and restart the onboarding flow.
 * So that the user can re-login with the same social login method and access the same account.
 *
 * @param props - The component props
 * @param props.onClose - The function to call when the modal is closed
 * @param props.loginError - The type of login error that occurred
 */

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function LoginErrorModal({
  onClose,
  loginError,
}: LoginErrorModalProps) {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const socialLoginType = useSelector(getSocialLoginType);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  const handleConfirm = async () => {
    onClose();

    const isPopupOrSidePanel =
      getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ||
      getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;
    await dispatch(resetWallet());

    if (isPopupOrSidePanel) {
      global.platform.openExtensionInBrowser?.(DEFAULT_ROUTE);
    } else {
      navigate(DEFAULT_ROUTE, { replace: true });
    }
  };

  return (
    <Modal isOpen onClose={onClose} data-testid="login-error-modal">
      <ModalOverlay />
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader onClose={onClose}>
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
              onClick={handleConfirm}
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
