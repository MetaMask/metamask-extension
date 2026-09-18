import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
  IconName,
} from '@metamask/design-system-react';

import Reader from '../../../../components/app/qr-hardware-popover/qr-hardware-sign-request/qr-reader';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import QrSignatureCode from '../qr-signature-code';
import { getQrScanButtonLabelKey } from '../hardware-wallet-signatures.utils';
import {
  QrHardwareSigningPhase,
  type QrHardwareSigningPageProps,
} from './qr-hardware-signing-page.types';

// Reader requires setErrorTitle/setErrorActive callbacks but this integration
// surfaces scan errors via onScanSuccess's failure path (the parent swap hook
// handles rejection state). The noops are stable references to avoid re-renders.
const NOOP = (): void => undefined;

export const QrHardwareSigningPage = ({
  title,
  phase,
  isFinalSignature = false,
  payload,
  requestId,
  onBack,
  onCancel,
  onContinueToScan,
  onScanSuccess,
}: QrHardwareSigningPageProps) => {
  const t = useI18nContext();
  const isScanningSignature = phase === QrHardwareSigningPhase.ScanSignature;

  return (
    <Box
      className="qr-hardware-signing-page flex-1 w-full min-h-full"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      data-testid="qr-hardware-signing-page"
    >
      <Box
        className="w-full"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        padding={4}
      >
        <ButtonIcon
          size={ButtonIconSize.Md}
          ariaLabel={t('back')}
          iconName={IconName.ArrowLeft}
          onClick={onBack}
          data-testid="qr-hardware-signing-page__back-button"
        />
      </Box>
      <Box
        className="flex-1 w-full"
        flexDirection={BoxFlexDirection.Column}
        gap={6}
        paddingHorizontal={4}
        alignItems={BoxAlignItems.Center}
      >
        <Box
          className="qr-hardware-signing-page__viewport w-full min-h-[293px] rounded-lg overflow-hidden"
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          backgroundColor={BoxBackgroundColor.BackgroundMuted}
          flexDirection={BoxFlexDirection.Column}
          data-testid="qr-hardware-signing-page__viewport"
        >
          {isScanningSignature ? (
            <Reader
              key={requestId}
              cancelQRHardwareSignRequest={onCancel}
              submitQRHardwareSignature={async (response) =>
                onScanSuccess(response)
              }
              requestId={requestId}
              setErrorTitle={NOOP}
              setErrorActive={NOOP}
            />
          ) : (
            <QrSignatureCode key={requestId} payload={payload} />
          )}
        </Box>
        <Text
          className="w-full"
          color={TextColor.TextDefault}
          variant={TextVariant.HeadingLg}
          data-testid="qr-hardware-signing-page__title"
        >
          {title}
        </Text>
      </Box>
      <Box
        className="w-full"
        flexDirection={BoxFlexDirection.Column}
        gap={4}
        padding={4}
      >
        {!isScanningSignature && (
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={onContinueToScan}
            data-testid="qr-hardware-signing-page__continue-button"
          >
            {t(getQrScanButtonLabelKey(isFinalSignature))}
          </Button>
        )}
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          isFullWidth
          onClick={onCancel}
          data-testid="qr-hardware-signing-page__cancel-button"
        >
          {t('cancel')}
        </Button>
      </Box>
    </Box>
  );
};

export default QrHardwareSigningPage;
