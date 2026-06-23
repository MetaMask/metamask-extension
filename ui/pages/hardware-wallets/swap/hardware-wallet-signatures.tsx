import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import GenericHardwareWalletAnimation from './generic-hardware-wallet-animation';
import QrHardwareSigningPage, {
  QrHardwareSigningPhase,
} from './qr-hardware-signing-page';
import SignatureStepList from './components/signature-step-list';
import SignatureFooter from './components/signature-footer';
import { useHardwareWalletSignatures } from './hooks/useHardwareWalletSignatures';

/**
 * Hardware-wallet signing-progress screen for bridge/swap and sendBundle
 * transactions.
 *
 * This component is purely presentational. All state, refs, effects, handlers,
 * and derived display values live in {@link useHardwareWalletSignatures}.
 * The shell handles two render modes:
 *
 * 1. Full-page QR signing (early return) when `showQrSigningPage` is true.
 * 2. Inline step list + footer for Ledger/Trezor and inline-QR flows.
 *
 * @returns JSX for the signing-progress screen.
 */
export default function HardwareWalletSignatures() {
  const {
    signatureStatus,
    title,
    stepList,
    showFooter,
    footer,
    showQrSigningPage,
    qrSignRequest,
    qrSigningPageTitle,
    handleQrSigningPageBack,
    handleCancel,
    setIsReadingQrSignature,
    handleQrScanSuccess,
  } = useHardwareWalletSignatures();

  if (showQrSigningPage && qrSignRequest && qrSigningPageTitle) {
    return (
      <QrHardwareSigningPage
        title={qrSigningPageTitle}
        phase={QrHardwareSigningPhase.ScanSignature}
        payload={qrSignRequest.request.payload}
        requestId={qrSignRequest.request.requestId}
        onBack={handleQrSigningPageBack}
        onCancel={handleCancel}
        onContinueToScan={() => setIsReadingQrSignature(true)}
        onScanSuccess={handleQrScanSuccess}
      />
    );
  }

  return (
    <Box
      className="hardware-wallet-signatures"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      style={{ flex: 1, width: '100%', minHeight: '100%' }}
      data-testid="hardware-wallet-signatures"
    >
      <Box
        className="hardware-wallet-signatures__content"
        flexDirection={BoxFlexDirection.Column}
        paddingTop={6}
        alignItems={BoxAlignItems.Start}
        style={{ height: '100%' }}
      >
        <Box
          className="hardware-wallet-signatures__device"
          marginBottom={6}
          style={{ alignSelf: 'center' }}
        >
          <GenericHardwareWalletAnimation status={signatureStatus} />
        </Box>
        <Text
          className="hardware-wallet-signatures__title"
          color={TextColor.TextDefault}
          variant={TextVariant.HeadingLg}
          data-testid="hardware-wallet-signatures__title"
        >
          {title}
        </Text>
        <SignatureStepList {...stepList} />
      </Box>
      {showFooter && <SignatureFooter {...footer} />}
    </Box>
  );
}
