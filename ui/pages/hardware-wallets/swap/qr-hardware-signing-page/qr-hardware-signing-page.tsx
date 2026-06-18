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
import {
  QrHardwareSigningPhase,
  type QrHardwareSigningPageProps,
} from './qr-hardware-signing-page.types';

export const QrHardwareSigningPage = ({
  title,
  phase,
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
      className="qr-hardware-signing-page"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      style={{ flex: 1, width: '100%', minHeight: '100%' }}
      data-testid="qr-hardware-signing-page"
    >
      <Box
        className="qr-hardware-signing-page__header"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        style={{ width: '100%' }}
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
        className="qr-hardware-signing-page__content"
        flexDirection={BoxFlexDirection.Column}
        gap={4}
        alignItems={BoxAlignItems.Center}
        style={{ flex: 1, width: '100%' }}
      >
        <Box
          className="qr-hardware-signing-page__viewport"
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
              submitQRHardwareSignature={async (response) => {
                await onScanSuccess(response);
              }}
              requestId={requestId}
              setErrorTitle={() => undefined}
              setErrorActive={() => undefined}
            />
          ) : (
            <QrSignatureCode key={requestId} payload={payload} />
          )}
        </Box>
        <Text
          className="qr-hardware-signing-page__title"
          color={TextColor.TextDefault}
          variant={TextVariant.HeadingLg}
          data-testid="qr-hardware-signing-page__title"
        >
          {title}
        </Text>
      </Box>
      <Box
        className="qr-hardware-signing-page__footer"
        flexDirection={BoxFlexDirection.Column}
        gap={4}
        padding={4}
        style={{ width: '100%' }}
      >
        {!isScanningSignature && (
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={onContinueToScan}
            data-testid="qr-hardware-signing-page__continue-button"
          >
            {t('bridgeQrHardwareScanSignature')}
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
