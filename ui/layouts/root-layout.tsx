import React, { type ReactNode } from 'react';

export const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full sm:max-w-[576px] sm:mx-auto xl:max-w-[1280px]">
      {children}
    </div>
  );
};
