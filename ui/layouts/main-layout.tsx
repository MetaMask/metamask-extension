import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNavBar } from '#ui/components/app/bottom-nav-bar/bottom-nav-bar';
import { SideNav } from '#ui/components/app/side-nav/side-nav';
import { ScrollContainer } from '#ui/contexts/scroll-container';
import { ScrollToTop } from '#ui/contexts/scroll-to-top';
import { useAppLayout } from '../contexts/app-layout';
import { AppHeader } from '../components/multichain/app-header';

export const MainLayout = () => {
  const { isWideLayout } = useAppLayout();

  return (
    <div className="flex h-full min-h-0">
      {isWideLayout ? <SideNav /> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <ScrollContainer className="group/shell flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [container-type:scroll-state] [scrollbar-gutter:stable]">
          <ScrollToTop />
          <main className="grow shrink-0 bg-background-default">
            <Outlet />
          </main>
          {isWideLayout ? null : <BottomNavBar />}
        </ScrollContainer>
      </div>
    </div>
  );
};
