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
import { ApprovalsMetaMaskState, getApprovalRequestsByType } from './approvals';
import {
  getInternalAccount,
  getMetaMaskAccountsOrdered,
  getOriginOfCurrentTab,
  getTargetSubjectMetadata,
} from './selectors';
import type { ConnectedSubject } from './selectors.types';
import { getSelectedInternalAccount } from './accounts';
import type { MetaMaskReduxState } from '../store/store';

// selectors

/**
 * Deep equal selector to get the permission subjects object.
 *
 * @param {object} state - The current state.
 * @returns {object} The permissions subjects object.
 */
export const getPermissionSubjectsDeepEqual = createDeepEqualSelector(
  (state: MetaMaskReduxState) =>
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
  (state: MetaMaskReduxState) =>
    state.metamask.SubjectMetadataController.subjectMetadata,
  (metadata) => metadata,
);

/**
 * Selector to get the permission subjects object.
 *
 * @param {object} state - The current state.
 * @returns {object} The permissions subjects object.
 */
export function getPermissionSubjects(state: MetaMaskReduxState) {
  return state.metamask.PermissionController.subjects ?? {};
}

/**
 * Selects the permitted accounts from the eth_accounts permission given state
 * and an origin.
 *
 * @param {object} state - The current state.
 * @param {string} origin - The origin/subject to get the permitted accounts for.
 * @returns {Array<string>} An empty array or an array of accounts.
 */
export function getPermittedAccounts(
  state: MetaMaskReduxState,
  origin: string,
) {
  return getAccountsFromPermission(
    getAccountsPermissionFromSubject(subjectSelector(state, origin)),
  );
}

export function getPermittedChains(state: MetaMaskReduxState, origin: string) {
  return getChainsFromPermission(
    getChainsPermissionFromSubject(subjectSelector(state, origin)),
  );
}

/**
 * Selects the permitted accounts from the eth_accounts permission for the
 * origin of the current tab.
 *
 * @param {object} state - The current state.
 * @returns {Array<string>} An empty array or an array of accounts.
 */
export function getPermittedAccountsForCurrentTab(state: MetaMaskReduxState) {
  return getPermittedAccounts(state, getOriginOfCurrentTab(state));
}

export function getPermittedAccountsForSelectedTab(
  state: MetaMaskReduxState,
  activeTab: MetaMaskReduxState['activeTab'],
) {
  return getPermittedAccounts(state, activeTab.origin);
}

export function getPermittedChainsForCurrentTab(state: MetaMaskReduxState) {
  return getPermittedAccounts(state, getOriginOfCurrentTab(state));
}

export function getPermittedChainsForSelectedTab(
  state: MetaMaskReduxState,
  activeTab: MetaMaskReduxState['activeTab'],
) {
  return getPermittedChains(state, activeTab.origin);
}

/**
 * Returns a map of permitted accounts by origin for all origins.
 *
 * @param {object} state - The current state.
 * @returns {object} Permitted accounts by origin.
 */
export function getPermittedAccountsByOrigin(state: MetaMaskReduxState) {
  const subjects = getPermissionSubjects(state);
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
}

export function getPermittedChainsByOrigin(state: MetaMaskReduxState) {
  const subjects = getPermissionSubjects(state);
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
}

export function getSubjectMetadata(state: MetaMaskReduxState) {
  return state.metamask.SubjectMetadataController.subjectMetadata;
}

/**
 * Returns an array of connected subject objects, with the following properties:
 * - extensionId
 * - key (i.e. origin)
 * - name
 * - icon
 *
 * @param {object} state - The current state.
 * @returns {Array<object>} An array of connected subject objects.
 */
export function getConnectedSubjectsForSelectedAddress(
  state: MetaMaskReduxState,
) {
  const selectedInternalAccount = getSelectedInternalAccount(state);
  const subjects = getPermissionSubjects(state);
  const subjectMetadata = getSubjectMetadata(state);

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
}

/**
 *  @typedef {import('./selectors.types').AccountConnections} AccountConnections
 */

/**
 * Retrieves the connected subjects for all addresses.
 *
 * @returns {AccountConnections}  The connected subjects for all addresses.
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

export function getSubjectsWithPermission(
  state: MetaMaskReduxState,
  permissionName: string,
) {
  const subjects = getPermissionSubjects(state);

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
}

export function getSubjectsWithSnapPermission(
  state: MetaMaskReduxState,
  snapId: SnapId,
) {
  const subjects = getPermissionSubjects(state);

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
}

/**
 * Returns an object mapping addresses to objects mapping origins to connected
 * subject info. Subject info objects have the following properties:
 * - iconUrl
 * - name
 *
 * @param {object} state - The current state.
 * @returns {object} A mapping of addresses to a mapping of origins to
 * connected subject info.
 */
export function getAddressConnectedSubjectMap(state: MetaMaskReduxState) {
  const subjectMetadata = getSubjectMetadata(state);
  const accountsMap = getPermittedAccountsByOrigin(state);
  const addressConnectedIconMap: Record<string, Partial<ConnectedSubject>> = {};

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
}

