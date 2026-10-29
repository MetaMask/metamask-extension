import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ReferralMeDto } from '../../../shared/types/rewards-money';

export type RewardsMoneyState = {
  referralMe: ReferralMeDto | null;
  referralMeSettled: boolean;
};

export const initialState: RewardsMoneyState = {
  referralMe: null,
  referralMeSettled: false,
};

const rewardsMoneySlice = createSlice({
  name: 'rewardsMoney',
  initialState,
  reducers: {
    setRewardsMoneyReferralMe: (
      state,
      action: PayloadAction<ReferralMeDto>,
    ) => {
      state.referralMe = action.payload;
      state.referralMeSettled = true;
    },
    setRewardsMoneyReferralMeSettled: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.referralMeSettled = action.payload;
    },
    resetRewardsMoneyReferralMe: () => ({
      referralMe: null,
      referralMeSettled: false,
    }),
  },
});

export const {
  setRewardsMoneyReferralMe,
  setRewardsMoneyReferralMeSettled,
  resetRewardsMoneyReferralMe,
} = rewardsMoneySlice.actions;

export default rewardsMoneySlice.reducer;
