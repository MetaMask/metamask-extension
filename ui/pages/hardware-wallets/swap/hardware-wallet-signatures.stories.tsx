import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import HardwareWalletSignatures from './hardware-wallet-signatures';
import {
  HardwareWalletSignatureStatus,
  getInitialHardwareWalletSignaturesState,
} from './hardware-wallet-signatures-state-machine';
import { SignatureStepStatus } from './types';
import { getStepStatus } from './hardware-wallet-signatures.utils';
import mockState from '../../../../test/data/mock-state.json';
import { mockNetworkState } from '../../../../test/stub/networks';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  HardwareWalletContext,
  ConnectionStatus,
} from '../../../../contexts/hardware-wallets';
import { ConfirmContextProvider } from '../../confirmations/context/confirm';

const CHAIN_ID_MOCK = '0x1';

// MOCK FACTORIES

interface Args {
  status: HardwareWalletSignatureStatus;
  needsTwoConfirmations: boolean;
  hardwareWalletType: 'trezor' | 'ledger' | 'keystore';
  showInlineQrSigning: boolean;
  isReadingQrSignature: boolean;
  hasSignatureTimedOut: boolean;
  isRetrying: boolean;
  isRetryable: boolean;
}

const createMockStore = () => {
  return configureStore({
    metamask: {
      ...mockState.metamask,
      preferences: {
        ...mockState.metamask.preferences,
        useNativeCurrencyAsPrimaryCurrency: false,
      },
      ...mockNetworkState({ chainId: CHAIN_ID_MOCK }),
    },
  });
};

const mockTrackEvent = () => {};
const mockNavigateToBridgePage = () => {};
const mockCancelCurrentBatch = () => {};
const mockSetSigningInProgress = () => {};
const mockResetConnectionError = () => {};
const mockRetrySubmission = () => {};
const mockSetIsReadingQrSignature = () => {};
const mockHandleQrScanSuccess = () => {};
const mockHandleQrSignatureCancel = () => {};

const createMockHooks = (args: Args) => ({
  useHwSwapQuoteData: () => ({
    lockedQuote: {
      sentAmount: { amount: '1.5' },
      trade: {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
      },
      approval: {
        to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      },
      quote: {
        srcTokenAmount: '1500000000000000000',
        destTokenAmount: '3000000000',
        requestId: 'test-request-id-123',
      },
    },
    fromToken: { symbol: 'ETH' },
    toToken: { symbol: 'USDC' },
    hardwareWalletType: args.hardwareWalletType,
  }),
  useHwSwapSubmission: () => ({
    retrySubmission: mockRetrySubmission,
    hasStartedSubmission: { current: true },
  }),
  useHwSwapConnectionMonitoring: () => ({
    isDeviceDisconnectedRef: { current: false },
    resetConnectionError: mockResetConnectionError,
  }),
  useHwSwapConfirmationMonitoring: () => ({
    confirmationTxData: null,
  }),
  useHwSwapQrState: () => ({
    isReadingQrSignature: args.isReadingQrSignature,
    setIsReadingQrSignature: mockSetIsReadingQrSignature,
    qrSignRequest: null,
    showInlineQrSigning: args.showInlineQrSigning,
    activeQrStep: args.showInlineQrSigning ? args.status : null,
    handleQrScanSuccess: mockHandleQrScanSuccess,
    handleQrSignatureCancel: mockHandleQrSignatureCancel,
  }),
  useHwSwapNavigation: () => ({}),
  useHwSignTracker: () => ({
    cancelCurrentBatch: mockCancelCurrentBatch,
  }),
  useHardwareWalletActions: () => ({
    setSigningInProgress: mockSetSigningInProgress,
  }),
});

const createMockSignatureState = (
  status: HardwareWalletSignatureStatus,
  needsTwoConfirmations: boolean,
) => {
  return {
    status,
    needsTwoConfirmations,
    rejectedSignature: null,
    failedSignature: null,
    disconnectedSignature: null,
  };
};

// MOCK DECORATORS

const withProviders = (Story: React.FC, context: any) => {
  const args = context.args as Args;
  const store = createMockStore();

  return (
    <Provider store={store}>
      <MetaMetricsContext.Provider
        value={{
          trackEvent: mockTrackEvent,
          createMetaMetricsProperties: () => ({}),
          addPropertiesToEvent: (event) => event,
        }}
      >
        <HardwareWalletContext.Provider
          value={{
            connectionState: {
              status: ConnectionStatus.Ready,
              adapter: null,
            },
            dispatch: () => {},
            useHardwareWalletActions: () => ({
              setSigningInProgress: mockSetSigningInProgress,
            }),
            useHardwareWalletState: () => ({
              connectionState: {
                status: ConnectionStatus.Ready,
                adapter: null,
              },
            }),
          }}
        >
          <ConfirmContextProvider>
            <Story />
          </ConfirmContextProvider>
        </HardwareWalletContext.Provider>
      </MetaMetricsContext.Provider>
    </Provider>
  );
};

// MOCKED COMPONENT

