/**
 * @jest-environment node
 */

import type { MessengerActions, MessengerEvents } from '@metamask/messenger';
import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getPerpsAgentWalletControllerMessenger } from '../../../messenger-client-init/messengers/perps-agent-wallet-controller-messenger';
import {
  AgentSetupRejectionError,
  AgentSetupSubmissionError,
  setupAgentWallet,
} from './agent-setup-flow';
import { PerpsAgentWalletController } from './perps-agent-wallet-controller';
import type {
  AgentRegistration,
  PerpsAgentWalletControllerMessenger,
  PerpsAgentWalletControllerState,
} from './types';

const MASTER = '0x1111111111111111111111111111111111111111';
const PASSWORD = 'correct horse battery staple';
const EXCHANGE_ENDPOINT = 'https://api.hyperliquid.xyz/exchange';

const mockTrackEvent = jest.fn();

jest.mock('../../analytics', () => ({
  createEventBuilder:
    jest.requireActual('../../analytics').createEventBuilder,
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

// Valid 65-byte signature hex: r (0x + 64 chars) + s (64 chars) + v ('1c' = 28).
const SIGNATURE = `0x${'11'.repeat(32)}${'22'.repeat(32)}1c`;

const buildHarness = (state: Partial<PerpsAgentWalletControllerState> = {}) => {
  // Real root + restricted messengers; the KeyringController namespace is a
  // child messenger with recorded stubs (mirroring the real KeyringController),
  // so every keyring call the flow makes is observable and mockable.
  const rootMessenger = getRootMessenger<
    MessengerActions<PerpsAgentWalletControllerMessenger>,
    MessengerEvents<PerpsAgentWalletControllerMessenger>
  >();
  const keyringMessenger = new Messenger({
    namespace: 'KeyringController',
    parent: rootMessenger,
  });
  const verifyPassword = jest.fn().mockResolvedValue(true);
  const signTypedMessage = jest.fn().mockResolvedValue(SIGNATURE);
  keyringMessenger.registerActionHandler(
    'KeyringController:verifyPassword' as never,
    verifyPassword as never,
  );
  keyringMessenger.registerActionHandler(
    'KeyringController:signTypedMessage' as never,
    signTypedMessage as never,
  );

  const messenger = getPerpsAgentWalletControllerMessenger(rootMessenger);
  const controller = new PerpsAgentWalletController({ messenger, state });

  // Wrapper around the real controller that records the flow's lifecycle calls
  // and captures the generated key material for leak assertions.
  let handle: { address: `0x${string}`; privateKey: string } | undefined;
  const beginSetup = jest.fn(async (masterAccountAddress: string) => {
    const keyHandle = await controller.beginSetup(masterAccountAddress);
    handle = keyHandle;
    return keyHandle;
  });
  const completeSetup = jest.fn(
    (
      masterAccountAddress: string,
      registration: AgentRegistration,
      password: string,
    ) => controller.completeSetup(masterAccountAddress, registration, password),
  );
  const failSetup = jest.fn((masterAccountAddress: string, reason: string) =>
    controller.failSetup(masterAccountAddress, reason),
  );
  const flowController = { beginSetup, completeSetup, failSetup };

  return {
    controller,
    messenger,
    flowController,
    beginSetup,
    completeSetup,
    verifyPassword,
    signTypedMessage,
    failSetup,
    getHandle: () => handle,
  };
};

const mockFetchOk = () =>
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ status: 'ok' }),
  } as Response);

const mockFetchErr = () =>
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ status: 'err', response: 'Agent already approved' }),
  } as Response);

