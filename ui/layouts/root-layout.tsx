import React from 'react';
import { Outlet } from 'react-router-dom';

export const RootLayout = () => {
  return (
    <div className="flex h-full w-full max-w-[var(--width-max)] flex-col">
      <Outlet />
    </div>
  );
};
