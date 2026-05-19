import type { Json, PendingJsonRpcResponse } from '@metamask/utils';
import {
  DEFI_REFERRAL_PARTNERS,
  DefiReferralPartner,
} from '../../../shared/constants/defi-referrals';
import type { ExtendedJSONRPCRequest } from './createDefiReferralMiddleware';
import {
  createHyperliquidDepositSignatureTriggerMiddleware,
  HYPERLIQUID_APPROVE_AGENT_PRIMARY_TYPE,
  HYPERLIQUID_SIGN_TRANSACTION_DOMAIN_NAME,
} from './hyperliquid-deposit-signature-trigger';

jest.mock('loglevel', () => ({ error: jest.fn() }));
const mockLogError = jest.requireMock('loglevel').error;

const HYPERLIQUID_ORIGIN =
  DEFI_REFERRAL_PARTNERS[DefiReferralPartner.Hyperliquid].origin;

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
  tabId = 123,
}: {
  origin?: string;
  params?: Json[];
  tabId?: number;
} = {}): ExtendedJSONRPCRequest => ({
  id: 1,
  jsonrpc: '2.0',
  method: 'eth_signTypedData_v4',
  origin,
  params,
  tabId,
});

const successResponse: PendingJsonRpcResponse<string> = {
  id: 1,
  jsonrpc: '2.0',
  result: '0xabcd1234',
};

describe('createHyperliquidDepositSignatureTriggerMiddleware', () => {
  let mockNext: jest.Mock;
  let openDepositFlow: jest.Mock;
  let isEligible: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNext = jest.fn((cb) => cb?.());
    openDepositFlow = jest.fn().mockResolvedValue(undefined);
    isEligible = jest.fn().mockResolvedValue(true);
  });

  const runMiddleware = async (
    request: ExtendedJSONRPCRequest,
    response: PendingJsonRpcResponse<Json> = successResponse,
  ) => {
    const middleware = createHyperliquidDepositSignatureTriggerMiddleware({
      isEligible,
      openDepositFlow,
    });

    await new Promise<void>((resolve) => {
      middleware(request, response, mockNext, () => resolve());
    });
  };

  it('opens the deposit flow after a successful Hyperliquid ApproveAgent signature', async () => {
    await runMiddleware(createMockRequest());

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(isEligible).toHaveBeenCalledWith({
      origin: HYPERLIQUID_ORIGIN,
      signerAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      tabId: 123,
      typedData: APPROVE_AGENT_TYPED_DATA,
    });
    expect(openDepositFlow).toHaveBeenCalledTimes(1);
    expect(openDepositFlow).toHaveBeenCalledWith({
      origin: HYPERLIQUID_ORIGIN,
      signerAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      tabId: 123,
      typedData: APPROVE_AGENT_TYPED_DATA,
    });
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

    expect(openDepositFlow).toHaveBeenCalledTimes(1);
  });

  it('does not open the deposit flow for non-Hyperliquid origins', async () => {
    await runMiddleware(
      createMockRequest({ origin: 'https://example.com' }),
    );

    expect(isEligible).not.toHaveBeenCalled();
    expect(openDepositFlow).not.toHaveBeenCalled();
  });

  it('does not open the deposit flow for other Hyperliquid signatures', async () => {
    await runMiddleware(
      createMockRequest({
        params: [
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          JSON.stringify(ACCEPT_TERMS_TYPED_DATA),
        ],
      }),
    );

    expect(isEligible).not.toHaveBeenCalled();
    expect(openDepositFlow).not.toHaveBeenCalled();
  });

  it('does not open the deposit flow when the signature request is rejected', async () => {
    await runMiddleware(createMockRequest(), {
      id: 1,
      jsonrpc: '2.0',
      error: { code: 4001, message: 'User rejected the request.' },
    });

    expect(isEligible).not.toHaveBeenCalled();
    expect(openDepositFlow).not.toHaveBeenCalled();
  });

  it('does not open the deposit flow when the eligibility gate rejects it', async () => {
    isEligible.mockResolvedValue(false);

    await runMiddleware(createMockRequest());

    expect(isEligible).toHaveBeenCalledTimes(1);
    expect(openDepositFlow).not.toHaveBeenCalled();
  });

  it('logs when opening the deposit flow fails', async () => {
    const error = new Error('Popup failed');
    openDepositFlow.mockRejectedValue(error);

    await runMiddleware(createMockRequest());

    expect(mockLogError).toHaveBeenCalledWith(
      'Failed to open Hyperliquid deposit prompt after ApproveAgent signature',
      error,
    );
  });
});
