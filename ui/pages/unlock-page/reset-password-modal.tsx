import React, { useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  IconColor,
  TextVariant,
  TextColor,
  TextAlign,
  JustifyContent,
} from '../../helpers/constants/design-system';
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
  const trackEvent = useContext(MetaMetricsContext);
  const isSocialLoginEnabled = useSelector(getIsSocialLoginFlow);
  const [resetWallet, setResetWallet] = useState(false);
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const handleResetWallet = () => {
    setResetWallet((prev) => !prev);
  };

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
      <Box paddingInline={4}>
        <Text
          variant={TextVariant.bodyMd}
          marginBottom={4}
          color={TextColor.textAlternative}
        >
          {t('forgotPasswordSocialDescription', [
            <Button
              variant={ButtonVariant.Link}
              color={TextColor.primaryDefault}
              href={SUPPORT_LINK}
              type="button"
              target="_blank"
              rel="noopener noreferrer"
              key="need-help-link"
              onClick={handleContactSupportTrackEvent}
            >
              {t('forgotPasswordModalContactSupportLink')}
            </Button>,
          ])}
        </Text>
        <Box
          as="ul"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
          marginBottom={6}
        >
          <Box display={Display.Flex} gap={4} as="li">
            <Icon
              name={IconName.FaceId}
              size={IconSize.Md}
              color={IconColor.iconAlternative}
              style={{
                marginTop: '2px',
              }}
            />
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
            >
              {t('forgotPasswordSocialStep1', [
                <Text
                  variant={TextVariant.inherit}
                  key="reset-password-step-1-biometrics"
                  color={TextColor.textAlternative}
                >
                  {t('forgotPasswordSocialStep1Biometrics')}
                </Text>,
              ])}
            </Text>
          </Box>
          <Box display={Display.Flex} gap={4} as="li">
            <Icon
              name={IconName.SecurityKey}
              size={IconSize.Md}
              color={IconColor.iconAlternative}
              style={{
                marginTop: '2px',
              }}
            />
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
            >
              {t('forgotPasswordSocialStep2', [
                <Text
                  variant={TextVariant.inherit}
                  key="reset-password-step-2-srp"
                  color={TextColor.textAlternative}
                >
                  {t('secretRecoveryPhrase')}
                </Text>,
              ])}
            </Text>
          </Box>
        </Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={3}
        >
          <Button
            data-testid="reset-password-modal-button"
            variant={ButtonVariant.Primary}
            onClick={onRestore}
            size={ButtonSize.Lg}
            block
          >
            {t('forgotPasswordModalButton')}
          </Button>
          <Button
            data-testid="reset-password-modal-button-link"
            variant={ButtonVariant.Secondary}
            onClick={handleResetWallet}
            size={ButtonSize.Lg}
            block
          >
            {t('forgotPasswordModalButtonLink')}
          </Button>
        </Box>
      </Box>
    );
  };

  const srpLoginContent = () => {
    return (
      <Box paddingInline={4}>
        <Text
          variant={TextVariant.bodyMd}
          marginBottom={4}
          color={TextColor.textAlternative}
        >
          {t('forgotPasswordModalDescription1')}
        </Text>
        <Text
          variant={TextVariant.bodyMd}
          marginBottom={4}
          color={TextColor.textAlternative}
        >
          {t('forgotPasswordModalDescription2')}
        </Text>
        <Text
          variant={TextVariant.bodyMd}
          marginBottom={6}
          color={TextColor.textAlternative}
        >
          {t('forgotPasswordModalContactSupport', [
            <Button
              variant={ButtonVariant.Link}
              color={TextColor.primaryDefault}
              href={SUPPORT_LINK}
              type="button"
              target="_blank"
              rel="noopener noreferrer"
              key="need-help-link"
              onClick={handleContactSupportTrackEvent}
            >
              {t('forgotPasswordModalContactSupportLink')}
            </Button>,
          ])}
        </Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={3}
        >
          <Button
            data-testid="reset-password-modal-button"
            variant={ButtonVariant.Primary}
            onClick={onRestore}
            size={ButtonSize.Lg}
            block
          >
            {t('forgotPasswordModalButton')}
          </Button>
          <Button
            data-testid="reset-password-modal-button-link"
            variant={ButtonVariant.Secondary}
            onClick={handleResetWallet}
            size={ButtonSize.Lg}
            block
          >
            {t('forgotPasswordModalButtonLink')}
          </Button>
        </Box>
      </Box>
    );
  };

  const resetWalletContent = () => {
    return (
      <Box paddingInline={4}>
        <Text
          variant={TextVariant.bodyMd}
          marginBottom={6}
          color={TextColor.textAlternative}
        >
          {t('resetWalletDescriptionOne')}
        </Text>
        <Text
          variant={TextVariant.bodyMd}
          marginBottom={6}
          color={TextColor.textAlternative}
        >
          {t('resetWalletDescriptionTwo', [
            <Text
              variant={TextVariant.inherit}
              fontWeight={FontWeight.Bold}
              key="reset-wallet-bold-text-one"
              color={TextColor.textAlternative}
            >
              {t('resetWalletBoldTextOne')}
            </Text>,
            <Text
              variant={TextVariant.inherit}
              fontWeight={FontWeight.Bold}
              key="reset-wallet-bold-text-two"
              color={TextColor.textAlternative}
            >
              {t('resetWalletBoldTextTwo')}
            </Text>,
          ])}
        </Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
        >
          <Button
            data-testid="reset-password-modal-button"
            variant={ButtonVariant.Primary}
            onClick={handleResetWalletConfirm}
            size={ButtonSize.Lg}
            block
            danger
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
      <ModalContent alignItems={AlignItems.center}>
        <ModalHeader
          onClose={onClose}
          onBack={handleResetWallet}
          childrenWrapperProps={{
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.center,
            justifyContent: JustifyContent.center,
            gap: 4,
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
              color={IconColor.errorDefault}
              style={{
                margin: '0 auto',
              }}
            />
          )}
          <Text
            variant={TextVariant.headingSm}
            marginBottom={4}
            color={TextColor.textDefault}
            marginInline={'auto'}
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
