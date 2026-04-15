import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
  TextVariant,
  TextColor,
  TextAlign,
  BoxFlexDirection,
  FontWeight,
  IconColor,
  TextButton,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../components/component-library';
import { getIsSocialLoginFlow } from '../../selectors';
import { resetWallet as resetWalletAction } from '../../store/actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { SUPPORT_LINK } from '../../helpers/constants/common';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { useBoolean } from '../../hooks/useBoolean';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function ResetPasswordModal({
  onClose,
  onRestore,
}: {
  onClose: () => void;
  onRestore: () => void;
}) {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const isSocialLoginEnabled = useSelector(getIsSocialLoginFlow);
  const { value: resetWallet, toggle: handleResetWallet } = useBoolean();
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const handleResetWalletConfirm = async () => {
    onClose();
    await dispatch(resetWalletAction());
    navigate(DEFAULT_ROUTE, { replace: true });
  };

  const handleContactSupportTrackEvent = () => {
    trackEvent(
      {
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.SupportLinkClicked,
        properties: {
          url: SUPPORT_LINK,
        },
      },
      {
        contextPropsIntoEventProperties: [MetaMetricsContextProp.PageTitle],
      },
    );
  };

  const socialLoginContent = () => {
    return (
      <Box paddingHorizontal={4}>
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          className="mb-4"
        >
          {t('forgotPasswordSocialDescription', [
            <TextButton
              key="need-help-link"
              onClick={handleContactSupportTrackEvent}
              asChild
            >
              <a
                href={SUPPORT_LINK}
                type="button"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('forgotPasswordModalContactSupportLink')}
              </a>
            </TextButton>,
          ])}
        </Text>
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={4}
          marginBottom={6}
          asChild
        >
          <ul>
            <Box asChild>
              <li className="flex gap-4 items-center">
                <Icon
                  name={IconName.FaceId}
                  size={IconSize.Md}
                  color={IconColor.IconAlternative}
                  className="mt-2"
                />
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                >
                  {t('forgotPasswordSocialStep1', [
                    <Text
                      variant={TextVariant.BodyMd}
                      key="reset-password-step-1-biometrics"
                      color={TextColor.TextAlternative}
                    >
                      {t('forgotPasswordSocialStep1Biometrics')}
                    </Text>,
                  ])}
                </Text>
              </li>
            </Box>
            <Box asChild>
              <li className="flex gap-4 items-center">
                <Icon
                  name={IconName.SecurityKey}
                  size={IconSize.Md}
                  color={IconColor.IconAlternative}
                  className="mt-2"
                />
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                >
                  {t('forgotPasswordSocialStep2', [
                    <Text
                      variant={TextVariant.BodyMd}
                      key="reset-password-step-2-srp"
                      color={TextColor.TextAlternative}
                    >
                      {t('secretRecoveryPhrase')}
                    </Text>,
                  ])}
                </Text>
              </li>
            </Box>
          </ul>
        </Box>
        <Box flexDirection={BoxFlexDirection.Column} gap={3}>
          <Button
            data-testid="reset-password-modal-button"
            variant={ButtonVariant.Primary}
            onClick={onRestore}
            size={ButtonSize.Lg}
            className="w-full"
          >
            {t('forgotPasswordModalButton')}
          </Button>
          <Button
            data-testid="reset-password-modal-button-link"
            variant={ButtonVariant.Secondary}
            onClick={handleResetWallet}
            size={ButtonSize.Lg}
            className="w-full"
          >
            {t('forgotPasswordModalButtonLink')}
          </Button>
        </Box>
      </Box>
    );
  };

  const srpLoginContent = () => {
    return (
      <Box paddingHorizontal={4}>
        <Text
          variant={TextVariant.BodyMd}
          className="mb-4"
          color={TextColor.TextAlternative}
        >
          {t('forgotPasswordModalDescription1')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          className="mb-4"
          color={TextColor.TextAlternative}
        >
          {t('forgotPasswordModalDescription2')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          className="mb-6"
          color={TextColor.TextAlternative}
        >
          {t('forgotPasswordModalContactSupport', [
            <TextButton
              key="need-help-link"
              onClick={handleContactSupportTrackEvent}
              asChild
            >
              <a
                href={SUPPORT_LINK}
                type="button"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('forgotPasswordModalContactSupportLink')}
              </a>
            </TextButton>,
          ])}
        </Text>
        <Box flexDirection={BoxFlexDirection.Column} gap={3}>
          <Button
            data-testid="reset-password-modal-button"
            variant={ButtonVariant.Primary}
            onClick={onRestore}
            size={ButtonSize.Lg}
            className="w-full"
          >
            {t('forgotPasswordModalButton')}
          </Button>
          <Button
            data-testid="reset-password-modal-button-link"
            variant={ButtonVariant.Secondary}
            onClick={handleResetWallet}
            size={ButtonSize.Lg}
            className="w-full"
          >
            {t('forgotPasswordModalButtonLink')}
          </Button>
        </Box>
      </Box>
    );
  };

  const resetWalletContent = () => {
    return (
      <Box paddingHorizontal={4}>
        <Text
          variant={TextVariant.BodyMd}
          className="mb-6"
          color={TextColor.TextAlternative}
        >
          {t('resetWalletDescriptionOne')}
        </Text>
        <Text
          variant={TextVariant.BodyMd}
          className="mb-6"
          color={TextColor.TextAlternative}
        >
          {t('resetWalletDescriptionTwo', [
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Bold}
              key="reset-wallet-bold-text-one"
              color={TextColor.TextAlternative}
              asChild
            >
              <span>{t('resetWalletBoldTextOne')}</span>
            </Text>,
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Bold}
              key="reset-wallet-bold-text-two"
              color={TextColor.TextAlternative}
              asChild
            >
              <span>{t('resetWalletBoldTextTwo')}</span>
            </Text>,
          ])}
        </Text>
        <Box flexDirection={BoxFlexDirection.Column} gap={4}>
          <Button
            data-testid="reset-password-modal-button"
            variant={ButtonVariant.Primary}
            onClick={handleResetWalletConfirm}
            size={ButtonSize.Lg}
            isDanger
            className="w-full"
          >
            {t('resetWalletButton')}
          </Button>
        </Box>
      </Box>
    );
  };

  const restoreContent = () =>
    isSocialLoginEnabled ? socialLoginContent() : srpLoginContent();

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="reset-password-modal"
      data-testid="reset-password-modal"
    >
      <ModalOverlay />
      <ModalContent style={{ alignItems: 'center' }}>
        <ModalHeader
          onClose={onClose}
          onBack={handleResetWallet}
          childrenWrapperProps={{
            className: 'flex flex-col items-center justify-center gap-4',
          }}
          backButtonProps={{
            style: {
              display: resetWallet ? 'block' : 'none',
            },
          }}
        >
          {resetWallet && (
            <Icon
              name={IconName.Danger}
              size={IconSize.Xl}
              color={IconColor.ErrorDefault}
              className="mx-auto"
            />
          )}
          <Text
            variant={TextVariant.HeadingSm}
            className="mb-4 mx-auto"
            color={TextColor.TextDefault}
            textAlign={TextAlign.Center}
          >
            {t(resetWallet ? 'resetWalletTitle' : 'forgotPasswordModalTitle')}
          </Text>
        </ModalHeader>
        {resetWallet ? resetWalletContent() : restoreContent()}
      </ModalContent>
    </Modal>
  );
}
