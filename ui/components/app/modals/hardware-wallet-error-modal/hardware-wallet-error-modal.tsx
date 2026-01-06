import React, { useEffect, useState } from 'react';
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
import { HardwareWalletType } from '../../../../contexts/hardware-wallets/types';
import { buildErrorContent } from './error-content-builder';
import {
  useHardwareWalletActions,
  useHardwareWalletConfig,
} from '../../../../contexts/hardware-wallets';
import Spinner from '../../../ui/spinner';

type HardwareWalletErrorModalProps = {
  isOpen?: boolean;
  error?: HardwareWalletError;
  walletType?: HardwareWalletType;
  onRetry?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
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
    // Use props from either direct props or modal state
    const { error, walletType, onRetry, onCancel, onClose } = {
      ...props,
      ...modalProps,
    };
    const { deviceId } = useHardwareWalletConfig();
    const { ensureDeviceReady } = useHardwareWalletActions();

    // If no error, don't render anything
    if (!error || !walletType) {
      return null;
    }

    const canRetry =
      error.retryStrategy === RetryStrategy.RETRY &&
      error.userActionable &&
      onRetry;

    const { icon, title, description, recoveryInstructions } =
      buildErrorContent(
        error,
        walletType,
        t as (key: string, ...args: unknown[]) => string,
      );

    const handleRetry = async () => {
      setIsLoading(true);
      await ensureDeviceReady(deviceId ?? '');
      onRetry?.();
      setIsLoading(false);
    };

    const handleCancel = () => {
      onCancel?.();
      hideModal();
    };

    const handleClose = () => {
      onClose?.();
      hideModal();
    };

    useEffect(() => {}, [hideModal]);

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
                      <Spinner />
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
