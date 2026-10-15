import type { Json, PendingJsonRpcResponse } from '@metamask/utils';
import { HYPERLIQUID_ORIGIN } from '../../../../shared/constants/defi-referrals';
import type { OriginAwareJsonRpcRequest } from '../rpc-request-utils';
import {
  HYPERLIQUID_APPROVE_AGENT_PRIMARY_TYPE,
  HYPERLIQUID_SIGN_TRANSACTION_DOMAIN_NAME,
} from './constants';
import { createHyperliquidDepositMiddleware } from './createHyperliquidDepositMiddleware';

jest.mock('loglevel', () => ({ error: jest.fn() }));
const mockLogError = jest.requireMock('loglevel').error;

const APPROVE_AGENT_TYPED_DATA = {
  domain: {
    name: HYPERLIQUID_SIGN_TRANSACTION_DOMAIN_NAME,
    version: '1',
    chainId: 42161,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  },
  types: {
    [HYPERLIQUID_APPROVE_AGENT_PRIMARY_TYPE]: [
      { name: 'hyperliquidChain', type: 'string' },
      { name: 'agentAddress', type: 'address' },
      { name: 'agentName', type: 'string' },
      { name: 'nonce', type: 'uint64' },
    ],
  },
  primaryType: HYPERLIQUID_APPROVE_AGENT_PRIMARY_TYPE,
  message: {
    hyperliquidChain: 'Mainnet',
    agentAddress: '0x1234567890abcdef1234567890abcdef12345678',
    agentName: 'metamask',
    nonce: 1768146911127,
  },
};

// Revoking an API key on Hyperliquid reuses the ApproveAgent signature with a
// zero agent address.
const REVOKE_AGENT_TYPED_DATA = {
  ...APPROVE_AGENT_TYPED_DATA,
  message: {
    ...APPROVE_AGENT_TYPED_DATA.message,
    agentAddress: '0x0000000000000000000000000000000000000000',
    agentName: '',
  },
};

const ACCEPT_TERMS_TYPED_DATA = {
  ...APPROVE_AGENT_TYPED_DATA,
  primaryType: 'Hyperliquid:AcceptTerms',
  message: {
    hyperliquidChain: 'Mainnet',
    time: 1768146911127,
  },
};

const createMockRequest = ({
  origin = HYPERLIQUID_ORIGIN,
  params = [
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    JSON.stringify(APPROVE_AGENT_TYPED_DATA),
  ],
}: {
  origin?: string;
  params?: Json[];
} = {}): OriginAwareJsonRpcRequest => ({
  id: 1,
  jsonrpc: '2.0',
  method: 'eth_signTypedData_v4',
  origin,
  params,
});

const successResponse: PendingJsonRpcResponse<string> = {
  id: 1,
  jsonrpc: '2.0',
  result: '0xabcd1234',
};

describe('createHyperliquidDepositMiddleware', () => {
  let mockNext: jest.Mock;
  let showDepositPrompt: jest.Mock;
  let isEligible: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNext = jest.fn((cb) => cb?.());
    showDepositPrompt = jest.fn().mockResolvedValue(undefined);
    isEligible = jest.fn().mockResolvedValue(true);
  });

  const runMiddleware = async (
    request: OriginAwareJsonRpcRequest,
    response: PendingJsonRpcResponse<Json> = successResponse,
  ) => {
    const middleware = createHyperliquidDepositMiddleware({
      isEligible,
      showDepositPrompt,
    });

    await new Promise<void>((resolve) => {
      middleware(request, response, mockNext, () => resolve());
    });

    // Allow fire-and-forget promises (eligibility check, prompt display) to settle.
    await new Promise(process.nextTick);
  };

  it('shows the deposit prompt after a successful Hyperliquid ApproveAgent signature', async () => {
    await runMiddleware(createMockRequest());

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(isEligible).toHaveBeenCalledWith({
      origin: HYPERLIQUID_ORIGIN,
      signerAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      typedData: APPROVE_AGENT_TYPED_DATA,
    });
    expect(showDepositPrompt).toHaveBeenCalledTimes(1);
    expect(showDepositPrompt).toHaveBeenCalledWith({
      origin: HYPERLIQUID_ORIGIN,
      signerAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      typedData: APPROVE_AGENT_TYPED_DATA,
    });
  });

  it('starts eligibility before the signature request resolves', async () => {
    mockNext = jest.fn((cb) => {
      expect(isEligible).toHaveBeenCalledTimes(1);
      cb?.();
    });

    await runMiddleware(createMockRequest());

    expect(showDepositPrompt).toHaveBeenCalledTimes(1);
    expect(isEligible.mock.invocationCallOrder[0]).toBeLessThan(
      mockNext.mock.invocationCallOrder[0],
    );
  });

  it('accepts typed data passed as an object param', async () => {
    await runMiddleware(
      createMockRequest({
        params: [
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          APPROVE_AGENT_TYPED_DATA as Json,
        ],
      }),
    );

    expect(showDepositPrompt).toHaveBeenCalledTimes(1);
  });

  it('does not show the deposit prompt for non-Hyperliquid origins', async () => {
    await runMiddleware(createMockRequest({ origin: 'https://example.com' }));

    expect(isEligible).not.toHaveBeenCalled();
    expect(showDepositPrompt).not.toHaveBeenCalled();
  });

  it('does not show the deposit prompt for an API key revocation (zero agent address)', async () => {
    await runMiddleware(
      createMockRequest({
        params: [
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          JSON.stringify(REVOKE_AGENT_TYPED_DATA),
        ],
      }),
    );

    expect(isEligible).not.toHaveBeenCalled();
    expect(showDepositPrompt).not.toHaveBeenCalled();
  });

  it('does not show the deposit prompt for other Hyperliquid signatures', async () => {
    await runMiddleware(
      createMockRequest({
        params: [
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          JSON.stringify(ACCEPT_TERMS_TYPED_DATA),
        ],
      }),
    );

    expect(isEligible).not.toHaveBeenCalled();
    expect(showDepositPrompt).not.toHaveBeenCalled();
  });

  it('does not show the deposit prompt when the signature request is rejected', async () => {
    await runMiddleware(createMockRequest(), {
      id: 1,
      jsonrpc: '2.0',
      error: { code: 4001, message: 'User rejected the request.' },
    });

    expect(isEligible).toHaveBeenCalledTimes(1);
    expect(showDepositPrompt).not.toHaveBeenCalled();
  });

  it('does not show the deposit prompt when the eligibility gate rejects it', async () => {
    isEligible.mockResolvedValue(false);

    await runMiddleware(createMockRequest());

    expect(isEligible).toHaveBeenCalledTimes(1);
    expect(showDepositPrompt).not.toHaveBeenCalled();
  });

  it('logs when showing the deposit prompt fails', async () => {
    const error = new Error('Popup failed');
    showDepositPrompt.mockRejectedValue(error);

    await runMiddleware(createMockRequest());

    expect(mockLogError).toHaveBeenCalledWith(
      'HyperliquidDepositPrompt: Failed to show prompt',
      error,
    );
  });
});
