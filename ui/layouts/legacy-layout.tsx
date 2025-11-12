import React, { type ReactNode } from 'react';
import { Header } from './header';

/**
 * Temporary layout until we migrate each page that uses this.
 *
 * @param props - Props
 * @param props.children - Child component to render
 * @returns Component wrapped in legacy structure
 */
export const LegacyLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Header />

      <div className="mm-box main-container-wrapper">{children}</div>
    </>
  );
};
