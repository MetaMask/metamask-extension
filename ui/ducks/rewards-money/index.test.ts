import type { ReferralMeDto } from '../../../shared/types/rewards-money';
import reducer, {
  initialState,
  resetRewardsMoneyReferralMe,
  setRewardsMoneyReferralMe,
  setRewardsMoneyReferralMeSettled,
  type RewardsMoneyState,
} from '.';

const referralMe = {
  role: 'NONE',
  variant: 'NONE',
  /* eslint-disable @typescript-eslint/naming-convention -- money API fields */
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
  excluded_regions: ['US'],
  /* eslint-enable @typescript-eslint/naming-convention */
} as ReferralMeDto;

describe('rewardsMoney slice', () => {
  it('returns the initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(initialState);
  });

  it('stores a settled referral-me payload', () => {
    const state = reducer(initialState, setRewardsMoneyReferralMe(referralMe));

    expect(state).toStrictEqual({
      referralMe,
      referralMeSettled: true,
    });
  });

  it('marks a read settled without a payload', () => {
    const state = reducer(initialState, setRewardsMoneyReferralMeSettled(true));

    expect(state.referralMe).toBeNull();
    expect(state.referralMeSettled).toBe(true);
  });

  it('resets to the initial state', () => {
    const populated: RewardsMoneyState = {
      referralMe,
      referralMeSettled: true,
    };

    expect(reducer(populated, resetRewardsMoneyReferralMe())).toStrictEqual(
      initialState,
    );
  });
});
