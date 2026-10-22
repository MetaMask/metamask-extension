import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavBar } from '#ui/components/app/bottom-nav-bar/bottom-nav-bar';
import { SideNav } from '#ui/components/app/side-nav/side-nav';
import { ScrollContainer } from '#ui/contexts/scroll-container';
import { ScrollToTop } from '#ui/contexts/scroll-to-top';
import { useBottomNavBar } from '#ui/hooks/useBottomNavBar';
import { useFullScreenDesign } from '#ui/hooks/useFullScreenDesign';
import { AppHeader } from '../components/multichain/app-header';

export const MainLayout = () => {
  const showBottomNav = useBottomNavBar();
  const isFullScreenDesign = useFullScreenDesign();

  return (
    <div className="flex h-full min-h-0">
      {isFullScreenDesign ? <SideNav /> : null}
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        {showBottomNav || isFullScreenDesign ? <AppHeader /> : null}
        <ScrollContainer
          className={
            showBottomNav
              ? 'group/shell flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [container-type:scroll-state] [scrollbar-gutter:stable]'
              : 'flex min-h-0 flex-1 flex-col'
          }
        >
          <ScrollToTop />
          <main
            className={`max-w-[var(--width-max)] justify-start ${
              showBottomNav
                ? 'grow shrink-0 bg-background-default'
                : 'flex min-h-0 flex-1 flex-col bg-background-default'
            }`}
          >
            <Outlet />
          </main>
          {showBottomNav && !isFullScreenDesign ? <BottomNavBar /> : null}
        </ScrollContainer>
      </div>
    </div>
  );
};
