import React from 'react';
import classnames from 'clsx';
import { Outlet } from 'react-router-dom';
import { BottomNavBar } from '#ui/components/app/bottom-nav-bar/bottom-nav-bar';
import { SideNav } from '#ui/components/app/side-nav/side-nav';
import { ScrollContainer } from '#ui/contexts/scroll-container';
import { ScrollToTop } from '#ui/contexts/scroll-to-top';
import { useMainNavBars } from '#ui/hooks/useMainNavBars';
import { AppHeader } from '../components/multichain/app-header';

const FILL_CLASS = 'flex min-h-0 flex-1 flex-col';

export const MainLayout = () => {
  const { hasNavBar, showSideNav, showBottomNav } = useMainNavBars();

  // Main nav routes scroll inside the shell, under the app header
  return (
    <div className="flex h-full min-h-0">
      {showSideNav ? <SideNav /> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        {hasNavBar ? <AppHeader /> : null}
        <ScrollContainer
          className={classnames(
            FILL_CLASS,
            hasNavBar &&
              'group/shell overflow-y-auto overscroll-contain [container-type:scroll-state] [scrollbar-gutter:stable]',
          )}
        >
          <ScrollToTop />
          <main
            className={classnames(
              'bg-background-default',
              hasNavBar ? 'grow shrink-0' : FILL_CLASS,
            )}
          >
            <Outlet />
          </main>
          {showBottomNav ? <BottomNavBar /> : null}
        </ScrollContainer>
      </div>
    </div>
  );
};
