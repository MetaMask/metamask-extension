import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
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

  const isSocialLoginEnabled = useSelector(getIsSocialLoginFlow);
  const [resetWallet, setResetWallet] = useState(false);
  const history = useHistory();

  const dispatch = useDispatch();

  const handleResetWallet = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setResetWallet((prev) => !prev);
  };

  const handleResetWalletConfirm = async () => {
    onClose();
    await dispatch(resetWalletAction());
    history.push(DEFAULT_ROUTE);
  };

  const socialLoginContent = () => {
    return (
      <Box paddingInline={4}>
        <Text variant={TextVariant.bodyMd} marginBottom={4}>
          {t('forgotPasswordSocialDescription')}
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
              color={IconColor.iconMuted}
              style={{
                marginTop: '2px',
              }}
            />
            <Text variant={TextVariant.bodyMd}>
              {t('forgotPasswordSocialStep1', [
                <Text
                  variant={TextVariant.inherit}
                  fontWeight={FontWeight.Bold}
                  key="reset-password-step-1-biometrics"
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
              color={IconColor.iconMuted}
              style={{
                marginTop: '2px',
              }}
            />
            <Text variant={TextVariant.bodyMd}>
              {t('forgotPasswordSocialStep2', [
                <Text
                  variant={TextVariant.inherit}
                  fontWeight={FontWeight.Bold}
                  key="reset-password-step-2-srp"
                >
                  {t('secretRecoveryPhrase')}
                </Text>,
              ])}
            </Text>
          </Box>
        </Box>
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
          variant={ButtonVariant.Link}
          onClick={handleResetWallet}
          size={ButtonSize.Lg}
          block
          color={TextColor.primaryDefault}
          role="button"
        >
          {t('forgotPasswordModalButtonLink')}
        </Button>
      </Box>
    );
  };

  const srpLoginContent = () => {
    return (
      <Box paddingInline={4}>
        <Text variant={TextVariant.bodyMd} marginBottom={4}>
          {t('forgotPasswordModalDescription1')}
        </Text>
        <Text variant={TextVariant.bodyMd} marginBottom={6}>
          {t('forgotPasswordModalDescription2')}
        </Text>
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
          variant={ButtonVariant.Link}
          onClick={handleResetWallet}
          size={ButtonSize.Lg}
          block
          color={TextColor.primaryDefault}
          role="button"
        >
          {t('forgotPasswordModalButtonLink')}
        </Button>
      </Box>
    );
  };

  const resetWalletContent = () => {
    return (
      <Box paddingInline={4}>
        <Text
          variant={TextVariant.bodyMd}
          marginBottom={4}
          color={TextColor.textDefault}
        >
          {t('resetWalletDescriptionOne')}
        </Text>
        <Text
          variant={TextVariant.bodyMd}
          marginBottom={4}
          color={TextColor.textDefault}
        >
          {t('resetWalletDescriptionTwo', [
            <Text
              variant={TextVariant.inherit}
              fontWeight={FontWeight.Bold}
              key="reset-wallet-bold-text-one"
            >
              {t('resetWalletBoldTextOne')}
            </Text>,
            <Text
              variant={TextVariant.inherit}
              fontWeight={FontWeight.Bold}
              key="reset-wallet-bold-text-two"
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
          <Button
            data-testid="reset-password-modal-button-link"
            variant={ButtonVariant.Secondary}
            onClick={handleResetWallet}
            size={ButtonSize.Lg}
            block
          >
            {t('resetWalletButtonCancel')}
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
          childrenWrapperProps={{
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.center,
            justifyContent: JustifyContent.center,
            gap: 4,
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
