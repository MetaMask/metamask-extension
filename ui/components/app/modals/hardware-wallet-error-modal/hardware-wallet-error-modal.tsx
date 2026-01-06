import React from 'react';
import {
  Text,
  Box,
  Button,
  ButtonVariant,
  ButtonSize,
  IconName,
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
import { getRecoveryInstructions } from './recovery-instructions';

type HardwareWalletErrorModalProps = {
  error: HardwareWalletError;
  walletType: HardwareWalletType;
  onRetry?: () => void;
  onCancel?: () => void;
};

/**
 * Modal component to display hardware wallet errors with recovery instructions
 *
 * @param props - The component props
 */
export const HardwareWalletErrorModal: React.FC<
  HardwareWalletErrorModalProps
> = (props) => {
  const t = useI18nContext();
  const { hideModal, props: modalProps } = useModalProps();

  // Use props from either direct props or modal state
  const { error, walletType, onRetry, onCancel } = {
    ...props,
    ...modalProps,
  };

  const canRetry =
    error.retryStrategy === RetryStrategy.RETRY &&
    error.userActionable &&
    onRetry;

  const recoveryInstructions = getRecoveryInstructions(error, t);

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
        name={IconName.Danger}
        color={IconColor.errorDefault}
        size={IconSize.Xl}
      />

      {/* Title */}
      <Text
        variant={TextVariant.headingMd}
        textAlign={TextAlign.Center}
        color={TextColor.textDefault}
      >
        {t('hardwareWalletErrorTitle')}
      </Text>

      {/* Wallet Type */}
      <Text
        variant={TextVariant.bodyMdMedium}
        textAlign={TextAlign.Center}
        color={TextColor.textAlternative}
      >
        {walletType === HardwareWalletType.Ledger
          ? t('ledger')
          : 'Hardware Wallet'}
      </Text>

      {/* Error Message */}
      <Box
        width={BlockSize.Full}
        padding={3}
        style={{
          backgroundColor: 'var(--color-error-muted)',
          borderRadius: '8px',
        }}
      >
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
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              block
              onClick={handleCancel}
            >
              {t('cancel')}
            </Button>
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              block
              onClick={handleRetry}
            >
              {t('hardwareWalletErrorRetryButton')}
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
