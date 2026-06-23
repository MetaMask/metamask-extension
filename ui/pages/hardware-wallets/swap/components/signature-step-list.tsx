import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { HardwareWalletSignatureStatus } from '../hardware-wallet-signatures-state-machine';
import { SignatureStepStatus, type QrHardwareSignRequest } from '../types';
import SignatureStatusIcon from '../signature-status-icon';
import QrSignatureCode from '../qr-signature-code';
import type { SignatureStepListProps } from './signature-step-list.types';

/**
 * Returns the text color for a step label based on its display status.
 * Rejected/Failed/Disconnected steps render in the error color; everything
 * else uses the default text color.
 *
 * @param stepStatus - The display status of the step.
 * @returns The design-system text color to apply.
 */
function getStepLabelColor(stepStatus: SignatureStepStatus): TextColor {
  return stepStatus === SignatureStepStatus.Rejected ||
    stepStatus === SignatureStepStatus.Failed ||
    stepStatus === SignatureStepStatus.Disconnected
    ? TextColor.ErrorDefault
    : TextColor.TextDefault;
}

/**
 * Pure presentational component that renders the ordered list of hardware
 * wallet signature steps.
 *
 * Renders two `<li>` items when `needsTwoConfirmations` is true (first step +
 * final step); otherwise renders only the final step. Each item shows a
 * status icon, a label, an optional description, and an optional inline QR
 * code when QR signing is active on that step.
 *
 * @param props - The step list props (see {@link SignatureStepListProps}).
 * @param props.hasSigningRequest
 * @param props.needsTwoConfirmations
 * @param props.firstStepStatus
 * @param props.firstStepLabel
 * @param props.firstStepDescription
 * @param props.finalStepStatus
 * @param props.finalStepLabel
 * @param props.finalStepDescription
 * @param props.showInlineQrCode
 * @param props.activeQrStep
 * @param props.qrSignRequest
 */
export default function SignatureStepList({
  hasSigningRequest,
  needsTwoConfirmations,
  firstStepStatus,
  firstStepLabel,
  firstStepDescription,
  finalStepStatus,
  finalStepLabel,
  finalStepDescription,
  showInlineQrCode,
  activeQrStep,
  qrSignRequest,
}: SignatureStepListProps) {
  if (!hasSigningRequest) {
    return null;
  }

  return (
    <ul
      className="hardware-wallet-signatures__steps"
      data-testid="hardware-wallet-signatures__steps"
    >
      {needsTwoConfirmations && (
        <li>
          <SignatureStatusIcon status={firstStepStatus} stepNumber={1} />
          <Box
            className="min-w-0 flex-1"
            flexDirection={BoxFlexDirection.Column}
          >
            <Text
              color={getStepLabelColor(firstStepStatus)}
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
            >
              {firstStepLabel}
            </Text>
            {firstStepDescription && (
              <Text
                color={TextColor.TextAlternative}
                variant={TextVariant.BodyMd}
              >
                {firstStepDescription}
              </Text>
            )}
            {showInlineQrCode &&
              activeQrStep ===
                HardwareWalletSignatureStatus.AwaitingFirstSignature &&
              qrSignRequest && (
                <Box
                  className="hardware-wallet-signatures__qr-code"
                  flexDirection={BoxFlexDirection.Column}
                  alignItems={BoxAlignItems.Center}
                  gap={4}
                  marginTop={4}
                >
                  <QrSignatureCode
                    key={qrSignRequest.request.requestId}
                    payload={qrSignRequest.request.payload}
                  />
                </Box>
              )}
          </Box>
        </li>
      )}
      <li>
        <SignatureStatusIcon
          status={finalStepStatus}
          stepNumber={needsTwoConfirmations ? 2 : 1}
        />
        <Box className="min-w-0 flex-1" flexDirection={BoxFlexDirection.Column}>
          <Text
            color={getStepLabelColor(finalStepStatus)}
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
          >
            {finalStepLabel}
          </Text>
          {finalStepDescription && (
            <Text
              color={TextColor.TextAlternative}
              variant={TextVariant.BodyMd}
            >
              {finalStepDescription}
            </Text>
          )}
          {showInlineQrCode &&
            activeQrStep ===
              HardwareWalletSignatureStatus.AwaitingFinalSignature &&
            qrSignRequest && (
              <Box
                className="hardware-wallet-signatures__qr-code"
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Center}
                gap={4}
                marginTop={4}
              >
                <QrSignatureCode
                  key={qrSignRequest.request.requestId}
                  payload={qrSignRequest.request.payload}
                />
              </Box>
            )}
        </Box>
      </li>
    </ul>
  );
}
