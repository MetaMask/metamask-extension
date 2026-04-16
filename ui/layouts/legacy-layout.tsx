import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Temporary layout until we migrate each page that uses this.
 *
 * @returns Component wrapped in legacy structure
 */
export const LegacyLayout = () => {
  return (
    <div className="mm-box main-container-wrapper">
      <Outlet />
    </div>
  );
};
