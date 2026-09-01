import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { useIsHardwareWalletAccount } from '../../../../hooks/useIsHardwareWalletAccount';
import { AgentWalletSetup } from './agent-wallet-setup';

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../../../hooks/useIsHardwareWalletAccount', () => ({
  useIsHardwareWalletAccount: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
const mockUseIsHardwareWalletAccount = jest.mocked(
  useIsHardwareWalletAccount,
);

const SELECTED_ACCOUNT_ID = (
  mockState.metamask as unknown as {
    internalAccounts: { selectedAccount: string };
  }
).internalAccounts.selectedAccount;

const SELECTED_ADDRESS = (
  mockState.metamask as unknown as {
    internalAccounts: {
      accounts: Record<string, { address: string }>;
    };
  }
).internalAccounts.accounts[SELECTED_ACCOUNT_ID].address;

const AGENT_REGISTRATION = {
  agentAddress: '0x9999999999999999999999999999999999999999',
  agentName: 'metamask-perps',
  masterAccountAddress: SELECTED_ADDRESS,
  createdAt: 1_700_000_000_000,
};

const FLAG_ON = { enabled: true, minimumVersion: '0.0.0' };

const buildStore = (
  overrides: {
    remoteFeatureFlags?: Record<string, unknown>;
    agentsByAccount?: Record<string, unknown>;
    setupStatusByAccount?: Record<string, unknown>;
  } = {},
) =>
  configureStore({
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        perpsAgentWalletEnabled: FLAG_ON,
        ...overrides.remoteFeatureFlags,
      },
      agentsByAccount: overrides.agentsByAccount ?? {},
      setupStatusByAccount: overrides.setupStatusByAccount ?? {},
    },
  });

const mockCanSetup = (canSetup: boolean) => {
  mockSubmitRequestToBackground.mockImplementation(async (method: string) => {
    if (method === 'perpsCanSetupAgentWallet') {
      return canSetup;
    }
    if (method === 'perpsSetupAgentWallet') {
      return { agentAddress: '0x9999999999999999999999999999999999999999' };
    }
    return undefined;
  });
};

