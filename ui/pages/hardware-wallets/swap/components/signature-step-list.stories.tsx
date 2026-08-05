import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import SignatureStepList from './signature-step-list';
import { SignatureStepStatus } from '../types';
import { HardwareWalletSignatureStatus } from '../hardware-wallet-signatures-state-machine';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';

const TEST_QR_SIGN_REQUEST = {
  type: QrScanRequestType.SIGN,
  request: {
    requestId: 'test-request-id',
    payload: {
      type: 'eth-sign-request',
      cbor: 'a201d825501f00a1b4c7e9a3f5d2e8b6a0c3d9f1e2a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    },
  },
} as const;

const meta: Meta<typeof SignatureStepList> = {
  title: 'Pages/HardwareWallets/Swap/SignatureStepList',
  component: SignatureStepList,
  argTypes: {
    firstStepStatus: {
      control: 'select',
      options: Object.values(SignatureStepStatus),
    },
    finalStepStatus: {
      control: 'select',
      options: Object.values(SignatureStepStatus),
    },
    activeQrStep: {
      control: 'select',
      options: [...Object.values(HardwareWalletSignatureStatus), null],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SignatureStepList>;

// Labels and descriptions mirror the output of `getStepLabels` and
// `getStepDescriptions` in ../hardware-wallet-signatures.utils.ts, with
// realistic placeholder values substituted into the locale strings
// (`hardwareApproveAmount` "Approve $1 $2" → "Approve 1.5 USDC",
//  `hardwareSpender` "Spender: $1" → "Spender: 0xabcde...12345", etc.)
// so the stories visually match what production renders.
const FROM_AMOUNT = '1.5';
const FROM_SYMBOL = 'USDC';
const SPENDER_SHORT = '0xabcde...12345';
const TO_SHORT = '0xfedcb...98765';

// Single-confirmation flow: only the final step renders.
// firstStepLabel is ignored because needsTwoConfirmations is false, but kept
// valid (production computes it via getStepLabels regardless).
export const SingleConfirmation: Story = {
  args: {
    hasSigningRequest: true,
    needsTwoConfirmations: false,
    firstStepStatus: SignatureStepStatus.Pending,
    firstStepLabel: `Approve ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    finalStepStatus: SignatureStepStatus.Active,
    finalStepLabel: `Sending ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    finalStepDescription: `To: ${TO_SHORT}`,
    showInlineQrCode: false,
    activeQrStep: null,
    qrSignRequest: null,
  },
};

// Two-confirmation flow (e.g. bridge): first step active, final step pending.
export const TwoConfirmationsActive: Story = {
  args: {
    hasSigningRequest: true,
    needsTwoConfirmations: true,
    firstStepStatus: SignatureStepStatus.Active,
    firstStepLabel: `Approve ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    firstStepDescription: `Spender: ${SPENDER_SHORT}`,
    finalStepStatus: SignatureStepStatus.Pending,
    finalStepLabel: `Send ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    finalStepDescription: `To: ${TO_SHORT}`,
    showInlineQrCode: false,
    activeQrStep: null,
    qrSignRequest: null,
  },
};

// Two-confirmation flow: both steps complete (status=Submitted drives the
// "Approved"/"Sent" past-tense labels via getStepLabels/getFinalStepLabel).
export const TwoConfirmationsComplete: Story = {
  args: {
    hasSigningRequest: true,
    needsTwoConfirmations: true,
    firstStepStatus: SignatureStepStatus.Complete,
    firstStepLabel: `Approved ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    firstStepDescription: `Spender: ${SPENDER_SHORT}`,
    finalStepStatus: SignatureStepStatus.Complete,
    finalStepLabel: `Sent ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    finalStepDescription: `To: ${TO_SHORT}`,
    showInlineQrCode: false,
    activeQrStep: null,
    qrSignRequest: null,
  },
};

// Two-confirmation flow: first step complete, final step rejected. Production
// conveys the rejection via the red label color (getStepLabelColor), not via
// the description — `getFinalStepDescription` only renders the "To:" address.
export const ErrorState: Story = {
  args: {
    hasSigningRequest: true,
    needsTwoConfirmations: true,
    firstStepStatus: SignatureStepStatus.Complete,
    firstStepLabel: `Approved ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    firstStepDescription: `Spender: ${SPENDER_SHORT}`,
    finalStepStatus: SignatureStepStatus.Rejected,
    finalStepLabel: `Send ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    finalStepDescription: `To: ${TO_SHORT}`,
    showInlineQrCode: false,
    activeQrStep: null,
    qrSignRequest: null,
  },
};

// Inline QR scan active on the first step.
export const WithInlineQr: Story = {
  args: {
    hasSigningRequest: true,
    needsTwoConfirmations: true,
    firstStepStatus: SignatureStepStatus.Active,
    firstStepLabel: `Approve ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    firstStepDescription: `Spender: ${SPENDER_SHORT}`,
    finalStepStatus: SignatureStepStatus.Pending,
    finalStepLabel: `Send ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    finalStepDescription: `To: ${TO_SHORT}`,
    showInlineQrCode: true,
    activeQrStep: HardwareWalletSignatureStatus.AwaitingFirstSignature,
    qrSignRequest: TEST_QR_SIGN_REQUEST,
  },
};

// Inline QR scan active on the final step (separate render branch in the component).
export const WithInlineQrFinalStep: Story = {
  args: {
    hasSigningRequest: true,
    needsTwoConfirmations: true,
    firstStepStatus: SignatureStepStatus.Complete,
    firstStepLabel: `Approved ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    firstStepDescription: `Spender: ${SPENDER_SHORT}`,
    finalStepStatus: SignatureStepStatus.Active,
    finalStepLabel: `Sending ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    finalStepDescription: `To: ${TO_SHORT}`,
    showInlineQrCode: true,
    activeQrStep: HardwareWalletSignatureStatus.AwaitingFinalSignature,
    qrSignRequest: TEST_QR_SIGN_REQUEST,
  },
};

// No signing request resolved yet: the component renders null. Labels are not
// displayed but kept valid (production computes them via getStepLabels).
export const NoSigningRequest: Story = {
  args: {
    hasSigningRequest: false,
    needsTwoConfirmations: false,
    firstStepStatus: SignatureStepStatus.Pending,
    firstStepLabel: `Approve ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    finalStepStatus: SignatureStepStatus.Pending,
    finalStepLabel: `Send ${FROM_AMOUNT} ${FROM_SYMBOL}`,
    showInlineQrCode: false,
    activeQrStep: null,
    qrSignRequest: null,
  },
};
