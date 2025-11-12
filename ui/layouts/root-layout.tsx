import React, { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AppHeader } from '../components/multichain';
import { hideAppHeader, showAppHeader } from '../pages/routes/utils';

export const RootLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  return (
    <div className="w-full sm:max-w-[576px] sm:mx-auto xl:max-w-[1280px]">
      {process.env.REMOVE_GNS
        ? showAppHeader({ location }) && <AppHeader location={location} />
        : !hideAppHeader({ location }) && <AppHeader location={location} />}
      {children}
    </div>
  );
};
