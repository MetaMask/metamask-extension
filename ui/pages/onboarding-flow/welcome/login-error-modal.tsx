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
import { isPopupOrSidePanelEnvironment } from '../../../../shared/lib/environment-type';
import { resetWallet } from '../../../store/actions';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { LOGIN_ERROR, LoginErrorType } from './types';

const TELEGRAM_DESKTOP_UPDATE_URL = 'https://desktop.telegram.org/';

type LoginErrorModalProps = {
  onClose: () => void;
  loginError: LoginErrorType;
};

/**
 * Modal component to display social login error messages.
 * Upon acknowledgement, the modal is closed and the wallet is reset for the un-recoverable errors.
 * User will be redirected to the onboarding start page and restart the onboarding flow.
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

  const isTelegramOutdated = loginError === LOGIN_ERROR.TELEGRAM_OUTDATED;

  const getTitle = () => {
    if (loginError === LOGIN_ERROR.UNABLE_TO_CONNECT) {
      return t('loginErrorConnectTitle');
    }
    if (loginError === LOGIN_ERROR.SESSION_EXPIRED) {
      return t('loginErrorSessionExpiredTitle');
    }
    if (isTelegramOutdated) {
      return t('loginErrorTelegramOutdatedTitle');
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
    if (isTelegramOutdated) {
      return t('loginErrorTelegramOutdatedDescription');
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

    // reset wallet for the un-recoverable errors
    if (loginError === LOGIN_ERROR.RESET_WALLET) {
      const isPopupOrSidePanel = isPopupOrSidePanelEnvironment();
      await dispatch(resetWallet());

      if (isPopupOrSidePanel) {
        globalThis.platform.openExtensionInBrowser?.(DEFAULT_ROUTE);
      } else {
        navigate(DEFAULT_ROUTE, { replace: true });
      }
    }
  };

  const handleUpdateTelegramClick = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.SupportLinkClicked,
      properties: {
        url: TELEGRAM_DESKTOP_UPDATE_URL,
        location: 'Telegram outdated modal',
      },
    });
    globalThis.platform.openTab({ url: TELEGRAM_DESKTOP_UPDATE_URL });
    onClose();
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
            {isTelegramOutdated ? (
              <Button
                data-testid="login-error-modal-update-telegram-button"
                variant={ButtonVariant.Primary}
                size={ButtonSize.Lg}
                onClick={handleUpdateTelegramClick}
                className="w-full"
              >
                {t('loginErrorTelegramOutdatedButton')}
              </Button>
            ) : (
              <Button
                data-testid="login-error-modal-button"
                variant={ButtonVariant.Primary}
                size={ButtonSize.Lg}
                onClick={handleConfirm}
                className="w-full"
              >
                {getButtonText()}
              </Button>
            )}
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
}
