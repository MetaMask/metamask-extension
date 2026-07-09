import React from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { HardwareWalletSignatureStatus } from '../hardware-wallet-signatures-state-machine';
import { getQrScanButtonLabelKey } from '../hardware-wallet-signatures.utils';
import type { SignatureFooterProps } from './signature-footer.types';

const FOOTER_STYLE = { width: '100%', marginTop: 'auto' } as const;

/**
 * Pure presentational footer for the hardware wallet signing-progress screen.
 *
 * Renders retry / resend / scan / cancel buttons based on the supplied
 * visibility flags. Calls `useI18nContext()` directly for button labels so
 * the parent does not need to thread a translation function through.
 *
 * @param props - The footer props (see {@link SignatureFooterProps}).
 * @param props.isRetryable - Whether the retry button should be shown. True when the state machine is in Rejected / Failed / Disconnected state.
 * @param props.isRetrying - Whether a retry is currently in flight. Disables the retry and resend buttons to prevent double-clicks.
 * @param props.showStuckRetryButton - Whether the "Resend transaction" button should show. True only after the user has retried at least once AND the signature has been stuck for longer than the stuck-timeout window.
 * @param props.showInlineQrCode - Whether the inline-QR "Scan signature" button should be eligible. Only renders when `isRetryable` is false (mutually exclusive with retry).
 * @param props.isFinalSignature - Whether the signature being scanned is the final one in the flow. Selects the "Scan next QR code" vs "Scan final QR code" label.
 * @param props.status - Current state machine status. Used to choose the retry button label (reconnect vs. try-again) based on whether the device is disconnected.
 * @param props.handleRetry - Called when the user clicks retry or resend.
 * @param props.handleCancel - Called when the user clicks cancel.
 * @param props.handleOpenQrSigningPage - Called when the user clicks "Scan signature" (inline QR flow).
 */
const SignatureFooter = ({
  isRetryable,
  isRetrying,
  showStuckRetryButton,
  showInlineQrCode,
  isFinalSignature = false,
  status,
  handleRetry,
  handleCancel,
  handleOpenQrSigningPage,
}: SignatureFooterProps) => {
  const t = useI18nContext();

  return (
    <Box
      className="hardware-wallet-signatures__footer"
      flexDirection={BoxFlexDirection.Column}
      gap={4}
      style={FOOTER_STYLE}
      padding={4}
    >
      {isRetryable && (
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          isDisabled={isRetrying}
          onClick={handleRetry}
          data-testid="hardware-wallet-signatures__retry-button"
        >
          {status === HardwareWalletSignatureStatus.Disconnected
            ? t('hardwareWalletErrorReconnectButton')
            : t('errorPageTryAgain')}
        </Button>
      )}
      {showStuckRetryButton && (
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          isDisabled={isRetrying}
          onClick={handleRetry}
          data-testid="hardware-wallet-signatures__resend-button"
        >
          {t('hardwareResendTransaction')}
        </Button>
      )}
      {showInlineQrCode && !isRetryable && (
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          onClick={handleOpenQrSigningPage}
          data-testid="hardware-wallet-signatures__scan-button"
        >
          {t(getQrScanButtonLabelKey(isFinalSignature))}
        </Button>
      )}
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Lg}
        isFullWidth
        onClick={handleCancel}
        data-testid="hardware-wallet-signatures__cancel-button"
      >
        {t('cancel')}
      </Button>
    </Box>
  );
};

export default React.memo(SignatureFooter);
