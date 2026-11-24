import React, { useSyncExternalStore } from 'react';
import { Outlet } from 'react-router-dom';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '@metamask/design-system-react';
import { BottomNavBar } from '#ui/components/app/bottom-nav-bar/bottom-nav-bar';
import { SideNav } from '#ui/components/app/side-nav/side-nav';
import { ScrollContainer } from '#ui/contexts/scroll-container';
import { ScrollToTop } from '#ui/contexts/scroll-to-top';
import { useI18nContext } from '#ui/hooks/useI18nContext.js';
import { useAppLayout } from '../contexts/app-layout';
import { AppHeader } from '../components/multichain/app-header';

const useIsOnline = () => {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener('online', callback);
      window.addEventListener('offline', callback);
      return () => {
        window.removeEventListener('online', callback);
        window.removeEventListener('offline', callback);
      };
    },
    () => navigator.onLine,
    () => true,
  );
};

export const MainLayout = () => {
  const { isWideLayout } = useAppLayout();
  const t = useI18nContext();
  const isOnline = useIsOnline();

  return (
    <div className="flex h-full min-h-0">
      {isWideLayout ? <SideNav /> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        {!isOnline && (
          <BannerAlert severity={BannerAlertSeverity.Warning}>
            {t('offlineBanner')}
          </BannerAlert>
        )}
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
