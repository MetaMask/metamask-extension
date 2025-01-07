import { ApprovalType } from '@metamask/controller-utils';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/snaps-rpc-methods';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { SnapId } from '@metamask/snaps-sdk';
import type { PermissionLog } from '@metamask/permission-log-controller';
import type {
  PermissionConstraint,
  PermissionSubjectEntry,
} from '@metamask/permission-controller';
import type { Json } from '@metamask/utils';
import { isNullOrUndefined } from '@metamask/utils';
import { CaveatTypes } from '../../shared/constants/permissions';
// eslint-disable-next-line import/no-restricted-paths
import { PermissionNames } from '../../app/scripts/controllers/permissions';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import { MetaMaskSliceControllerState } from '../ducks/metamask/metamask';
import { MetaMaskReduxState } from '../store/store';
import { ApprovalsMetaMaskState, getApprovalRequestsByType } from './approvals';
import {
  getMetaMaskAccountsOrdered,
  getOriginOfCurrentTab,
  getTargetSubjectMetadata,
} from './selectors';
import type { ConnectedSubject } from './selectors.types';
import { getInternalAccounts, getSelectedInternalAccount } from './accounts';

// selectors

/**
 * Deep equal selector to get the permission subjects object.
 *
 * @param {object} state - The current state.
 * @returns {object} The permissions subjects object.
 */
export const getPermissionSubjectsDeepEqual = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'PermissionController'>) =>
    state.metamask.PermissionController.subjects ?? {},
  (subjects) => subjects,
);

/**
 * Deep equal selector to get the subject metadata object.
 *
 * @param {object} state - The current state.
 * @returns {object} The subject metadata object.
 */
export const getSubjectMetadataDeepEqual = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'SubjectMetadataController'>) =>
    state.metamask.SubjectMetadataController.subjectMetadata,
  (metadata) => metadata,
);

/**
 * Selector to get the permission subjects object.
 *
 * @param state - The current state.
 * @returns The permissions subjects object.
 */
export function getPermissionSubjects(
  state: MetaMaskSliceControllerState<'PermissionController'>,
) {
  return state.metamask.PermissionController.subjects ?? {};
}

/**
 * Selects the permitted accounts from the eth_accounts permission given state
 * and an origin.
 *
 * @param state - The current state.
 * @param origin - The origin/subject to get the permitted accounts for.
 * @returns An empty array or an array of accounts.
 */
export function getPermittedAccounts(
  state: Parameters<
    typeof getAccountsFromPermission & typeof subjectSelector
  >[0],
  origin: string,
) {
  return getAccountsFromPermission(
    getAccountsPermissionFromSubject(subjectSelector(state, origin)),
  );
}

export function getPermittedChains(
  state: MetaMaskSliceControllerState<'PermissionController'>,
  origin: string,
) {
  return getChainsFromPermission(
    getChainsPermissionFromSubject(subjectSelector(state, origin)),
  );
}

/**
 * Selects the permitted accounts from the eth_accounts permission for the
 * origin of the current tab.
 *
 * @param state - The current state.
 * @returns An empty array or an array of accounts.
 */
export function getPermittedAccountsForCurrentTab(
  state: Parameters<typeof getPermittedAccounts>[0] &
    Parameters<typeof getOriginOfCurrentTab>[0],
) {
  return getPermittedAccounts(state, getOriginOfCurrentTab(state));
}

export function getPermittedAccountsForSelectedTab(
  state: Parameters<typeof getPermittedAccounts>[0],
  activeTab: MetaMaskReduxState['activeTab'],
) {
  return getPermittedAccounts(state, activeTab.origin);
}

export function getPermittedChainsForCurrentTab(
  state: Parameters<typeof getPermittedAccounts>[0] &
    Parameters<typeof getOriginOfCurrentTab>[0],
) {
  return getPermittedAccounts(state, getOriginOfCurrentTab(state));
}

export function getPermittedChainsForSelectedTab(
  state: Parameters<typeof getPermittedChains>[0],
  activeTab: MetaMaskReduxState['activeTab'],
) {
  return getPermittedChains(state, activeTab.origin);
}

