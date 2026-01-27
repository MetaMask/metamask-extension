import React, { type ReactNode } from 'react';
import cn from 'classnames';

const width = 'max-w-[clamp(var(--width-sm),85vw,var(--width-max))]';
const sidepanel = 'group-[.app--sidepanel]:max-w-[var(--width-max-sidepanel)]';

export const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className={cn('w-full h-full flex flex-col', width, sidepanel)}>
      {children}
    </div>
  );
};
