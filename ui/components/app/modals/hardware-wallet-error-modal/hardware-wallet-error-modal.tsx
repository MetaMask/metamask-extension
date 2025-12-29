import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Text,
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
  Icon,
  IconSize,
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
import { useHardwareWallet } from '../../../../contexts/hardware-wallets';
import { buildErrorContent } from './error-content-builder';

type HardwareWalletErrorModalProps = {
  error: HardwareWalletError;
  walletType: HardwareWalletType;
  onRetry?: () => void;
  onCancel?: () => void;
};

/**
 * Modal component to display hardware wallet errors with recovery instructions
 *
 * @param props - Component props
 * @param props.error - The hardware wallet error
 * @param props.walletType - The hardware wallet type
 * @param props.onRetry - Optional retry callback
 * @param props.onCancel - Optional cancel/close callback
 */
export const HardwareWalletErrorModal: React.FC<
  HardwareWalletErrorModalProps
> = (props) => {
  const t = useI18nContext();
  const { hideModal, props: modalProps } = useModalProps();
  const { connectionState } = useHardwareWallet();

  // Use props from either direct props or modal state
  const { error, walletType, onRetry, onCancel } = {
    ...props,
    ...modalProps,
  };

  const canRetry =
    error.retryStrategy === RetryStrategy.RETRY &&
    error.userActionable &&
    onRetry;

  // Build error content using simple switch
  const errorContent = useMemo(
    () =>
      buildErrorContent(
        error,
        walletType,
        (key: string, substitutions?: string[]) => t(key, substitutions),
      ),
    [error, walletType, t],
  );

  const handleRetry = () => {
    hideModal();
    onRetry?.();
  };

  const handleCancel = () => {
    hideModal();
    onCancel?.();
  };

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      padding={4}
      gap={4}
    >
      {/* Error Icon */}
      <Icon
        name={errorContent.icon}
        color={IconColor.errorDefault}
        size={IconSize.Xl}
      />

      {/* Title */}
      <Text
        variant={TextVariant.headingMd}
        textAlign={TextAlign.Center}
        color={TextColor.textDefault}
      >
        {errorContent.title}
      </Text>

      {errorContent.description && (
        <Box
          width={BlockSize.Full}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          gap={2}
        >
          <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
            {errorContent.description}
          </Text>
        </Box>
      )}

      {/* Recovery Instructions */}
      {errorContent.recoveryInstructions.length > 0 && (
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
            {t('hardwareWalletConnectionRecoverySteps')}
          </Text>
          {errorContent.recoveryInstructions.map((instruction, index) => (
            <Box
              key={index}
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              gap={2}
              alignItems={AlignItems.flexStart}
            >
              <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
                {`${index + 1}.`}
              </Text>
              <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
                {instruction}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Action Buttons */}
      <Box
        width={BlockSize.Full}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        gap={2}
        marginTop={2}
      >
        {canRetry ? (
          <>
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              block
              onClick={handleRetry}
            >
              {t('hardwareWalletErrorContinueButton')}
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
    </Box>
  );
};

HardwareWalletErrorModal.propTypes = {
  error: PropTypes.any.isRequired,
  walletType: PropTypes.oneOf(Object.values(HardwareWalletType)).isRequired,
  onRetry: PropTypes.func,
  onCancel: PropTypes.func,
};
