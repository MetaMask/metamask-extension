import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  type MessengerActions,
  type MessengerEvents,
  type MockAnyNamespace,
} from '@metamask/messenger';
import { RewardsMoneyHttpError } from './rewards-money-data-service';
import type { ReferralMeDto } from '../../../../shared/types/rewards-money';
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
    invite_hero: null,
    referred_by: null,
    excluded_regions: ['GB'],
    ...overrides,
  };
}

describe('RewardsMoneyController', () => {
  let profileId = 'profile-1';
  const getReferralMe = jest.fn();
  const validateReferralCode = jest.fn();
  const registerReferee = jest.fn();
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
      .mockResolvedValueOnce(buildReferralMe({ excluded_regions: ['GB'] }))
      .mockResolvedValueOnce(buildReferralMe({ excluded_regions: ['CA'] }));

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
});
