import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavBar } from '../components/app/bottom-nav-bar/bottom-nav-bar';
import { AppHeader } from '../components/multichain/app-header';
import { ScrollContainer } from '../contexts/scroll-container';
import { useBottomNavBar } from '../hooks/useBottomNavBar';

export const MainLayout = () => {
  const showChrome = useBottomNavBar();

  if (showChrome) {
    return (
      <div className="flex h-screen flex-col">
        <AppHeader />
        <ScrollContainer className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [container-type:scroll-state] [scrollbar-gutter:stable]">
          <main className="grow shrink-0">
            <Outlet />
          </main>
          <BottomNavBar />
        </ScrollContainer>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
};
