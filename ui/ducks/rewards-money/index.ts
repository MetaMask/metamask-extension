import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  PendingReferral,
  ReferralMeDto,
} from '../../../shared/types/rewards-money';

export type RewardsMoneyState = {
  pendingReferral: PendingReferral | null;
  referralMe: ReferralMeDto | null;
  referralMeSettled: boolean;
};

export const initialState: RewardsMoneyState = {
  pendingReferral: null,
  referralMe: null,
  referralMeSettled: false,
};

const rewardsMoneySlice = createSlice({
  name: 'rewardsMoney',
  initialState,
  reducers: {
    setPendingReferral: (
      state,
      action: PayloadAction<PendingReferral | null>,
    ) => {
      state.pendingReferral = action.payload;
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
  setPendingReferral,
  setRewardsMoneyReferralMe,
  setRewardsMoneyReferralMeSettled,
  resetRewardsMoneyReferralMe,
} = rewardsMoneySlice.actions;

export default rewardsMoneySlice.reducer;
