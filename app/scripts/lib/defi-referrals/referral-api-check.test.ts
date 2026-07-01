import { HYPERLIQUID_INFO_API_URL } from '../../../../shared/constants/defi-referrals';
import { checkHyperliquidHasReferralCode } from './referral-api-check';

const WALLET_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

function mockFetchResponse(
  body: unknown,
  { ok = true, status = 200 }: { ok?: boolean; status?: number } = {},
) {
  jest.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response);
}

describe('checkHyperliquidHasReferralCode', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true when the user has already been referred', async () => {
    mockFetchResponse({
      referredBy: {
        referrer: '0x5ac99df645f3414876c816caa18b2d234024b487',
        code: 'TESTCODE',
      },
      cumVlm: '1000.0',
      referrerState: { stage: 'ready', data: { code: 'MYCODE' } },
      rewardHistory: [],
    });

    const result = await checkHyperliquidHasReferralCode(WALLET_ADDRESS);

    expect(result).toBe(true);
  });

  it('returns false when the user has no referral code set', async () => {
    mockFetchResponse({
      referredBy: null,
      cumVlm: '0.0',
      referrerState: { stage: 'inactive', data: null },
      rewardHistory: [],
    });

    const result = await checkHyperliquidHasReferralCode(WALLET_ADDRESS);

    expect(result).toBe(false);
  });

  it('returns false when referredBy is absent from the response', async () => {
    mockFetchResponse({ cumVlm: '0.0', rewardHistory: [] });

    const result = await checkHyperliquidHasReferralCode(WALLET_ADDRESS);

    expect(result).toBe(false);
  });

  it('returns false when fetch throws a network error', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(new Error('Network error'));

    const result = await checkHyperliquidHasReferralCode(WALLET_ADDRESS);

    expect(result).toBe(false);
  });

  it('returns false when the API responds with a non-200 status', async () => {
    mockFetchResponse(null, { ok: false, status: 500 });

    const result = await checkHyperliquidHasReferralCode(WALLET_ADDRESS);

    expect(result).toBe(false);
  });

  it('returns false when the response JSON is malformed', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    } as unknown as Response);

    const result = await checkHyperliquidHasReferralCode(WALLET_ADDRESS);

    expect(result).toBe(false);
  });

  it('calls the correct endpoint with the wallet address', async () => {
    mockFetchResponse({ referredBy: null });

    await checkHyperliquidHasReferralCode(WALLET_ADDRESS);

    expect(global.fetch).toHaveBeenCalledWith(HYPERLIQUID_INFO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'referral', user: WALLET_ADDRESS }),
    });
  });
});