/**
 * Returns a map of permitted accounts by origin for all origins.
 *
 * @param state - The current state.
 * @returns Permitted accounts by origin.
 */
export const getPermittedAccountsByOrigin = createDeepEqualSelector(
  getPermissionSubjects,
  (subjects) => {
    return Object.keys(subjects).reduce<Record<string, string[]>>(
      (acc, subjectKey) => {
        const accounts = getAccountsFromSubject(subjects[subjectKey]);
        if (accounts.length > 0) {
          acc[subjectKey] = accounts;
        }
        return acc;
      },
      {},
    );
  },
);

export const getPermittedChainsByOrigin = createDeepEqualSelector(
  getPermissionSubjects,
  (subjects) => {
    return Object.keys(subjects).reduce<Record<string, Json[]>>(
      (acc, subjectKey) => {
        const chains = getChainsFromSubject(subjects[subjectKey]);
        if (chains.length > 0) {
          acc[subjectKey] = chains;
        }
        return acc;
      },
      {},
    );
  },
);

export function getSubjectMetadata(
  state: MetaMaskSliceControllerState<'SubjectMetadataController'>,
) {
  return state.metamask.SubjectMetadataController.subjectMetadata;
}

/**
 * Returns an array of connected subject objects, with the following properties:
 * - extensionId
 * - key (i.e. origin)
 * - name
 * - icon
 *
 * @param state - The current state.
 * @returns {Array<ConnectedSubject>} An array of connected subject objects.
 */
export const getConnectedSubjectsForSelectedAddress = createDeepEqualSelector(
  getSelectedInternalAccount,
  getPermissionSubjects,
  getSubjectMetadata,
  (selectedInternalAccount, subjects, subjectMetadata) => {
    const connectedSubjects: ConnectedSubject[] = [];

    Object.entries(subjects).forEach(([subjectKey, subjectValue]) => {
      const exposedAccounts = getAccountsFromSubject(subjectValue);
      if (
        !exposedAccounts.find(
          (address) => address === selectedInternalAccount.address,
        )
      ) {
        return;
      }

      const { extensionId, name, iconUrl } = subjectMetadata[subjectKey] ?? {};

      connectedSubjects.push({
        extensionId,
        origin: subjectKey,
        name,
        iconUrl,
      });
    });

    return connectedSubjects;
  },
);

/**
 * Retrieves the connected subjects for all addresses.
 *
 * @returns The connected subjects for all addresses.
 */
export const getConnectedSubjectsForAllAddresses = createDeepEqualSelector(
  getPermissionSubjects,
  getSubjectMetadata,
  (subjects, subjectMetadata) => {
    const accountsToConnections: Record<string, ConnectedSubject[]> = {};
    Object.entries(subjects).forEach(([subjectKey, subjectValue]) => {
      const exposedAccounts = getAccountsFromSubject(subjectValue);
      exposedAccounts.forEach((address) => {
        if (!accountsToConnections[address]) {
          accountsToConnections[address] = [];
        }
        const metadata = subjectMetadata[subjectKey];
        accountsToConnections[address].push({
          ...metadata,
          origin: subjectKey,
        });
      });
    });

    return accountsToConnections;
  },
);

export const getSubjectsWithPermission = createDeepEqualSelector(
  (
    state: Parameters<typeof getTargetSubjectMetadata>[0],
    permissionName: string,
  ) => ({ state, permissionName }),
  getPermissionSubjects,
  ({ state, permissionName }, subjects) => {
    const connectedSubjects: ConnectedSubject[] = [];

    Object.entries(subjects).forEach(([origin, { permissions }]) => {
      if (permissions[permissionName]) {
        const { extensionId, name, iconUrl } =
          getTargetSubjectMetadata(state, origin) ?? {};

        connectedSubjects.push({
          extensionId,
          origin,
          name,
          iconUrl,
        });
      }
    });
    return connectedSubjects;
  },
);

