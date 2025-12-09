import React from 'react';
import { useLocation } from 'react-router-dom';
import { AppHeader } from '../components/multichain';
import { hideAppHeader } from '../pages/routes/utils';
import { removeGns } from './config';

// Note: Remove this component once REMOVE_GNS flag is resolved

export const Header = () => {
  const location = useLocation();

  if (removeGns || hideAppHeader({ location })) {
    return null;
  }

  return <AppHeader location={location} />;
};