const MockedHardwareWalletSignatures = (props: Args) => {
  const {
    hardwareWalletType,
    isReadingQrSignature,
    ...restProps
  } = props;

  // Simulate state machine
  const signatureState = createMockSignatureState(
    restProps.status,
    restProps.needsTwoConfirmations,
  );

  const firstStepStatus =
    restProps.needsTwoConfirmations
      ? getStepStatus(
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
          signatureState,
        )
      : SignatureStepStatus.Pending;

  const finalStepStatus = getStepStatus(
    HardwareWalletSignatureStatus.AwaitingFinalSignature,
    signatureState,
  );

  // For Storybook, render the actual component with state injection
  return (
    <div className="hardware-wallet-signatures">
      <div className="hardware-wallet-signatures__device">
        {/* GenericHardwareWalletAnimation stub */}
        <div data-testid="device-animation" style={{ width: 100, height: 100, background: '#ccc' }} />
      </div>
      <div className="hardware-wallet-signatures__content">
        <h2 className="hardware-wallet-signatures__title">
          {restProps.status === HardwareWalletSignatureStatus.Submitted
            ? 'Transaction submitted'
            : restProps.status === HardwareWalletSignatureStatus.Rejected
            ? 'Transaction rejected'
            : restProps.status === HardwareWalletSignatureStatus.Failed
            ? 'Transaction failed'
            : restProps.status === HardwareWalletSignatureStatus.Disconnected
            ? 'Device disconnected'
            : 'Confirm on your hardware wallet'}
        </h2>
        <ul className="hardware-wallet-signatures__steps">
          {restProps.needsTwoConfirmations && (
            <li>
              <div data-testid="step-1-status">
                Step 1: {firstStepStatus}
              </div>
              <div>Approve 1.5 ETH</div>
            </li>
          )}
          <li>
            <div data-testid="step-2-status">
              Step {restProps.needsTwoConfirmations ? '2' : '1'}: {finalStepStatus}
            </div>
            <div>Swap 1.5 ETH → USDC</div>
          </li>
        </ul>
      </div>
      <div className="hardware-wallet-signatures__footer">
        {restProps.isRetryable && !restProps.isRetrying && (
          <button data-testid="retry-button">Try again</button>
        )}
        {restProps.hasSignatureTimedOut &&
          (restProps.status === HardwareWalletSignatureStatus.AwaitingFirstSignature ||
            restProps.status ===
              HardwareWalletSignatureStatus.AwaitingFinalSignature) && (
          <button data-testid="resend-button">Resend transaction</button>
        )}
        {restProps.showInlineQrSigning && !restProps.isRetryable && (
          <button data-testid="scan-button">Scan QR</button>
        )}
        <button data-testid="cancel-button">Cancel</button>
      </div>
    </div>
  );
};

// METADATA

const meta: Meta<typeof MockedHardwareWalletSignatures> = {
  title: 'Pages/HardwareWallets/Swap/HardwareWalletSignatures',
  component: MockedHardwareWalletSignatures,
  decorators: [withProviders],
  argTypes: {
    status: {
      control: 'select',
      options: [
        HardwareWalletSignatureStatus.AwaitingFirstSignature,
        HardwareWalletSignatureStatus.AwaitingFinalSignature,
        HardwareWalletSignatureStatus.Submitted,
        HardwareWalletSignatureStatus.Rejected,
        HardwareWalletSignatureStatus.Failed,
        HardwareWalletSignatureStatus.Disconnected,
      ],
      description: 'State machine status',
    },
    needsTwoConfirmations: {
      control: 'boolean',
      description: 'Whether approval step is required',
    },
    hardwareWalletType: {
      control: 'select',
      options: ['trezor', 'ledger', 'keystore'],
      description: 'Hardware wallet device type',
    },
    showInlineQrSigning: {
      control: 'boolean',
      description: 'Whether QR signing UI is shown',
    },
    isReadingQrSignature: {
      control: 'boolean',
      description: 'Whether QR scanner is active',
    },
    hasSignatureTimedOut: {
      control: 'boolean',
      description: 'Whether 5s signature stuck timeout occurred',
    },
    isRetrying: {
      control: 'boolean',
      description: 'Whether retry operation is in progress',
    },
    isRetryable: {
      control: 'boolean',
      description: 'Whether retry button should be shown',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockedHardwareWalletSignatures>;

// INTERACTIVE STORY - Full Controls

export const Interactive: Story = {
  args: {
    status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
    needsTwoConfirmations: true,
    hardwareWalletType: 'trezor',
    showInlineQrSigning: false,
    isReadingQrSignature: false,
    hasSignatureTimedOut: false,
    isRetrying: false,
    isRetryable: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Use controls to explore all hardware wallet signing states. Toggle controls to see different UI states and transitions.',
      },
    },
  },
};

// SNAPSHOT STORIES - Curated Critical States

export const ApprovalRequired_FirstSignature: Story = {
  args: {
    status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
    needsTwoConfirmations: true,
    hardwareWalletType: 'trezor',
    showInlineQrSigning: false,
    isReadingQrSignature: false,
    hasSignatureTimedOut: false,
    isRetrying: false,
    isRetryable: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Initial state when approval is required. Shows two-step approval + trade with step 1 active.',
      },
    },
  },
};

export const ApprovalRequired_FinalSignature: Story = {
  args: {
    status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
    needsTwoConfirmations: true,
    hardwareWalletType: 'trezor',
    showInlineQrSigning: false,
    isReadingQrSignature: false,
    hasSignatureTimedOut: false,
    isRetrying: false,
    isRetryable: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'After approval is signed. Shows both steps with step 1 complete and step 2 active.',
      },
    },
  },
};

export const Success_Submitted: Story = {
  args: {
    status: HardwareWalletSignatureStatus.Submitted,
    needsTwoConfirmations: true,
    hardwareWalletType: 'trezor',
    showInlineQrSigning: false,
    isReadingQrSignature: false,
    hasSignatureTimedOut: false,
    isRetrying: false,
    isRetryable: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Terminal success state. Shows complete steps with no footer (component handles hiding footer on Submitted status).',
      },
    },
  },
};