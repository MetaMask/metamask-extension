import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { HardwareWalletSignatureStatus } from '../hardware-wallet-signatures-state-machine';
import { getStepLabelColor } from '../hardware-wallet-signatures.utils';
import type { QrHardwareSignRequest } from '../types';
import SignatureStatusIcon from '../signature-status-icon';
import QrSignatureCode from '../qr-signature-code';
import type { SignatureStepListProps } from './signature-step-list.types';

const InlineQrSignatureCode = ({
  qrSignRequest,
}: {
  qrSignRequest: QrHardwareSignRequest;
}) => (
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
);

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
const SignatureStepList = ({
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
}: Readonly<SignatureStepListProps>) => {
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
            className="min-w-0 flex-1 min-h-8"
            flexDirection={BoxFlexDirection.Column}
            justifyContent={BoxJustifyContent.Center}
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
                <InlineQrSignatureCode qrSignRequest={qrSignRequest} />
              )}
          </Box>
        </li>
      )}
      <li>
        <SignatureStatusIcon
          status={finalStepStatus}
          stepNumber={needsTwoConfirmations ? 2 : 1}
        />
        <Box
          className="min-w-0 flex-1 min-h-8"
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Center}
        >
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
              <InlineQrSignatureCode qrSignRequest={qrSignRequest} />
            )}
        </Box>
      </li>
    </ul>
  );
};

export default React.memo(SignatureStepList);
