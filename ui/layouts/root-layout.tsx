import React from 'react';
import { Outlet } from 'react-router-dom';
import { ReferralInvite } from '#ui/components/app/rewards/money-referral/ReferralInvite';

export const RootLayout = () => {
  return (
    <div className="flex h-full w-full max-w-[var(--width-max)] flex-col">
      <Outlet />
      <ReferralInvite />
    </div>
  );
};