describe('AgentWalletSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsHardwareWalletAccount.mockReturnValue(false);
    mockCanSetup(true);
  });

  describe('gating', () => {
    it('renders nothing when the remote flag is disabled', async () => {
      const store = buildStore({
        remoteFeatureFlags: { perpsAgentWalletEnabled: false },
      });
      const { container } = renderWithProvider(<AgentWalletSetup />, store);
      await waitFor(() => {
        expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
      });
      expect(container).toBeEmptyDOMElement();
    });

    it('renders the setup CTA when the flag is on, the session was password-unlocked, and no agent exists', async () => {
      const store = buildStore();
      renderWithProvider(<AgentWalletSetup />, store);
      await waitFor(() => {
        expect(screen.getByTestId('perps-agent-wallet-cta')).toBeInTheDocument();
      });
      expect(screen.getByTestId('perps-agent-wallet-cta')).toHaveTextContent(
        messages.perpsAgentWalletCta.message,
      );
    });

    it('does not render the CTA when the session was not password-unlocked', async () => {
      mockCanSetup(false);
      const store = buildStore();
      const { container } = renderWithProvider(<AgentWalletSetup />, store);
      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsCanSetupAgentWallet',
        );
      });
      expect(
        screen.queryByTestId('perps-agent-wallet-cta'),
      ).not.toBeInTheDocument();
      expect(container).toBeEmptyDOMElement();
    });

    it('does not render the CTA when an agent is already active, showing the status row instead', async () => {
      const store = buildStore({
        agentsByAccount: { [SELECTED_ADDRESS]: AGENT_REGISTRATION },
      });
      renderWithProvider(<AgentWalletSetup />, store);
      await waitFor(() => {
        expect(
          screen.queryByTestId('perps-agent-wallet-cta'),
        ).not.toBeInTheDocument();
      });
      expect(
        screen.getByTestId('perps-agent-wallet-status-active'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-agent-wallet-status-active'),
      ).toHaveTextContent(messages.perpsAgentWalletStatusActive.message);
      expect(
        screen.getByTestId('perps-agent-wallet-status-active'),
      ).toHaveTextContent(AGENT_REGISTRATION.agentAddress);
    });
  });

  describe('review screen', () => {
    const openReview = async () => {
      const store = buildStore();
      renderWithProvider(<AgentWalletSetup />, store);
      fireEvent.click(await screen.findByTestId('perps-agent-wallet-cta'));
      await screen.findByTestId('perps-agent-wallet-review');
    };

    it('shows the capability copy, rotation line, and agent name', async () => {
      await openReview();
      expect(
        screen.getByTestId('perps-agent-wallet-capability'),
      ).toHaveTextContent(
        'Trade and move funds between your Hyperliquid balances — withdrawals always require your wallet',
      );
      expect(
        screen.getByTestId('perps-agent-wallet-rotation'),
      ).toHaveTextContent(messages.perpsAgentWalletRotationLine.message);
      expect(screen.getByTestId('perps-agent-wallet-name')).toHaveTextContent(
        'metamask-perps',
      );
    });

    it('shows the agent address in the review when a registration exists', async () => {
      const store = buildStore({
        agentsByAccount: { [SELECTED_ADDRESS]: AGENT_REGISTRATION },
        setupStatusByAccount: { [SELECTED_ADDRESS]: 'awaiting-approval' },
      });
      renderWithProvider(<AgentWalletSetup />, store);
      await screen.findByTestId('perps-agent-wallet-review');
      expect(screen.getByTestId('perps-agent-wallet-address')).toHaveTextContent(
        AGENT_REGISTRATION.agentAddress,
      );
    });

    it('collects the wallet password in a password input', async () => {
      await openReview();
      const input = screen.getByTestId('perps-agent-wallet-password-input');
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: 'my-secret' } });
      expect(input).toHaveValue('my-secret');
    });

    it('uses plain Confirm copy for non-hardware wallets and device copy for hardware wallets', async () => {
      await openReview();
      expect(screen.getByTestId('perps-agent-wallet-confirm')).toHaveTextContent(
        messages.confirm.message,
      );
      fireEvent.click(screen.getByTestId('perps-agent-wallet-cancel'));
      await waitFor(() => {
        expect(
          screen.queryByTestId('perps-agent-wallet-review'),
        ).not.toBeInTheDocument();
      });

      mockUseIsHardwareWalletAccount.mockReturnValue(true);
      await openReview();
      expect(screen.getByTestId('perps-agent-wallet-confirm')).toHaveTextContent(
        messages.perpsAgentWalletConfirmOnDevice.message,
      );
    });

    it('submits the password exactly once through the background action on confirm', async () => {
      await openReview();
      fireEvent.change(screen.getByTestId('perps-agent-wallet-password-input'), {
        target: { value: 'my-secret' },
      });
      fireEvent.click(screen.getByTestId('perps-agent-wallet-confirm'));

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsSetupAgentWallet',
          [
            {
              masterAccountAddress: SELECTED_ADDRESS,
              isTestnet: false,
              password: 'my-secret',
            },
          ],
        );
      });
      expect(
        mockSubmitRequestToBackground.mock.calls.filter(
          ([method]) => method === 'perpsSetupAgentWallet',
        ),
      ).toHaveLength(1);
    });

    it('disables confirm while the setup is in flight', async () => {
      let resolveSetup: (value: unknown) => void = () => undefined;
      mockSubmitRequestToBackground.mockImplementation(
        (method: string) =>
          new Promise((resolve) => {
            if (method === 'perpsCanSetupAgentWallet') {
              resolve(true);
            } else if (method === 'perpsSetupAgentWallet') {
              resolveSetup = resolve;
            }
          }) as never,
      );
      await openReview();
      fireEvent.change(screen.getByTestId('perps-agent-wallet-password-input'), {
        target: { value: 'my-secret' },
      });
      const confirm = screen.getByTestId('perps-agent-wallet-confirm');
      fireEvent.click(confirm);
      await waitFor(() => {
        expect(confirm).toBeDisabled();
      });
      resolveSetup({ agentAddress: '0xabc' });
    });

    it('closes the review on success', async () => {
      await openReview();
      fireEvent.change(screen.getByTestId('perps-agent-wallet-password-input'), {
        target: { value: 'my-secret' },
      });
      fireEvent.click(screen.getByTestId('perps-agent-wallet-confirm'));
      await waitFor(() => {
        expect(
          screen.queryByTestId('perps-agent-wallet-review'),
        ).not.toBeInTheDocument();
      });
    });

    it('shows the wrong-password error and keeps the review open for retry on rejection', async () => {
      mockSubmitRequestToBackground.mockImplementation(async (method: string) => {
        if (method === 'perpsCanSetupAgentWallet') {
          return true;
        }
        if (method === 'perpsSetupAgentWallet') {
          throw new Error('PerpsAgentSetupError:REJECTED: Incorrect password');
        }
        return undefined;
      });
      await openReview();
      fireEvent.change(screen.getByTestId('perps-agent-wallet-password-input'), {
        target: { value: 'wrong' },
      });
      fireEvent.click(screen.getByTestId('perps-agent-wallet-confirm'));

      expect(
        await screen.findByTestId('perps-agent-wallet-wrong-password'),
      ).toHaveTextContent(messages.wrongPassword.message);
      expect(
        screen.getByTestId('perps-agent-wallet-review'),
      ).toBeInTheDocument();
      // Retry: confirm stays available.
      expect(screen.getByTestId('perps-agent-wallet-confirm')).toBeEnabled();
    });
  });

  describe('failed status', () => {
    it('renders the retry CTA with a failure hint when the setup failed', async () => {
      const store = buildStore({
        setupStatusByAccount: { [SELECTED_ADDRESS]: 'failed' },
      });
      renderWithProvider(<AgentWalletSetup />, store);
      const cta = await screen.findByTestId('perps-agent-wallet-cta');
      expect(cta).toHaveTextContent(messages.perpsAgentWalletCta.message);
      expect(screen.getByTestId('perps-agent-wallet-failed')).toHaveTextContent(
        messages.somethingWentWrong.message,
      );
    });
  });
});
