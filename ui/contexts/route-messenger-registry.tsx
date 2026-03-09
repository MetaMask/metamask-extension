import { Messenger } from '@metamask/messenger';
import {
  ROUTE_MESSENGER_NAMESPACE,
  RouteMessenger,
} from '../messengers/route-messenger';
import {
  UIMessenger,
  UIMessengerActions,
  UIMessengerEvents,
} from '../messengers/ui-messenger';
import { Context, createContext } from 'react';
import { NetworkControllerAddNetworkAction } from '@metamask/network-controller';
import { BridgeControllerAction } from '@metamask/bridge-controller';

export const routesWithMessengers = ['/', '/asset/:chainId'] as const;

export const routeMessengerCapabilities = {
  '/': {
    actions: ['NetworkController:addNetwork'],
  },
  '/asset/:chainId': {
    actions: ['BridgeController:trackUnifiedSwapBridgeEvent'],
  },
} satisfies Record<
  (typeof routesWithMessengers)[number],
  { actions?: string[]; events?: string[] }
>;

export const routeMessengerContexts = {
  '/': createContext<Messenger<
    'Home',
    NetworkControllerAddNetworkAction,
    never,
    UIMessenger
  > | null>(null),
  '/asset/:chainId': createContext<Messenger<
    'AssetsChain',
    BridgeControllerAction<'trackUnifiedSwapBridgeEvent'>,
    never,
    UIMessenger
  > | null>(null),
} satisfies Record<
  (typeof routesWithMessengers)[number],
  Context<Messenger<string, any, any, any> | null>
>;