export const getSubjectsWithSnapPermission = createDeepEqualSelector(
  (state: Parameters<typeof getTargetSubjectMetadata>[0], snapId: SnapId) => ({
    state,
    snapId,
  }),
  getPermissionSubjects,
  ({ state, snapId }, subjects) => {
    return Object.entries(subjects)
      .filter(([_origin, { permissions }]) => {
        const { caveats } = permissions[WALLET_SNAP_PERMISSION_KEY];
        if (!caveats || !Array.isArray(caveats) || !caveats.length) {
          return false;
        }
        return (
          caveats[0].value as { [id: SnapId]: Json } & Record<string, Json>
        )?.[snapId];
      })
      .map(([origin, _subject]) => {
        const { extensionId, name, iconUrl } =
          getTargetSubjectMetadata(state, origin) ?? {};
        return {
          extensionId,
          origin,
          name,
          iconUrl,
        };
      });
  },
);

/**
 * Returns an object mapping addresses to objects mapping origins to connected
 * subject info. Subject info objects have the following properties:
 * - iconUrl
 * - name
 *
 * @param state - The current state.
 * @returns A mapping of addresses to a mapping of origins to
 * connected subject info.
 */
export const getAddressConnectedSubjectMap = createDeepEqualSelector(
  getSubjectMetadata,
  getPermittedAccountsByOrigin,
  (subjectMetadata, accountsMap) => {
    const addressConnectedIconMap: Record<
      string,
      Partial<ConnectedSubject>
    > = {};

    Object.keys(accountsMap).forEach((subjectKey) => {
      const { iconUrl, name } = subjectMetadata[subjectKey] ?? {};

      accountsMap[subjectKey].forEach((address) => {
        const nameToRender = name ?? subjectKey;

        addressConnectedIconMap[address] = addressConnectedIconMap[address]
          ? {
              ...addressConnectedIconMap[address],
              [subjectKey]: { iconUrl, name: nameToRender },
            }
          : { [subjectKey]: { iconUrl, name: nameToRender } };
      });
    });

    return addressConnectedIconMap;
  },
);

export const isAccountConnectedToCurrentTab = createDeepEqualSelector(
  getPermittedAccountsForCurrentTab,
  (_state: Record<never, never>, address: string) => address,
  (permittedAccounts, address) => {
    return permittedAccounts.some((account) => account === address);
  },
);

// selector helpers

function getAccountsFromSubject(
  subject: PermissionSubjectEntry<PermissionConstraint>,
) {
  return getAccountsFromPermission(getAccountsPermissionFromSubject(subject));
}

function getAccountsPermissionFromSubject(
  subject: Partial<PermissionSubjectEntry<PermissionConstraint>> = {},
) {
  return subject.permissions?.eth_accounts ?? {};
}

function getChainsFromSubject(
  subject: PermissionSubjectEntry<PermissionConstraint>,
) {
  return getChainsFromPermission(getChainsPermissionFromSubject(subject));
}

function getChainsPermissionFromSubject(
  subject: Partial<PermissionSubjectEntry<PermissionConstraint>> = {},
): Partial<PermissionConstraint> {
  return !isNullOrUndefined(subject.permissions) &&
    typeof subject.permissions === 'object' &&
    PermissionNames.permittedChains in subject.permissions
    ? subject.permissions[PermissionNames.permittedChains] ?? {}
    : {};
}

function getAccountsFromPermission(
  accountsPermission: Partial<PermissionConstraint>,
) {
  const accountsCaveat = getAccountsCaveatFromPermission(accountsPermission);
  return accountsCaveat && Array.isArray(accountsCaveat.value)
    ? (accountsCaveat.value as string[])
    : [];
}

function getChainsFromPermission(
  chainsPermission: Partial<PermissionConstraint>,
) {
  const chainsCaveat = getChainsCaveatFromPermission(chainsPermission);
  return chainsCaveat && Array.isArray(chainsCaveat.value)
    ? chainsCaveat.value
    : [];
}

function getChainsCaveatFromPermission(
  chainsPermission: Partial<PermissionConstraint> = {},
) {
  return (
    Array.isArray(chainsPermission.caveats) &&
    chainsPermission.caveats.find(
      (caveat) => caveat.type === CaveatTypes.restrictNetworkSwitching,
    )
  );
}

