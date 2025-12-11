import React from 'react';
import { useLocation } from 'react-router-dom';
import { AppHeader } from '../components/multichain';
import { hideAppHeader, showAppHeader } from '../pages/routes/utils';

export const Header = () => {
  const location = useLocation();

  return (
    <>
      {process.env.REMOVE_GNS
        ? showAppHeader({ location }) && <AppHeader location={location} />
        : !hideAppHeader({ location }) && <AppHeader location={location} />}
    </>
  );
};
