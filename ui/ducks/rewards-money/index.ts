import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ReferralMeDto } from '../../../shared/types/rewards-money';

export type RewardsMoneyState = {
  pendingReferralCode: string | null;
  referralMe: ReferralMeDto | null;
  referralMeSettled: boolean;
};

export const initialState: RewardsMoneyState = {
  pendingReferralCode: null,
  referralMe: null,
  referralMeSettled: false,
};

const rewardsMoneySlice = createSlice({
  name: 'rewardsMoney',
  initialState,
  reducers: {
    setPendingReferralCode: (state, action: PayloadAction<string | null>) => {
      state.pendingReferralCode = action.payload;
    },
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
    resetRewardsMoneyReferralMe: (state) => {
      state.referralMe = null;
      state.referralMeSettled = false;
    },
  },
});

export const {
  setPendingReferralCode,
  setRewardsMoneyReferralMe,
  setRewardsMoneyReferralMeSettled,
  resetRewardsMoneyReferralMe,
} = rewardsMoneySlice.actions;

export default rewardsMoneySlice.reducer;