describe('setupAgentWallet', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    mockTrackEvent.mockClear();
  });

  describe('metrics', () => {
    it('emits setup started then setup completed with the Perps category on the happy path', async () => {
      mockFetchOk();
      const harness = buildHarness();

      await setupAgentWallet(harness.flowController, harness.messenger, {
        masterAccountAddress: MASTER,
        isTestnet: false,
        password: PASSWORD,
      });

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
      expect(mockTrackEvent).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          name: 'Perp Agent Setup Started',
          properties: {
            category: 'Perps',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_testnet: false,
          },
        }),
      );
      expect(mockTrackEvent).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          name: 'Perp Agent Setup Completed',
          properties: {
            category: 'Perps',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_testnet: false,
          },
        }),
      );
    });

    it('emits only the anonymous setup failed event with the rejection category when the password is wrong', async () => {
      mockFetchOk();
      const harness = buildHarness();
      harness.verifyPassword.mockRejectedValue(
        new Error('Incorrect password'),
      );

      await expect(
        setupAgentWallet(harness.flowController, harness.messenger, {
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: 'wrong password',
        }),
      ).rejects.toThrow(AgentSetupRejectionError);

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Perp Agent Setup Failed',
          options: { excludeMetaMetricsId: true },
          properties: {
            category: 'Perps',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            failure_category: 'rejection',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_testnet: false,
          },
        }),
      );
    });

    it('emits the setup failed event with the rejection category when the master signature is rejected', async () => {
      mockFetchOk();
      const harness = buildHarness();
      harness.signTypedMessage.mockRejectedValue(
        new Error('User rejected the request.'),
      );

      await expect(
        setupAgentWallet(harness.flowController, harness.messenger, {
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: PASSWORD,
        }),
      ).rejects.toThrow(AgentSetupRejectionError);

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
      expect(mockTrackEvent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: 'Perp Agent Setup Failed',
          options: { excludeMetaMetricsId: true },
          properties: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            failure_category: 'rejection',
          }),
        }),
      );
    });

    it('emits the setup failed event with the submission category when the exchange rejects the submission', async () => {
      mockFetchErr();
      const harness = buildHarness();

      await expect(
        setupAgentWallet(harness.flowController, harness.messenger, {
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: PASSWORD,
        }),
      ).rejects.toThrow(AgentSetupSubmissionError);

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
      expect(mockTrackEvent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: 'Perp Agent Setup Failed',
          options: { excludeMetaMetricsId: true },
          properties: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            failure_category: 'submission',
          }),
        }),
      );
    });

    it('emits the setup failed event with the submission category when fetch fails with a network error', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new TypeError('fetch failed'));
      const harness = buildHarness();

      await expect(
        setupAgentWallet(harness.flowController, harness.messenger, {
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: PASSWORD,
        }),
      ).rejects.toThrow(AgentSetupSubmissionError);

      expect(mockTrackEvent).toHaveBeenCalledTimes(2);
      expect(mockTrackEvent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: 'Perp Agent Setup Failed',
          options: { excludeMetaMetricsId: true },
          properties: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            failure_category: 'submission',
          }),
        }),
      );
    });
  });

  describe('happy path', () => {
    it('verifies the password, signs with the master account via the keyring, submits approveAgent to the exchange, and activates the agent', async () => {
      const fetchMock = mockFetchOk();
      const activated: {
        masterAccountAddress: string;
        agentAddress: string;
      }[] = [];
      const harness = buildHarness();
      harness.messenger.subscribe(
        'PerpsAgentWalletController:agentActivated',
        (payload) => {
          activated.push(payload);
        },
      );

      const result = await setupAgentWallet(
        harness.flowController,
        harness.messenger,
        {
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: PASSWORD,
        },
      );
      const handle = harness.getHandle();
      expect(handle).toBeDefined();

      expect(result).toEqual({ agentAddress: handle?.address });
      expect(harness.verifyPassword).toHaveBeenCalledWith(PASSWORD);

      // The MASTER account signs the EIP-712 typed data via the keyring.
      expect(harness.signTypedMessage).toHaveBeenCalledTimes(1);
      const [msgParams, signingType] = harness.signTypedMessage.mock.calls[0];
      expect(signingType).toBe('V4');
      expect(msgParams).toMatchObject({ from: MASTER });
      const {data} = (msgParams as {
          data: {
            primaryType: string;
            message: Record<string, unknown>;
          };
        });
      expect(data.primaryType).toBe('HyperliquidTransaction:ApproveAgent');
      expect(data.message).toMatchObject({
        hyperliquidChain: 'Mainnet',
        agentAddress: handle?.address,
        agentName: 'metamask-perps',
      });

      // The exchange POST carries the {r,s,v} split of the keyring signature.
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(EXCHANGE_ENDPOINT);
      expect(init?.method).toBe('POST');
      expect((init?.headers as Record<string, string>)['Content-Type']).toBe(
        'application/json',
      );
      const body = JSON.parse(init?.body as string);
      expect(body.action).toEqual({
        type: 'approveAgent',
        hyperliquidChain: 'Mainnet',
        signatureChainId: '0xa4b1',
        agentAddress: handle?.address,
        agentName: 'metamask-perps',
        nonce: data.message.nonce,
      });
      expect(body.nonce).toBe(data.message.nonce);
      expect(body.signature).toEqual({
        r: SIGNATURE.slice(0, 66),
        s: `0x${SIGNATURE.slice(66, 130)}`,
        v: 28,
      });
      // Both r and s are Hex(66): 0x + 64 chars (ApproveAgentRequest schema).
      expect(body.signature.r).toMatch(/^0x[0-9a-fA-F]{64}$/u);
      expect(body.signature.s).toMatch(/^0x[0-9a-fA-F]{64}$/u);

      // Activation: registration persisted, status active, event emitted.
      expect(harness.controller.state.agentsByAccount[MASTER]).toMatchObject({
        agentAddress: handle?.address,
        agentName: 'metamask-perps',
        masterAccountAddress: MASTER,
      });
      expect(harness.controller.state.setupStatusByAccount[MASTER]).toBe(
        'active',
      );
      expect(activated).toEqual([
        { masterAccountAddress: MASTER, agentAddress: handle?.address },
      ]);

      // No key material anywhere in the persisted state.
      const stateJson = JSON.stringify(harness.controller.state);
      expect(stateJson).not.toContain(handle?.privateKey);
      expect(stateJson.toLowerCase()).not.toContain(
        handle?.privateKey.slice(2).toLowerCase(),
      );
    });

    it('runs end-to-end through the controller orchestration method for testnet', async () => {
      const fetchMock = mockFetchOk();
      const activated: {
        masterAccountAddress: string;
        agentAddress: string;
      }[] = [];
      const harness = buildHarness();
      harness.messenger.subscribe(
        'PerpsAgentWalletController:agentActivated',
        (payload) => {
          activated.push(payload);
        },
      );

      const result = await harness.controller.setupAgentWallet({
        masterAccountAddress: MASTER,
        isTestnet: true,
        password: PASSWORD,
      });
      const agentAddress =
        harness.controller.state.agentsByAccount[MASTER]?.agentAddress;

      expect(result.agentAddress).toBe(agentAddress);
      expect(agentAddress).toMatch(/^0x[0-9a-fA-F]{40}$/u);
      expect(
        harness.controller.state.setupStatusByAccount[MASTER],
      ).toBe('active');
      expect(activated).toEqual([
        { masterAccountAddress: MASTER, agentAddress },
      ]);
      expect(harness.verifyPassword).toHaveBeenCalledWith(PASSWORD);
      const [msgParams] = harness.signTypedMessage.mock.calls[0];
      expect(
        (
          msgParams as { data: { message: { hyperliquidChain: string } } }
        ).data.message.hyperliquidChain,
      ).toBe('Testnet');
      const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
      expect(body.action.hyperliquidChain).toBe('Testnet');
    });
  });

  describe('password rejection', () => {
    it('throws AGENT_SETUP_REJECTED and starts no setup when the password is wrong', async () => {
      mockFetchOk();
      const harness = buildHarness();
      harness.verifyPassword.mockRejectedValue(new Error('Incorrect password'));

      await expect(
        setupAgentWallet(harness.flowController, harness.messenger, {
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: 'wrong password',
        }),
      ).rejects.toThrow(new AgentSetupRejectionError('Incorrect password'));
      expect(harness.beginSetup).not.toHaveBeenCalled();
      expect(harness.failSetup).not.toHaveBeenCalled();
      expect(harness.controller.state.agentsByAccount).toEqual({});
      expect(
        harness.controller.state.setupStatusByAccount[MASTER],
      ).toBeUndefined();
    });
  });

  describe('signature rejection', () => {
    it('calls failSetup and throws AGENT_SETUP_REJECTED when the keyring signature is rejected', async () => {
      mockFetchOk();
      const harness = buildHarness();
      harness.signTypedMessage.mockRejectedValue(
        new Error('User rejected the request.'),
      );

      await expect(
        setupAgentWallet(harness.flowController, harness.messenger, {
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: PASSWORD,
        }),
      ).rejects.toThrow(new AgentSetupRejectionError('Master signature rejected'));
      expect(harness.failSetup).toHaveBeenCalledWith(
        MASTER,
        expect.stringContaining('User rejected'),
      );
      expect(harness.controller.state.agentsByAccount).toEqual({});
      expect(harness.controller.state.agentKeyVaultByAccount).toEqual({});
      expect(harness.controller.state.setupStatusByAccount[MASTER]).toBe(
        'failed',
      );
    });
  });

  describe('malformed signature guard', () => {
    it('calls failSetup and throws the submission error when the signature is not 0x + 130 hex chars, without contacting the exchange', async () => {
      const fetchMock = mockFetchOk();
      const harness = buildHarness();
      // 131 characters: 0x + 64 + 64 + 1 (truncated v byte).
      const shortSignature = `0x${'11'.repeat(32)}${'22'.repeat(32)}1`;
      expect(shortSignature).toHaveLength(131);
      harness.signTypedMessage.mockResolvedValue(shortSignature);

      await expect(
        setupAgentWallet(harness.flowController, harness.messenger, {
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: PASSWORD,
        }),
      ).rejects.toThrow(AgentSetupSubmissionError);

      expect(harness.failSetup).toHaveBeenCalledWith(
        MASTER,
        expect.stringContaining('malformed signature'),
      );
      // Not left mid-flight: the setup is marked failed.
      expect(harness.controller.state.setupStatusByAccount[MASTER]).toBe(
        'failed',
      );
      // Nothing reached the exchange.
      expect(fetchMock).not.toHaveBeenCalled();
      // Classified as a submission failure, emitted anonymously.
      expect(mockTrackEvent).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: 'Perp Agent Setup Failed',
          options: { excludeMetaMetricsId: true },
          properties: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            failure_category: 'submission',
          }),
        }),
      );
    });
  });

  describe('submission failure', () => {
    it('calls failSetup and throws AGENT_SETUP_SUBMISSION_FAILED when the exchange answers {status: err}', async () => {
      mockFetchErr();
      const harness = buildHarness();

      await expect(
        setupAgentWallet(harness.flowController, harness.messenger, {
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: PASSWORD,
        }),
      ).rejects.toThrow(AgentSetupSubmissionError);
      expect(harness.failSetup).toHaveBeenCalledWith(
        MASTER,
        expect.stringContaining('submission failed'),
      );
      expect(harness.controller.state.agentsByAccount).toEqual({});
      expect(harness.controller.state.agentKeyVaultByAccount).toEqual({});
      expect(harness.controller.state.setupStatusByAccount[MASTER]).toBe(
        'failed',
      );
    });

    it('calls failSetup and throws AGENT_SETUP_SUBMISSION_FAILED when fetch rejects with a network error', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new TypeError('fetch failed'));
      const harness = buildHarness();

      await expect(
        setupAgentWallet(harness.flowController, harness.messenger, {
          masterAccountAddress: MASTER,
          isTestnet: false,
          password: PASSWORD,
        }),
      ).rejects.toThrow(
        new AgentSetupSubmissionError(
          'submission failed: TypeError: fetch failed',
        ),
      );
      expect(harness.failSetup).toHaveBeenCalledWith(
        MASTER,
        expect.stringContaining('TypeError: fetch failed'),
      );
      // Not left mid-flight: the setup is marked failed.
      expect(harness.controller.state.setupStatusByAccount[MASTER]).toBe(
        'failed',
      );
      expect(harness.controller.state.agentsByAccount).toEqual({});
      expect(harness.controller.state.agentKeyVaultByAccount).toEqual({});
    });
  });
});