export const isAccountConnectedToCurrentTab = createDeepEqualSelector(
  getPermittedAccountsForCurrentTab,
  (_state: MetaMaskReduxState, address: string) => address,
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

function subjectSelector(state: MetaMaskReduxState, origin: string) {
  return state.metamask.PermissionController.subjects?.[origin];
}

export function getAccountToConnectToActiveTab(state: MetaMaskReduxState) {
  const selectedInternalAccount = getSelectedInternalAccount(state);
  const connectedAccounts = getPermittedAccountsForCurrentTab(state);

  const {
    metamask: {
      AccountsController: {
        internalAccounts: { accounts },
      },
    },
  } = state;
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
      return getInternalAccount(state, selectedInternalAccount.id);
    }
  }

  return undefined;
}

export function getOrderedConnectedAccountsForActiveTab(
  state: MetaMaskReduxState,
) {
  const {
    activeTab,
    metamask: {
      PermissionLogController: { permissionHistory },
    },
  } = state;

  const permissionHistoryByAccount =
    // eslint-disable-next-line camelcase
    permissionHistory[activeTab.origin]?.eth_accounts?.accounts;
  const orderedAccounts = getMetaMaskAccountsOrdered(state);
  const connectedAccounts = getPermittedAccountsForCurrentTab(state);

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
      return (accountB.lastSelected ?? 0) > (accountA.lastSelected ?? 0)
        ? +1
        : (accountB.lastSelected ?? 0) < (accountA.lastSelected ?? 0)
        ? -1
        : 0;
    });
}

export function getOrderedConnectedAccountsForConnectedDapp(
  state: MetaMaskReduxState,
  activeTab: MetaMaskReduxState['activeTab'],
) {
  const {
    metamask: {
      PermissionLogController: { permissionHistory },
    },
  } = state;

  const permissionHistoryByAccount =
    // eslint-disable-next-line camelcase
    permissionHistory[activeTab.origin]?.eth_accounts?.accounts;
  const orderedAccounts = getMetaMaskAccountsOrdered(state);
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
      return (accountB.lastSelected ?? 0) > (accountA.lastSelected ?? 0)
        ? +1
        : (accountB.lastSelected ?? 0) < (accountA.lastSelected ?? 0)
        ? -1
        : 0;
    });
}

export function getPermissionsForActiveTab(state: MetaMaskReduxState) {
  const { activeTab, metamask } = state;
  const {
    PermissionController: { subjects = {} },
  } = metamask;

  const permissions = subjects[activeTab.origin]?.permissions ?? {};
  return Object.keys(permissions).map((parentCapability) => {
    return {
      key: parentCapability,
      value: permissions[parentCapability],
    };
  });
}

export function activeTabHasPermissions(state: MetaMaskReduxState) {
  const { activeTab, metamask } = state;
  const {
    PermissionController: { subjects = {} },
  } = metamask;

  return Boolean(
    Object.keys(subjects[activeTab.origin]?.permissions ?? {}).length > 0,
  );
}

/**
 * Get the connected accounts history for all origins.
 *
 * @param {Record<string, unknown>} state - The MetaMask state.
 * @returns {Record<string, { accounts: Record<string, number> }>} An object
 * with account connection histories by origin.
 */
export function getLastConnectedInfo(state: MetaMaskReduxState) {
  const {
    PermissionLogController: { permissionHistory = {} },
  } = state.metamask;
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
}

export function getSnapInstallOrUpdateRequests(state: MetaMaskReduxState) {
  return Object.values(state.metamask.ApprovalController.pendingApprovals)
    .filter(
      ({ type }) =>
        type === 'wallet_installSnap' ||
        type === 'wallet_updateSnap' ||
        type === 'wallet_installSnapResult',
    )
    .map(({ requestData }) => requestData);
}

export function getFirstSnapInstallOrUpdateRequest(state: MetaMaskReduxState) {
  return getSnapInstallOrUpdateRequests(state)?.[0] ?? null;
}

export function getPermissionsRequests(state: MetaMaskReduxState) {
  return getApprovalRequestsByType(
    state,
    ApprovalType.WalletRequestPermissions,
  )?.map(({ requestData }) => requestData);
}

export function getFirstPermissionRequest(state: MetaMaskReduxState) {
  const requests = getPermissionsRequests(state);
  return requests && requests[0] ? requests[0] : null;
}

export function getPermissions(state: MetaMaskReduxState, origin: string) {
  return getPermissionSubjects(state)[origin]?.permissions;
}

export function getRequestState(state: ApprovalsMetaMaskState, id: string) {
  return state.metamask.ApprovalController.pendingApprovals[id]?.requestState;
}

export function getRequestType(state: ApprovalsMetaMaskState, id: string) {
  return state.metamask.ApprovalController.pendingApprovals[id]?.type;
}
