import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import HardwareWalletSignatures from './hardware-wallet-signatures';
import { HardwareWalletSignatureStatus } from './hardware-wallet-signatures-state-machine';
import { ConnectionState } from '../../../contexts/hardware-wallets';
import {
  HardwareWalletActionsContext,
  HardwareWalletStateContext,
} from '../../../contexts/hardware-wallets/HardwareWalletContext';
import { HardwareConnectionPermissionState } from '../../../contexts/hardware-wallets/types';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  createBridgeMockStore,
  MOCK_LEDGER_ACCOUNT,
} from '../../../../test/data/bridge/mock-bridge-store';
import {
  hwSwapStoryState,
  type HwSwapStoryArgs,
} from '../../../__mocks__/hardware-wallet-swap/story-state';
import { HardwareKeyringType } from '../../../../shared/constants/hardware-wallets';

const LEDGER_ACCOUNT_GROUP =
  'keyring:Ledger Hardware/0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82';

type Args = HwSwapStoryArgs;

/**
 * Use the same bridge-ready store shape as the unit tests. A thin
 * `mock-state.json` slice is not enough: selectors such as `getBridgeQuotes`
 * array-destructure `metamask.quoteRequest`, and `getIsStxEnabled` walks the
 * full bridge/network selector tree.
 */
const createMockStore = () =>
  configureStore(
    createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: { address: '0x0', symbol: 'ETH', chainId: 'eip155:1' },
        toToken: { address: '0x1', symbol: 'USDC', chainId: 'eip155:1' },
      },
      metamaskStateOverrides: {
        internalAccounts: {
          selectedAccount: MOCK_LEDGER_ACCOUNT.id,
        },
        accountTree: {
          selectedAccountGroup: LEDGER_ACCOUNT_GROUP,
        },
      },
    }),
  );

const metricsValue = {
  trackEvent: () => Promise.resolve(),
  bufferedTrace: () => Promise.resolve(undefined),
  bufferedEndTrace: () => undefined,
  onboardingParentContext: { current: null },
};

const hardwareWalletActionsValue = {
  connect: async () => undefined,
  disconnect: async () => undefined,
  clearError: () => undefined,
  setConnectionReady: () => undefined,
  checkHardwareWalletPermission: async () =>
    HardwareConnectionPermissionState.Granted,
  requestHardwareWalletPermission: async () => false,
  ensureDeviceReady: async () => true,
  setSigningInProgress: (_value: boolean) => undefined,
};

interface StoryContext {
  args: Args;
}

const withProviders = (Story: React.ComponentType, context: StoryContext) => {
  hwSwapStoryState.current = { ...context.args };
  const store = createMockStore();

  return (
    <Provider store={store}>
      <MetaMetricsContext.Provider value={metricsValue}>
        <HardwareWalletStateContext.Provider
          value={{ connectionState: ConnectionState.ready() }}
        >
          <HardwareWalletActionsContext.Provider
            value={hardwareWalletActionsValue}
          >
            <Story />
          </HardwareWalletActionsContext.Provider>
        </HardwareWalletStateContext.Provider>
      </MetaMetricsContext.Provider>
    </Provider>
  );
};

const meta: Meta<Args> = {
  title: 'Pages/HardwareWallets/Swap/HardwareWalletSignatures',
  component: HardwareWalletSignatures,
  decorators: [withProviders],
  args: {
    status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
    needsTwoConfirmations: true,
    hardwareWalletType: HardwareKeyringType.trezor,
    showInlineQrSigning: false,
    isReadingQrSignature: false,
  },
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
      description: 'Signature state-machine status to visualize',
    },
    needsTwoConfirmations: {
      control: 'boolean',
      description:
        'Whether an approval step is required (drives the two-step layout)',
    },
    hardwareWalletType: {
      control: 'select',
      options: [
        HardwareKeyringType.trezor,
        HardwareKeyringType.ledger,
        HardwareKeyringType.qr,
      ],
      description: 'Hardware wallet device type shown by the animation',
    },
    showInlineQrSigning: {
      control: 'boolean',
      description: 'Whether the inline QR signing UI is shown',
    },
    isReadingQrSignature: {
      control: 'boolean',
      description: 'Whether the QR scanner is active',
    },
  },
};

export default meta;
type Story = StoryObj<Args>;

export const Interactive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Use the controls to explore every hardware wallet signing state. ' +
          'The status control drives the real state machine via dispatched ' +
          'reducer events, so the rendered UI is genuine.',
      },
    },
  },
};

export const ApprovalRequiredFirstSignature: Story = {
  args: {
    status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
    needsTwoConfirmations: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Initial state when approval is required: two-step layout with ' +
          'step 1 (approve) active.',
      },
    },
  },
};

export const ApprovalRequiredFinalSignature: Story = {
  args: {
    status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
    needsTwoConfirmations: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'After the approval is signed: step 1 complete, step 2 (swap) active.',
      },
    },
  },
};

export const SingleConfirmationAwaiting: Story = {
  args: {
    status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
    needsTwoConfirmations: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'No approval needed: single-step layout with only the swap signature.',
      },
    },
  },
};

export const SuccessSubmitted: Story = {
  args: {
    status: HardwareWalletSignatureStatus.Submitted,
    needsTwoConfirmations: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Terminal success state: all steps complete and the footer is hidden.',
      },
    },
  },
};

export const Rejected: Story = {
  args: {
    status: HardwareWalletSignatureStatus.Rejected,
    needsTwoConfirmations: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'User rejected a signature on the device: failed step highlighted ' +
          'and the retry button is shown.',
      },
    },
  },
};

export const Failed: Story = {
  args: {
    status: HardwareWalletSignatureStatus.Failed,
    needsTwoConfirmations: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Signing failed due to an error: failed step highlighted and the ' +
          'retry button is shown.',
      },
    },
  },
};

export const Disconnected: Story = {
  args: {
    status: HardwareWalletSignatureStatus.Disconnected,
    needsTwoConfirmations: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Device disconnected mid-flow: reconnect-and-retry button is shown.',
      },
    },
  },
};
