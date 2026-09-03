/**
 * @jest-environment node
 *
 * Single-path wallet seam behavior, tested through the public surface of the
 * locally linked `@metamask/perps-controller` source (see package.json).
 *
 * The suite overrides the repo-wide Jest stub for `@metamask/perps-controller`
 * with the real package, and stubs the ESM-only `@nktkas/hyperliquid` SDK
 * (which cannot load under Jest's CJS transform). The stubbed
 * `ExchangeClient` captures the wallet the SDK would sign with — exactly the
 * object the seam under test produces — so assertions run against the real
 * controller/provider/service code path with no keyring involvement hidden.
 */

// Load the REAL locally-linked controller package instead of the global stub.
import {
  PerpsController,
  type AgentSigner,
  type PerpsControllerMessenger,
} from '@metamask/perps-controller';

import { createPerpsInfrastructure } from './infrastructure';

jest.mock('@metamask/perps-controller', () =>
  jest.requireActual(
    '../../../../node_modules/@metamask/perps-controller',
  ),
);

/** Wallets captured from SDK client construction, most recent last. */
const mockCapturedWallets: Record<string, unknown>[] = [];

jest.mock('@nktkas/hyperliquid', () => ({
  HttpTransport: class HttpTransport {},
  WebSocketTransport: class WebSocketTransport {
    ready() {
      return Promise.resolve();
    }

    close() {
      // no-op
    }

    socket = { addEventListener: () => undefined };
  },
  InfoClient: class InfoClient {},
  SubscriptionClient: class SubscriptionClient {},
  ExchangeClient: class ExchangeClient {
    constructor({ wallet }: { wallet: Record<string, unknown> }) {
      mockCapturedWallets.push(wallet);
    }
  },
}));

const mockTrackEvent = jest.fn();
jest.mock('../analytics', () => {
  const actual = jest.requireActual('../analytics');
  return {
    ...actual,
    trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  };
});

const mockCaptureException = jest.fn();
jest.mock('../../../../shared/lib/sentry', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
  initSentry: () => undefined,
}));

const MASTER =
  '0x1111111111111111111111111111111111111111' as `0x${string}`;
const AGENT = '0x2222222222222222222222222222222222222222' as `0x${string}`;

/** Params exactly as the SDK's viem local-account dispatch passes them. */
const VIEM_SIGNED_PARAMS = {
  domain: {
    name: 'HyperLiquid',
    version: '1',
    chainId: 42161,
    verifyingContract:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Agent: [
      { name: 'agentAddress', type: 'address' },
      { name: 'nonce', type: 'uint64' },
    ],
  },
  primaryType: 'Agent',
  message: { agentAddress: AGENT, nonce: 0 },
};

const mockSelectedAccount = {
  id: '00000000-0000-0000-0000-000000000000',
  address: MASTER,
  type: 'eip155:eoa',
  options: {},
  scopes: ['eip155:1'],
  methods: ['eth_signTransaction', 'eth_sign'],
  metadata: {
    name: 'Test Account',
    importTime: 0,
    keyring: { type: 'HD Key Tree' },
  },
};

function createMockMessenger() {
  const call = jest.fn((action: string) => {
    if (
      action === 'AccountTreeController:getAccountsFromSelectedAccountGroup'
    ) {
      return [mockSelectedAccount];
    }
    if (action === 'AccountsController:getSelectedAccount') {
      return mockSelectedAccount;
    }
    if (action === 'KeyringController:getState') {
      return { isUnlocked: true };
    }
    if (action === 'KeyringController:signTypedMessage') {
      return Promise.resolve('0xmastersig');
    }
    if (action === 'NetworkController:getState') {
      return { selectedNetworkClientId: 'mainnet' };
    }
    if (action === 'RemoteFeatureFlagController:getState') {
      return { remoteFeatureFlags: {} };
    }
    if (action === 'AuthenticationController:getBearerToken') {
      return Promise.resolve('mock-bearer-token');
    }
    return undefined;
  });

  const messenger = {
    call,
    publish: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    registerActionHandler: jest.fn(),
    registerMethodActionHandlers: jest.fn(),
    unregisterActionHandler: jest.fn(),
    registerEventHandler: jest.fn(),
    registerInitialEventPayload: jest.fn(),
    unregisterEventHandler: jest.fn(),
    clearEventSubscriptions: jest.fn(),
    clearActionSubscriptions: jest.fn(),
  };

  return { messenger: messenger as unknown as PerpsControllerMessenger, call };
}

