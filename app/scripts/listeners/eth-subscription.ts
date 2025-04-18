import {
  Caip25CaveatValue,
  getSessionScopes,
  NormalizedScopeObject,
} from '@metamask/chain-agnostic-permission';
import { CaipChainId } from '@metamask/utils';
import { uniq } from 'lodash';

export const handlePermissionControllerStateChangeEthSubscription = (
  currentValue: Map<string, Caip25CaveatValue>,
  previousValue: Map<string, Caip25CaveatValue>,
  hooks: {
    getNonEvmSupportedMethods: (scope: string) => string[];
    removeMultichainApiEthSubscriptionMiddleware: (key: {
      scope: string;
      origin: string;
      tabId?: string;
    }) => void;
    addMultichainApiEthSubscriptionMiddleware: (key: {
      scope: string;
      origin: string;
    }) => void;
  },
) => {
  const scopeObjectHasEthSub = (scopeObject: NormalizedScopeObject) => {
    if (!scopeObject) {
      return false;
    }
    return (
      scopeObject.notifications.includes('eth_subscription') &&
      scopeObject.methods.includes('eth_subscribe')
    );
  };

  const origins = uniq([...previousValue.keys(), ...currentValue.keys()]);
  origins.forEach((origin: string) => {
    const previousCaveatValue = previousValue.get(origin);
    const currentCaveatValue = currentValue.get(origin);

    const previousSessionScopes = previousCaveatValue
      ? getSessionScopes(previousCaveatValue, {
          getNonEvmSupportedMethods: hooks.getNonEvmSupportedMethods,
        })
      : null;

    const currentSessionScopes = currentCaveatValue
      ? getSessionScopes(currentCaveatValue, {
          getNonEvmSupportedMethods: hooks.getNonEvmSupportedMethods,
        })
      : null;

    if (!previousSessionScopes && currentSessionScopes) {
      Object.entries(currentSessionScopes).forEach(([scope, scopeObject]) => {
        if (scopeObjectHasEthSub(scopeObject)) {
          hooks.addMultichainApiEthSubscriptionMiddleware({
            scope,
            origin,
          });
        }
      });
    }

    if (previousSessionScopes && !currentSessionScopes) {
      Object.entries(previousSessionScopes).forEach(([scope, scopeObject]) => {
        if (scopeObjectHasEthSub(scopeObject)) {
          hooks.removeMultichainApiEthSubscriptionMiddleware({
            scope,
            origin,
          });
        }
      });
    }

    if (previousSessionScopes && currentSessionScopes) {
      const scopes = uniq([
        ...Object.keys(previousSessionScopes),
        ...Object.keys(currentSessionScopes),
      ]);

      scopes.forEach((scope: string) => {
        const previousEthSub = scopeObjectHasEthSub(
          previousSessionScopes[scope as CaipChainId],
        );
        const currentEthSub = scopeObjectHasEthSub(
          currentSessionScopes[scope as CaipChainId],
        );

        if (!previousEthSub && currentEthSub) {
          hooks.addMultichainApiEthSubscriptionMiddleware({
            scope,
            origin,
          });
        }
        if (previousEthSub && !currentEthSub) {
          hooks.removeMultichainApiEthSubscriptionMiddleware({
            scope,
            origin,
          });
        }
      });
    }
  });
};
