/**
 * @jest-environment node
 */

import type { MessengerActions, MessengerEvents } from '@metamask/messenger';
import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../lib/messenger';
import { PERPS_AGENT_SETUP_ERROR_CODES } from '../../../shared/constants/perps';
import type { PerpsAgentWalletControllerMessenger } from '../controllers/perps/agent-wallet/types';
import { getPerpsAgentWalletControllerMessenger } from './messengers/perps-agent-wallet-controller-messenger';
import { buildControllerInitRequestMock } from './test/utils';
import { PerpsAgentWalletControllerInit } from './perps-agent-wallet-controller-init';

const MASTER = '0x1111111111111111111111111111111111111111';
const PASSWORD = 'correct horse battery staple';

// Valid 65-byte signature hex: r (0x + 64 chars) + s (64 chars) + v ('1c' = 28).
const SIGNATURE = `0x${'11'.repeat(32)}${'22'.repeat(32)}1c`;

type AgentWalletInitApi = {
  perpsSetupAgentWallet: (params: {
    masterAccountAddress: string;
    isTestnet: boolean;
    password: string;
  }) => Promise<{ agentAddress: string }>;
  perpsCanSetupAgentWallet: () => boolean;
};

const buildInitResult = (
  {
    verifyPasswordThrows = false,
  }: { verifyPasswordThrows?: boolean } = {},
) => {
  const rootMessenger = getRootMessenger<
    MessengerActions<PerpsAgentWalletControllerMessenger>,
    MessengerEvents<PerpsAgentWalletControllerMessenger>
  >();
  const keyringMessenger = new Messenger({
    namespace: 'KeyringController',
    parent: rootMessenger,
  });
  const verifyPassword = verifyPasswordThrows
    ? jest.fn().mockRejectedValue(new Error('Incorrect password'))
    : jest.fn().mockResolvedValue(true);
  const signTypedMessage = jest.fn().mockResolvedValue(SIGNATURE);
  keyringMessenger.registerActionHandler(
    'KeyringController:verifyPassword' as never,
    verifyPassword as never,
  );
  keyringMessenger.registerActionHandler(
    'KeyringController:signTypedMessage' as never,
    signTypedMessage as never,
  );

  const controllerMessenger =
    getPerpsAgentWalletControllerMessenger(rootMessenger);
  const result = PerpsAgentWalletControllerInit({
    ...buildControllerInitRequestMock(),
    controllerMessenger,
    initMessenger: undefined,
  });

  return { result, api: result.api as AgentWalletInitApi };
};

describe('PerpsAgentWalletControllerInit', () => {
  it('returns the controller and a background API with the agent setup actions', () => {
    const { result, api } = buildInitResult();
    expect(result.messengerClient).toBeDefined();
    expect(typeof api.perpsSetupAgentWallet).toBe('function');
    expect(typeof api.perpsCanSetupAgentWallet).toBe('function');
  });

  describe('perpsCanSetupAgentWallet', () => {
    it('returns false for a fresh session', () => {
      const { api } = buildInitResult();
      expect(api.perpsCanSetupAgentWallet()).toBe(false);
    });
  });

  describe('perpsSetupAgentWallet', () => {
    it('returns the activated agent address on success', async () => {
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      } as never);
      const { api } = buildInitResult();
      const result = await api.perpsSetupAgentWallet({
        masterAccountAddress: MASTER,
        isTestnet: false,
        password: PASSWORD,
      });
      expect(result.agentAddress).toMatch(/^0x[0-9a-fA-F]{40}$/u);
      fetchMock.mockRestore();
    });

    it('prefixes rejection errors (wrong password) with the stable code', async () => {
      const { api } = buildInitResult({ verifyPasswordThrows: true });
      await expect(
        api.perpsSetupAgentWallet({
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: 'definitely-not-the-password',
        }),
      ).rejects.toThrow(PERPS_AGENT_SETUP_ERROR_CODES.REJECTED);
    });

    it('prefixes submission errors with the stable code', async () => {
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        json: async () => ({ status: 'err', response: 'nope' }),
      } as never);
      const { api } = buildInitResult();
      await expect(
        api.perpsSetupAgentWallet({
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: PASSWORD,
        }),
      ).rejects.toThrow(PERPS_AGENT_SETUP_ERROR_CODES.SUBMISSION_FAILED);
      fetchMock.mockRestore();
    });
  });
});