function getAccountsCaveatFromPermission(
  accountsPermission: Partial<PermissionConstraint> = {},
) {
  return Array.isArray(accountsPermission.caveats)
    ? accountsPermission.caveats.find(
        (caveat) => caveat.type === CaveatTypes.restrictReturnedAccounts,
      )
    : undefined;
}

function subjectSelector(
  state: MetaMaskSliceControllerState<'PermissionController'>,
  origin: string,
) {
  return state.metamask.PermissionController.subjects?.[origin];
}

export const getAccountToConnectToActiveTab = createDeepEqualSelector(
  getSelectedInternalAccount,
  getPermittedAccountsForCurrentTab,
  getInternalAccounts,
  (selectedInternalAccount, connectedAccounts, accounts) => {
    const numberOfAccounts = Object.keys(accounts).length;

    if (
      connectedAccounts.length &&
      connectedAccounts.length !== numberOfAccounts
    ) {
      if (
        connectedAccounts.findIndex(
          (address) => address === selectedInternalAccount.address,
        ) === -1
      ) {
        return accounts.find(
          (account) => account.id === selectedInternalAccount.id,
        );
      }
    }

    return undefined;
  },
);

export const getOrderedConnectedAccountsForActiveTab = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'PermissionLogController'>) =>
    state.metamask.PermissionLogController.permissionHistory,
  (state: Pick<MetaMaskReduxState, 'activeTab'>) => state.activeTab,
  getMetaMaskAccountsOrdered,
  getPermittedAccountsForCurrentTab,
  (permissionHistory, activeTab, orderedAccounts, connectedAccounts) => {
    const permissionHistoryByAccount =
      // eslint-disable-next-line camelcase
      permissionHistory[activeTab.origin]?.eth_accounts?.accounts;

    return orderedAccounts
      .filter(
        (account) =>
          connectedAccounts.find((address) => address === account.address) !==
          undefined,
      )
      .filter((account) => isEvmAccountType(account.type))
      .map((account) => ({
        ...account,
        metadata: {
          ...account.metadata,
          lastActive: permissionHistoryByAccount?.[account.address],
        },
      }))
      .sort((accountA, accountB) => {
        if (
          (!('lastSelected' in accountA) && !('lastSelected' in accountB)) ||
          ('lastSelected' in accountA &&
            'lastSelected' in accountB &&
            accountA.lastSelected === accountB.lastSelected)
        ) {
          return 0;
        } else if (
          !('lastSelected' in accountA) ||
          accountA.lastSelected === undefined
        ) {
          return 1;
        } else if (
          !('lastSelected' in accountB) ||
          accountB.lastSelected === undefined
        ) {
          return -1;
        }

        if ((accountB.lastSelected ?? 0) > (accountA.lastSelected ?? 0)) {
          return +1;
        }
        if ((accountB.lastSelected ?? 0) < (accountA.lastSelected ?? 0)) {
          return -1;
        }
        return 0;
      });
  },
);

export const getOrderedConnectedAccountsForConnectedDapp =
  createDeepEqualSelector(
    (
      state: Parameters<typeof getPermittedAccountsForSelectedTab>[0],
      activeTab: MetaMaskReduxState['activeTab'],
    ) => ({ state, activeTab }),
    (state: MetaMaskSliceControllerState<'PermissionLogController'>) =>
      state.metamask.PermissionLogController.permissionHistory,
    getMetaMaskAccountsOrdered,
    ({ state, activeTab }, permissionHistory, orderedAccounts) => {
      const permissionHistoryByAccount =
        // eslint-disable-next-line camelcase
        permissionHistory[activeTab.origin]?.eth_accounts?.accounts;
      const connectedAccounts = getPermittedAccountsForSelectedTab(
        state,
        activeTab,
      );

      return orderedAccounts
        .filter(
          (account) =>
            connectedAccounts.find((address) => address === account.address) !==
            undefined,
        )
        .filter((account) => isEvmAccountType(account.type))
        .map((account) => ({
          ...account,
          metadata: {
            ...account.metadata,
            lastActive: permissionHistoryByAccount?.[account.address],
          },
        }))
        .sort((accountA, accountB) => {
          if (
            (!('lastSelected' in accountA) && !('lastSelected' in accountB)) ||
            ('lastSelected' in accountA &&
              'lastSelected' in accountB &&
              accountA.lastSelected === accountB.lastSelected)
          ) {
            return 0;
          } else if (
            !('lastSelected' in accountA) ||
            accountA.lastSelected === undefined
          ) {
            return 1;
          } else if (
            !('lastSelected' in accountB) ||
            accountB.lastSelected === undefined
          ) {
            return -1;
          }

          if ((accountB.lastSelected ?? 0) > (accountA.lastSelected ?? 0)) {
            return +1;
          }
          if ((accountB.lastSelected ?? 0) < (accountA.lastSelected ?? 0)) {
            return -1;
          }
          return 0;
        });
    },
  );

