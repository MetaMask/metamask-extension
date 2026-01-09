import React, { useState } from 'react';
import {
  Text,
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
  IconName,
  Icon,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
  IconColor,
  BlockSize,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useModalProps } from '../../../../hooks/useModalProps';
import {
  RetryStrategy,
  type HardwareWalletError,
} from '../../../../contexts/hardware-wallets/errors';
import {
  useHardwareWalletActions,
  useHardwareWalletConfig,
} from '../../../../contexts/hardware-wallets';
import { buildErrorContent } from './error-content-builder';

type HardwareWalletErrorModalProps = {
  isOpen?: boolean;
  error?: HardwareWalletError;
  onCancel?: () => void;
  onClose?: () => void;
  onRetry?: () => void;
};

/**
 * Modal component to display hardware wallet errors with recovery instructions
 *
 * @param props - The component props
 */
export const HardwareWalletErrorModal: React.FC<HardwareWalletErrorModalProps> =
  React.memo((props) => {
    const t = useI18nContext();
    const { hideModal, props: modalProps } = useModalProps();
    const [isLoading, setIsLoading] = useState(false);
    const [recovered, setRecovered] = useState(false);
    const { error, onCancel, onClose } = { ...modalProps, ...props };

    const { deviceId, detectedWalletType, walletType } =
      useHardwareWalletConfig();
    const { ensureDeviceReady, clearError } = useHardwareWalletActions();

    // Use walletType if available (during connection), otherwise detectedWalletType
    const displayWalletType = walletType || detectedWalletType;

    // If no error, don't render anything
    if (!error) {
      onClose?.();
      return null;
    }

    if (!displayWalletType) {
      onClose?.();
      return null;
    }

    const canRetry =
      error.retryStrategy === RetryStrategy.RETRY && error.userActionable;

    const { icon, title, recoveryInstructions } = buildErrorContent(
      error,
      displayWalletType,
      t as (key: string, ...args: unknown[]) => string,
    );

    const handleRetry = async () => {
      setIsLoading(true);
      const result = await ensureDeviceReady(deviceId ?? '');
      if (result) {
        setRecovered(true);
        clearError();
      }
      setIsLoading(false);
    };

    const handleCancel = () => {
      onCancel?.();
      hideModal();
    };

    const handleClose = () => {
      clearError();
      hideModal();
    };

    if (recovered) {
      return (
        <Modal
          isOpen={true}
          onClose={handleClose}
          isClosedOnOutsideClick={false}
          isClosedOnEscapeKey
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader onClose={handleClose}>
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.center}
              >
                <Icon
                  name={IconName.Confirmation}
                  color={IconColor.successDefault}
                  size={IconSize.Xl}
                />
              </Box>
            </ModalHeader>
            <ModalBody>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                alignItems={AlignItems.center}
                gap={4}
              >
                <Text
                  variant={TextVariant.headingSm}
                  textAlign={TextAlign.Center}
                  color={TextColor.textAlternative}
                >
                  {t('hardwareWalletTypeConnected', [t(displayWalletType)])}
                </Text>
              </Box>
            </ModalBody>
          </ModalContent>
        </Modal>
      );
    }

    return (
      <Modal
        isOpen={true}
        onClose={handleClose}
        isClosedOnOutsideClick={false}
        isClosedOnEscapeKey
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader onClose={handleClose}>
            <Box
              display={Display.Flex}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
            >
              <Icon
                name={icon}
                color={IconColor.errorDefault}
                size={IconSize.Xl}
              />
            </Box>
          </ModalHeader>

          <ModalBody>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              alignItems={AlignItems.center}
              gap={4}
            >
              <Text
                variant={TextVariant.bodyMdMedium}
                textAlign={TextAlign.Center}
                color={TextColor.textAlternative}
              >
                {title}
              </Text>

              {/* Error Message */}
              <Box width={BlockSize.Full} padding={3}>
                <Text
                  variant={TextVariant.bodyMd}
                  textAlign={TextAlign.Center}
                  color={TextColor.errorDefault}
                >
                  {error.userMessage || error.message}
                </Text>
              </Box>

              {/* Recovery Instructions */}
              {recoveryInstructions.length > 0 && (
                <Box
                  width={BlockSize.Full}
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                  gap={2}
                >
                  <Text
                    variant={TextVariant.bodyMdMedium}
                    color={TextColor.textDefault}
                  >
                    {t('hardwareWalletErrorRecoveryTitle')}
                  </Text>
                  {recoveryInstructions.map((instruction, index) => (
                    <Box
                      key={index}
                      display={Display.Flex}
                      flexDirection={FlexDirection.Row}
                      gap={2}
                      alignItems={AlignItems.flexStart}
                    >
                      <Text
                        variant={TextVariant.bodyMd}
                        color={TextColor.textDefault}
                      >
                        {`${index + 1}.`}
                      </Text>
                      <Text
                        variant={TextVariant.bodyMd}
                        color={TextColor.textDefault}
                      >
                        {instruction}
                      </Text>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </ModalBody>

          <ModalFooter>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              gap={2}
              width={BlockSize.Full}
            >
              {canRetry ? (
                <>
                  <Button
                    variant={ButtonVariant.Primary}
                    size={ButtonSize.Lg}
                    block
                    onClick={handleRetry}
                  >
                    {isLoading ? (
                      <Icon
                        name={IconName.Loading}
                        style={{ animation: 'spin 1.2s linear infinite' }}
                      />
                    ) : (
                      t('hardwareWalletErrorContinueButton')
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant={ButtonVariant.Primary}
                  size={ButtonSize.Lg}
                  block
                  onClick={handleCancel}
                >
                  {t('close')}
                </Button>
              )}
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  });
