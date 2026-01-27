//========
// This file defines a context that gives us convenient "global" access to the
// UI messenger "globally". We use it when defining messengers for routes.
//========

import React, { createContext, ReactNode, useContext } from 'react';
import { UIMessenger } from '../messengers/ui-messenger';

/**
 * Context that holds the UI messenger.
 */
export const UIMessengerContext = createContext<UIMessenger | null>(null);

/**
 * Provides the UI messenger to child components via context.
 *
 * @param args - The arguments to this function.
 * @param args.messenger - The UI messenger to load into context.
 * @param args.children - The components to wrap.
 */
export const UIMessengerProvider = ({
  messenger,
  children,
}: {
  messenger: UIMessenger;
  children: ReactNode;
}) => {
  return (
    <UIMessengerContext.Provider value={messenger}>
      {children}
    </UIMessengerContext.Provider>
  );
};

/**
 * Hook to access the UI messenger from context.
 *
 * Used to derive team-level and route-level messengers.
 *
 * @returns The UI messenger in context.
 * @throws If the UI messenger is not available (e.g., hook is used outside of
 * the provider).
 */
export function useUIMessenger(): UIMessenger {
  const messenger = useContext(UIMessengerContext);

  if (!messenger) {
    throw new Error('useUIMessenger must be used within a UIMessengerProvider');
  }

  return messenger;
}
