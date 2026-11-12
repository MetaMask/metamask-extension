import React, { createContext, useContext, useMemo } from 'react';

export type AppLayout = {
  /**
   * Whether the app is using its wide layout with side nav. This needs the
   * fullscreen redesign to be enabled and a wide enough viewport.
   */
  isWideLayout: boolean;
};

const DEFAULT_APP_LAYOUT: AppLayout = { isWideLayout: false };

const AppLayoutContext = createContext<AppLayout>(DEFAULT_APP_LAYOUT);

/**
 * Provides the layout decisions made by the app's root layout, so that
 * components below it don't each have to work out which layout is in use.
 *
 * @param props - The component props
 * @param props.isWideLayout - Whether the app is using its wide layout
 * @param props.children - Components that read the app layout
 */
export const AppLayoutProvider = ({
  isWideLayout,
  children,
}: React.PropsWithChildren<AppLayout>) => {
  const value = useMemo(() => ({ isWideLayout }), [isWideLayout]);

  return (
    <AppLayoutContext.Provider value={value}>
      {children}
    </AppLayoutContext.Provider>
  );
};

export const useAppLayout = (): AppLayout => useContext(AppLayoutContext);
