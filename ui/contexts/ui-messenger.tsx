/**
 * UI messenger context — provides the UIMessenger instance to the component
 * tree. RouteWithMessenger consumes this to create per-route child messengers.
 *
 * @see {@link https://github.com/MetaMask/metamask-extension/compare/main...messenger-ui-integration-prototype}
 */
import { createContext, useContext } from 'react';
import type { UIMessenger } from '../messengers/ui-messenger';

const UIMessengerContext = createContext<UIMessenger | null>(null);

export const UIMessengerProvider = UIMessengerContext.Provider;

export function useUIMessenger(): UIMessenger {
  const messenger = useContext(UIMessengerContext);

  if (!messenger) {
    throw new Error(
      'useUIMessenger must be used within a UIMessengerProvider.',
    );
  }

  return messenger;
}