function createMockInfrastructure() {
  return createPerpsInfrastructure({
    getStorageItem: jest.fn().mockResolvedValue({}),
    setStorageItem: jest.fn().mockResolvedValue(undefined),
    removeStorageItem: jest.fn().mockResolvedValue(undefined),
    getPerpsDiscountForAccount: jest.fn().mockResolvedValue(undefined),
    mergeAttributionContext: (properties) => properties ?? {},
  });
}

function createController(getAgentSigner?: AgentSigner | null) {
  const { messenger, call } = createMockMessenger();
  const controller = new PerpsController({
    messenger,
    infrastructure: createMockInfrastructure(),
    deferEligibilityCheck: true,
    ...(getAgentSigner ? { getAgentSigner: async () => getAgentSigner } : {}),
  });
  return { controller, call };
}

async function initializeProvider(controller: PerpsController) {
  await controller.init();
  const provider = controller.getActiveProvider();
  await provider.initialize();
}

describe('single-path wallet (agent signer seam)', () => {
  beforeEach(() => {
    mockCapturedWallets.length = 0;
    jest.clearAllMocks();
  });

  it('delegates agent-mode signing to the injected local signer with no keyring call', async () => {
    const signTypedData = jest.fn().mockResolvedValue('0xagentsig');
    const { controller, call } = createController({
      address: AGENT,
      signTypedData,
    });

    await initializeProvider(controller);

    const wallet = mockCapturedWallets[mockCapturedWallets.length - 1];
    expect(wallet?.address).toBe(AGENT);

    const signature = await (
      wallet?.signTypedData as (params: typeof VIEM_SIGNED_PARAMS) => Promise<string>
    )(VIEM_SIGNED_PARAMS);

    expect(signature).toBe('0xagentsig');
    // Direct delegation: EIP712Domain stripped, message passed as the value.
    expect(signTypedData).toHaveBeenCalledWith(
      VIEM_SIGNED_PARAMS.domain,
      { Agent: VIEM_SIGNED_PARAMS.types.Agent },
      VIEM_SIGNED_PARAMS.message,
    );
    // The keyring is never contacted in agent mode.
    expect(call).not.toHaveBeenCalledWith(
      'KeyringController:signTypedMessage',
      expect.anything(),
      expect.anything(),
    );
  });

  it('falls back to the master keyring path when no agent signer is present', async () => {
    const { controller, call } = createController(null);

    await initializeProvider(controller);

    const wallet = mockCapturedWallets[mockCapturedWallets.length - 1];
    expect(wallet?.address).toBe(MASTER);

    const signature = await (
      wallet?.signTypedData as (params: typeof VIEM_SIGNED_PARAMS) => Promise<string>
    )(VIEM_SIGNED_PARAMS);

    expect(signature).toBe('0xmastersig');
    expect(call).toHaveBeenCalledWith(
      'KeyringController:signTypedMessage',
      {
        from: MASTER,
        data: {
          domain: VIEM_SIGNED_PARAMS.domain,
          types: VIEM_SIGNED_PARAMS.types,
          primaryType: VIEM_SIGNED_PARAMS.primaryType,
          message: VIEM_SIGNED_PARAMS.message,
        },
      },
      'V4',
    );
  });

  it('switches the signing wallet via setTradingWalletOverride and back on clear', async () => {
    const signTypedData = jest.fn().mockResolvedValue('0xagentsig');
    const { controller, call } = createController(null);

    await initializeProvider(controller);

    const lastWallet = () => mockCapturedWallets[mockCapturedWallets.length - 1];
    expect(lastWallet()?.address).toBe(MASTER);

    await controller.setTradingWalletOverride({ address: AGENT, signTypedData });

    const agentWallet = lastWallet();
    expect(agentWallet?.address).toBe(AGENT);
    const agentSignature = await (
      agentWallet?.signTypedData as (params: typeof VIEM_SIGNED_PARAMS) => Promise<string>
    )(VIEM_SIGNED_PARAMS);
    expect(agentSignature).toBe('0xagentsig');
    expect(call).not.toHaveBeenCalledWith(
      'KeyringController:signTypedMessage',
      expect.anything(),
      expect.anything(),
    );

    await controller.setTradingWalletOverride(null);

    const masterWallet = lastWallet();
    expect(masterWallet?.address).toBe(MASTER);
    await (
      masterWallet?.signTypedData as (params: typeof VIEM_SIGNED_PARAMS) => Promise<string>
    )(VIEM_SIGNED_PARAMS);
    expect(call).toHaveBeenCalledWith(
      'KeyringController:signTypedMessage',
      expect.anything(),
      'V4',
    );
  });
});
