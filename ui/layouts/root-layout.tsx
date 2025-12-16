import React, { type ReactNode } from 'react';
import cn from 'classnames';
import { Header } from './header';
import { removeGns } from './config';

const width = 'max-w-[clamp(var(--width-sm),85vw,var(--width-max))]';
const sidepanel = 'group-[.app--sidepanel]:max-w-[var(--width-max-sidepanel)]';

export const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className={cn('w-full h-full flex flex-col', width, sidepanel)}>
      {removeGns ? (
        <>{children}</>
      ) : (
        // Note: Remove this once REMOVE_GNS flag is resolved
        <>
          <Header />

          <div className="flex flex-col flex-1 min-h-0">{children}</div>
        </>
      )}
    </div>
  );
};
