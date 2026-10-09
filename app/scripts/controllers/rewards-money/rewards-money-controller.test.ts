import { it } from '@jest/globals';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  type MessengerActions,
  type MessengerEvents,
  type MockAnyNamespace,
} from '@metamask/messenger';
import type {
  PerpsRebateTrade,
  ReferralMeDto,
} from '../../../../shared/types/rewards-money';
import {
  RewardsMoneyHttpError,
  RewardsMoneyRebateQuoteError,
} from './rewards-money-data-service';
import { RewardsMoneyController } from './rewards-money-controller';
import type { RewardsMoneyControllerMessenger } from './rewards-money-controller-types';

type AllActions = MessengerActions<RewardsMoneyControllerMessenger>;
type AllEvents = MessengerEvents<RewardsMoneyControllerMessenger>;
type RootMessenger = Messenger<MockAnyNamespace, AllActions, AllEvents>;

function buildReferralMe(
  overrides: Partial<ReferralMeDto> = {},
): ReferralMeDto {
  return {
    role: 'NONE',
    variant: 'NONE',
    // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
    localized_text: {
      inviteTitle: 'Invite',
      inviteMessageBody: 'Body',
      inviteReferralCode: 'Code',
      inviteDecline: 'Decline',
      inviteAccept: 'Accept',
      inviteAcceptedEyebrow: 'Eyebrow',
      inviteAcceptedTitle: 'Title',
      inviteAcceptedBody: 'Body {date}',
      inviteAcceptedCloseA11y: 'Close',
      inviteAcceptedStartTrading: 'Start',
      inviteAcceptedViewRewards: 'View',
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
    invite_hero: null,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
    referred_by: null,
    // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
    excluded_regions: ['GB'],
    ...overrides,
  };
}

describe('RewardsMoneyController', () => {
  let profileId = 'profile-1';
  const getReferralMe = jest.fn();
  const validateReferralCode = jest.fn();
  const registerReferee = jest.fn();
  const getRebateQuote = jest.fn();
  let controller: RewardsMoneyController;
  let isDisabled = false;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    profileId = 'profile-1';
    isDisabled = false;
    getReferralMe.mockReset();
    validateReferralCode.mockReset();
    registerReferee.mockReset();
    getRebateQuote.mockReset();

    const baseMessenger: RootMessenger = new Messenger({
      namespace: MOCK_ANY_NAMESPACE,
    });
    baseMessenger.registerActionHandler(
      'AuthenticationController:getSessionProfile',
      () => Promise.resolve({ profileId }) as never,
    );
    baseMessenger.registerActionHandler(
      'RewardsMoneyDataService:getReferralMe',
      () => getReferralMe() as never,
    );
    baseMessenger.registerActionHandler(
      'RewardsMoneyDataService:validateReferralCode',
      ((code: string) => validateReferralCode(code)) as never,
    );
    baseMessenger.registerActionHandler(
      'RewardsMoneyDataService:registerReferee',
      ((params: { code: string }) => registerReferee(params)) as never,
    );
    baseMessenger.registerActionHandler(
      'RewardsMoneyDataService:getRebateQuote',
      ((body: unknown) => getRebateQuote(body)) as never,
    );

    const messenger = new Messenger<
      'RewardsMoneyController',
      MessengerActions<RewardsMoneyControllerMessenger>,
      MessengerEvents<RewardsMoneyControllerMessenger>,
      typeof baseMessenger
    >({
      namespace: 'RewardsMoneyController',
      parent: baseMessenger,
    });
    baseMessenger.delegate({
      messenger,
      actions: [
        'AuthenticationController:getSessionProfile',
        'RewardsMoneyDataService:getReferralMe',
        'RewardsMoneyDataService:validateReferralCode',
        'RewardsMoneyDataService:registerReferee',
        'RewardsMoneyDataService:getRebateQuote',
      ],
    });

    controller = new RewardsMoneyController({
      messenger,
      isDisabled: () => isDisabled,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not call the data service when Rewards Money is disabled', async () => {
    isDisabled = true;

    await expect(controller.getReferralMe()).rejects.toThrow(
      'Rewards Money is disabled',
    );
    expect(getReferralMe).not.toHaveBeenCalled();
  });

  it('caches referral me per profile and publishes excluded regions', async () => {
    const payload = buildReferralMe();
    getReferralMe.mockResolvedValue(payload);

    await expect(controller.getReferralMe()).resolves.toEqual(payload);
    await expect(controller.getReferralMe()).resolves.toEqual(payload);

    expect(getReferralMe).toHaveBeenCalledTimes(1);
    expect(controller.state.excludedRegions).toEqual(['GB']);
  });

  it('bypasses the cache when forceFresh is set', async () => {
    getReferralMe
      .mockResolvedValueOnce(
        buildReferralMe({
          // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
          excluded_regions: ['GB'],
        }),
      )
      .mockResolvedValueOnce(
        buildReferralMe({
          // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
          excluded_regions: ['CA'],
        }),
      );

    await controller.getReferralMe();
    await controller.getReferralMe({ forceFresh: true });

    expect(getReferralMe).toHaveBeenCalledTimes(2);
    expect(controller.state.excludedRegions).toEqual(['CA']);
  });

  it('passes register HTTP errors through', async () => {
    const error = new RewardsMoneyHttpError(
      'Register referee failed: 403',
      403,
      'own referral code',
    );
    registerReferee.mockRejectedValue(error);

    await expect(controller.registerReferee({ code: 'AB12' })).rejects.toBe(
      error,
    );
  });

  it('drops a referral-me write when the session changes mid-read', async () => {
    getReferralMe.mockImplementation(async () => {
      profileId = 'profile-2';
      return buildReferralMe();
    });

    await expect(controller.getReferralMe()).rejects.toMatchObject({
      data: { sessionChanged: true, profileId: 'profile-2' },
    });
    expect(controller.state.excludedRegions).toBeNull();
  });

  describe('rebate quotes', () => {
    const metabridge = {
      amount: '875000',
      asset: {
        chainId: 1,
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
      },
    };
    const swapsQuote = {
      requestId: 'request-1',
      feeData: { metabridge },
    };
    const swapsResponse = {
      product: 'swaps' as const,
      eligible: true,
      rebateBips: 2000,
      reason: null,
    };
    const perpsResponse = {
      product: 'perps' as const,
      eligible: false,
      rebateBips: 0,
      reason: 'NO_REBATE' as const,
    };

    beforeEach(() => {
      getRebateQuote.mockImplementation((body: { product: string }) =>
        Promise.resolve(
          body.product === 'swaps' ? swapsResponse : perpsResponse,
        ),
      );
    });

    it('does not quote when Rewards Money is disabled', async () => {
      isDisabled = true;

      await expect(controller.getSwapsRebateQuote(swapsQuote)).rejects.toThrow(
        'Rewards Money is disabled',
      );
      await expect(controller.getPerpsRebateQuote()).rejects.toThrow(
        'Rewards Money is disabled',
      );
      expect(getRebateQuote).not.toHaveBeenCalled();
    });

    it('sends only the MetaMask fee leg of the bridge quote', async () => {
      await expect(controller.getSwapsRebateQuote(swapsQuote)).resolves.toEqual(
        swapsResponse,
      );
      expect(getRebateQuote).toHaveBeenCalledWith({
        product: 'swaps',
        quote: { feeData: { metabridge } },
      });
    });

    it('sends a V2 bridge quote fee leg list as it is', async () => {
      const metabridgeV2 = [{ amount: '875000', asset: { symbol: 'USDC' } }];

      await controller.getSwapsRebateQuote({
        feeData: { metabridge: metabridgeV2 },
      });

      expect(getRebateQuote).toHaveBeenCalledWith({
        product: 'swaps',
        quote: { feeData: { metabridge: metabridgeV2 } },
      });
    });

    it('sends a perps rebate quote without a trade unless one is given', async () => {
      const trade = { coin: 'BTC', side: 'BUY' as const, notionalUsd: '100' };

      await expect(controller.getPerpsRebateQuote()).resolves.toEqual(
        perpsResponse,
      );
      await expect(controller.getPerpsRebateQuote(trade)).resolves.toEqual(
        perpsResponse,
      );

      expect(getRebateQuote).toHaveBeenNthCalledWith(1, { product: 'perps' });
      expect(getRebateQuote).toHaveBeenNthCalledWith(2, {
        product: 'perps',
        trade,
      });
    });

    it('sends a builder-deployed perp and a precise notional', async () => {
      const trade = {
        coin: 'xyz:TSLA',
        side: 'SELL' as const,
        notionalUsd: '123456789012345.123456789012345678',
      };

      await controller.getPerpsRebateQuote(trade);

      expect(getRebateQuote).toHaveBeenCalledWith({
        product: 'perps',
        trade,
      });
    });

    it('sends only the trade fields the server accepts', async () => {
      await controller.getPerpsRebateQuote({
        coin: 'ETH',
        side: 'BUY',
        notionalUsd: '50',
        leverage: 5,
      } as PerpsRebateTrade & { leverage: number });

      expect(getRebateQuote).toHaveBeenCalledWith({
        product: 'perps',
        trade: { coin: 'ETH', side: 'BUY', notionalUsd: '50' },
      });
    });

    it.each<[string, PerpsRebateTrade]>([
      ['a spot coin', { coin: '@107', side: 'BUY', notionalUsd: '100' }],
      [
        'an upper-case dex prefix',
        { coin: 'XYZ:TSLA', side: 'BUY', notionalUsd: '100' },
      ],
      ['an empty coin', { coin: '', side: 'BUY', notionalUsd: '100' }],
      [
        'an exponent notional',
        { coin: 'BTC', side: 'BUY', notionalUsd: '1e21' },
      ],
      ['a negative notional', { coin: 'BTC', side: 'BUY', notionalUsd: '-1' }],
      [
        'a notional with 19 decimals',
        { coin: 'BTC', side: 'BUY', notionalUsd: '1.1234567890123456789' },
      ],
      [
        'a notional with 16 integer digits',
        { coin: 'BTC', side: 'BUY', notionalUsd: '1234567890123456' },
      ],
    ])('leaves out a trade with %s', async (_label, trade) => {
      await controller.getPerpsRebateQuote(trade);

      expect(getRebateQuote).toHaveBeenCalledWith({ product: 'perps' });
    });

    it('surfaces a quote refusal without wrapping it', async () => {
      const refusal = new RewardsMoneyRebateQuoteError(
        429,
        'RATE_LIMITED',
        'Too many requests',
        12,
      );
      getRebateQuote.mockRejectedValue(refusal);

      await expect(controller.getSwapsRebateQuote(swapsQuote)).rejects.toBe(
        refusal,
      );
      await expect(controller.getPerpsRebateQuote()).rejects.toBe(refusal);
    });
  });
});
