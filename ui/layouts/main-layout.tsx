import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNavBar } from '#ui/components/app/bottom-nav-bar/bottom-nav-bar';
import { ScrollContainer } from '#ui/contexts/scroll-container';
import { useBottomNavBar } from '#ui/hooks/useBottomNavBar';
import { AppHeader } from '../components/multichain/app-header';

export const MainLayout = () => {
  const { pathname } = useLocation();
  const showNavbar = useBottomNavBar();

  if (showNavbar) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <AppHeader />
        <ScrollContainer
          key={pathname}
          className="group/shell flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [container-type:scroll-state] [scrollbar-gutter:stable]"
        >
          <main className="grow shrink-0 bg-background-default">
            <Outlet />
          </main>
          <BottomNavBar />
        </ScrollContainer>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <main className="flex min-h-0 flex-1 flex-col bg-background-default">
        <Outlet />
      </main>
    </div>
  );
};
