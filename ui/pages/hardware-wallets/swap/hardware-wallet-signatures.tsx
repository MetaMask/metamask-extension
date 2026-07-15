import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Header } from '../../../components/multichain/pages/page';
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
  const t = useI18nContext();
  const {
    signatureStatus,
    title,
    stepList,
    showFooter,
    footer,
    showQrSigningPage,
    qrSignRequest,
    qrSigningPageTitle,
    isFinalSignature,
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
        isFinalSignature={isFinalSignature}
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
      className="hardware-wallet-signatures flex-1 w-full min-h-full"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      data-testid="hardware-wallet-signatures"
    >
      <Header
        className="hardware-wallet-signatures__header"
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={handleCancel}
            data-testid="hardware-wallet-signatures__back-button"
          />
        }
      />
      <Box
        className="hardware-wallet-signatures__content h-full"
        flexDirection={BoxFlexDirection.Column}
        paddingTop={6}
        paddingHorizontal={4}
        alignItems={BoxAlignItems.Start}
      >
        <Box
          className="hardware-wallet-signatures__device self-center"
          marginBottom={6}
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
