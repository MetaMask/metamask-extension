import React, { type ReactNode } from 'react';
import { Header } from './header';

export const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="w-full h-full flex flex-col max-w-[clamp(576px,85vw,798px)] sm:mx-auto">
      <Header />

      {/* Note: Consider a sticky header instead of overflow */}
      <div className="flex flex-col flex-1 overflow-y-auto">{children}</div>
    </div>
  );
};