export const getPermissionsForActiveTab = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'PermissionController'>) =>
    state.metamask.PermissionController.subjects ?? {},
  (_state: Record<never, never>, activeTab: MetaMaskReduxState['activeTab']) =>
    activeTab,
  (subjects, { origin }) => {
    const permissions = subjects[origin]?.permissions ?? {};
    return Object.keys(permissions).map((parentCapability) => {
      return {
        key: parentCapability,
        value: permissions[parentCapability],
      };
    });
  },
);

export const activeTabHasPermissions = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'PermissionController'>) =>
    state.metamask.PermissionController.subjects ?? {},
  (_state: Record<never, never>, activeTab: MetaMaskReduxState['activeTab']) =>
    activeTab,
  (subjects, { origin }) => {
    return Boolean(Object.keys(subjects[origin]?.permissions ?? {}).length > 0);
  },
);

/**
 * Get the connected accounts history for all origins.
 *
 * @param state - The MetaMask state.
 * @returns An object with account connection histories by origin.
 */
export const getLastConnectedInfo = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'PermissionLogController'>) =>
    state.metamask.PermissionLogController.permissionHistory ?? {},
  (permissionHistory) => {
    return Object.keys(permissionHistory).reduce<Record<string, PermissionLog>>(
      (lastConnectedInfo, origin) => {
        if (permissionHistory[origin].eth_accounts) {
          lastConnectedInfo[origin] = JSON.parse(
            JSON.stringify(permissionHistory[origin].eth_accounts),
          );
        }

        return lastConnectedInfo;
      },
      {},
    );
  },
);

export function getSnapInstallOrUpdateRequests(state: ApprovalsMetaMaskState) {
  return Object.values(state.metamask.ApprovalController.pendingApprovals)
    .filter(
      ({ type }) =>
        type === 'wallet_installSnap' ||
        type === 'wallet_updateSnap' ||
        type === 'wallet_installSnapResult',
    )
    .map(({ requestData }) => requestData);
}

export function getFirstSnapInstallOrUpdateRequest(
  state: Parameters<typeof getSnapInstallOrUpdateRequests>[0],
) {
  return getSnapInstallOrUpdateRequests(state)?.[0] ?? null;
}

export function getPermissionsRequests(
  state: Parameters<typeof getApprovalRequestsByType>[0],
) {
  return getApprovalRequestsByType(
    state,
    ApprovalType.WalletRequestPermissions,
  )?.map(({ requestData }) => requestData);
}

export function getFirstPermissionRequest(
  state: Parameters<typeof getPermissionsRequests>[0],
) {
  const requests = getPermissionsRequests(state);
  return requests?.[0] ? requests[0] : null;
}

export function getPermissions(
  state: Parameters<typeof getPermissionSubjects>[0],
  origin: string,
) {
  return getPermissionSubjects(state)[origin]?.permissions;
}

export function getRequestState(state: ApprovalsMetaMaskState, id: string) {
  return state.metamask.ApprovalController.pendingApprovals[id]?.requestState;
}

export function getRequestType(state: ApprovalsMetaMaskState, id: string) {
  return state.metamask.ApprovalController.pendingApprovals[id]?.type;
}
