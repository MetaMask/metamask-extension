import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavBar } from '#ui/components/app/bottom-nav-bar/bottom-nav-bar';
import { ScrollContainer } from '#ui/contexts/scroll-container';
import { ScrollToTop } from '#ui/contexts/scroll-to-top';
import { useBottomNavBar } from '#ui/hooks/useBottomNavBar';
import { AppHeader } from '../components/multichain/app-header';

export const MainLayout = () => {
  const showNavbar = useBottomNavBar();

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showNavbar ? <AppHeader /> : null}
      <ScrollContainer
        className={
          showNavbar
            ? 'group/shell flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [container-type:scroll-state] [scrollbar-gutter:stable]'
            : 'flex min-h-0 flex-1 flex-col'
        }
      >
        <ScrollToTop />
        <main
          className={
            showNavbar
              ? 'grow shrink-0 bg-background-default'
              : 'flex min-h-0 flex-1 flex-col bg-background-default'
          }
        >
          <Outlet />
        </main>
        {showNavbar ? <BottomNavBar /> : null}
      </ScrollContainer>
    </div>
  );
};
