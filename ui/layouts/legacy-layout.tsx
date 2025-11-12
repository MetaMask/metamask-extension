import React, { type ReactNode } from 'react';

/**
 * Temporary layout until we migrate each page that uses this
 * @param children - Child component to render
 * @returns
 */
export const LegacyLayout = ({ children }: { children: ReactNode }) => {
  return <div className="mm-box main-container-wrapper">{children}</div>;
};
