import React, { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AppHeader } from '../components/multichain';
import { hideAppHeader, showAppHeader } from '../pages/routes/utils';

/**
 * Temporary layout until we migrate each page that uses this.
 *
 * @param props - Props
 * @param props.children - Child component to render
 * @returns Component wrapped in legacy structure
 */
export const LegacyLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  return (
    <>
      {process.env.REMOVE_GNS
        ? showAppHeader({ location }) && <AppHeader location={location} />
        : !hideAppHeader({ location }) && <AppHeader location={location} />}

      <div className="mm-box main-container-wrapper">{children}</div>
    </>
  );
};
