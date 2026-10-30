import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavBar } from '#ui/components/app/bottom-nav-bar/bottom-nav-bar';
import { SideNav } from '#ui/components/app/side-nav/side-nav';
import { ScrollContainer } from '#ui/contexts/scroll-container';
import { ScrollToTop } from '#ui/contexts/scroll-to-top';
import { useMainNavBars } from '#ui/hooks/useMainNavBars';
import { AppHeader } from '../components/multichain/app-header';

// Main nav routes scroll inside the shell, under the app header.
const NAV_SCROLL_CONTAINER_CLASS =
  'group/shell flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [container-type:scroll-state] [scrollbar-gutter:stable]';
const NAV_MAIN_CLASS = 'grow shrink-0 bg-background-default';

// Other routes under this layout manage their own scrolling and header.
const SCROLL_CONTAINER_CLASS = 'flex min-h-0 flex-1 flex-col';
const MAIN_CLASS = 'flex min-h-0 flex-1 flex-col bg-background-default';

export const MainLayout = () => {
  const { hasNavBar, showSideNav, showBottomNav } = useMainNavBars();

  return (
    <div className="flex h-full min-h-0">
      {showSideNav ? <SideNav /> : null}
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        {hasNavBar ? <AppHeader /> : null}
        <ScrollContainer
          className={
            hasNavBar ? NAV_SCROLL_CONTAINER_CLASS : SCROLL_CONTAINER_CLASS
          }
        >
          <ScrollToTop />
          <main className={hasNavBar ? NAV_MAIN_CLASS : MAIN_CLASS}>
            <Outlet />
          </main>
          {showBottomNav ? <BottomNavBar /> : null}
        </ScrollContainer>
      </div>
    </div>
  );
};
