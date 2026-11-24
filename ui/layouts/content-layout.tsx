import React from 'react';
import { Outlet } from 'react-router-dom';
import { ScrollContainer } from '#ui/contexts/scroll-container';
import { ScrollToTop } from '#ui/contexts/scroll-to-top';

export const ContentLayout = () => {
  return (
    <ScrollContainer className="flex h-full min-h-0 min-w-0 flex-col">
      <ScrollToTop />
      <main className="flex min-h-0 flex-1 flex-col bg-background-default">
        <Outlet />
      </main>
    </ScrollContainer>
  );
};
