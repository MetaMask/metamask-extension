import {
  Caip25CaveatType,
  Caip25CaveatValue,
  Caip25EndowmentPermissionName,
  getEthAccounts,
  getPermittedAccountsForScopes,
  getPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import type {
  PermissionConstraint,
  PermissionControllerSubjects,
} from '@metamask/permission-controller';
import type { CaipChainId } from '@metamask/utils';
import { createSelector } from 'reselect';

/**
 * This file contains selectors for PermissionController selector event
 * subscriptions, used to detect whenever a subject's accounts change so that
 * we can notify the subject via the `accountsChanged` provider event.
 */

export type PermissionControllerState = {
  subjects: PermissionControllerSubjects<PermissionConstraint>;
};

/**
 * @param state - The PermissionController state.
 * @returns The PermissionController subjects.
 */
const getSubjects = (state: PermissionControllerState) => state.subjects;

/**
 * Retrieves the CAIP-25 caveat value from a PermissionController subject, if present.
 *
 * @param subject - A subject from the PermissionController state.
 * @returns The CAIP-25 caveat value, or `undefined` if not found.
 */
function getCaip25CaveatValue(
  subject: PermissionControllerSubjects<PermissionConstraint>[string],
): Caip25CaveatValue | undefined {
  const caveats =
    subject.permissions?.[Caip25EndowmentPermissionName]?.caveats ?? [];
  const caveat = caveats.find(({ type }) => type === Caip25CaveatType);
  return caveat ? (caveat.value as Caip25CaveatValue) : undefined;
}

/**
 * Get the permitted accounts for each subject, keyed by origin.
 * The values of the returned map are immutable values from the
 * PermissionController state.
 *
 * @returns The current origin:accounts[] map.
 */
export const getPermittedAccountsByOrigin = createSelector(
  getSubjects,
  (subjects): Map<string, string[]> => {
    const originToAccountsMap = new Map<string, string[]>();
    Object.values(subjects).forEach((subject) => {
      const caveatValue = getCaip25CaveatValue(subject);
      if (caveatValue) {
        const ethAccounts = getEthAccounts(caveatValue);
        originToAccountsMap.set(subject.origin, ethAccounts);
      }
    });
    return originToAccountsMap;
  },
);

/**
 * Get the permitted accounts for the given scopes by origin
 *
 * @param state - The PermissionController state
 * @param scopes - The scopes to get the permitted accounts for
 * @returns A map of origins to permitted accounts for the given scopes
 */
export const getPermittedAccountsForScopesByOrigin = createSelector(
  getSubjects,
  (_: PermissionControllerState, scopes: CaipChainId[]) => scopes,
  (subjects, scopes): Map<string, string[]> => {
    const originToAccountsMap = new Map<string, string[]>();
    Object.values(subjects).forEach((subject) => {
      const caveatValue = getCaip25CaveatValue(subject);
      if (caveatValue) {
        const scopeAccounts = getPermittedAccountsForScopes(
          caveatValue,
          scopes,
        );

        if (scopeAccounts.length > 0) {
          originToAccountsMap.set(subject.origin, scopeAccounts);
        }
      }
    });
    return originToAccountsMap;
  },
);

/**
 * Get the origins with a given session property.
 *
 * @param state - The PermissionController state
 * @param property - The property to check for
 * @returns An object with keys of origins and values of session properties
 */
export const getOriginsWithSessionProperty = createSelector(
  getSubjects,
  (_: PermissionControllerState, property: string) => property,
  (subjects, property): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    Object.values(subjects).forEach((subject) => {
      const caveatValue = getCaip25CaveatValue(subject);
      const sessionProperty = caveatValue?.sessionProperties?.[property];
      if (sessionProperty !== undefined) {
        result[subject.origin] = sessionProperty;
      }
    });

    return result;
  },
);

/**
 * Get the authorized CAIP-25 scopes for each subject, keyed by origin.
 * The values of the returned map are immutable values from the
 * PermissionController state.
 *
 * @returns The current origin:authorization map.
 */
export const getAuthorizedScopesByOrigin = createSelector(
  getSubjects,
  (subjects): Map<string, Caip25CaveatValue> => {
    return Object.values(subjects).reduce(
      (originToAuthorizationsMap, subject) => {
        const caveatValue = getCaip25CaveatValue(subject);
        if (caveatValue) {
          originToAuthorizationsMap.set(subject.origin, caveatValue);
        }
        return originToAuthorizationsMap;
      },
      new Map<string, Caip25CaveatValue>(),
    );
  },
);

/**
 * Get the permitted chains for each subject, keyed by origin.
 * The values of the returned map are immutable values from the
 * PermissionController state.
 *
 * @returns The current origin:chainIds[] map.
 */
export const getPermittedChainsByOrigin = createSelector(
  getSubjects,
  (subjects): Map<string, string[]> => {
    return Object.values(subjects).reduce((originToChainsMap, subject) => {
      const caveatValue = getCaip25CaveatValue(subject);
      if (caveatValue) {
        const ethChainIds = getPermittedEthChainIds(caveatValue);
        originToChainsMap.set(subject.origin, ethChainIds);
      }
      return originToChainsMap;
    }, new Map<string, string[]>());
  },
);
