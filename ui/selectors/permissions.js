import { CaveatTypes } from '../../shared/constants/permissions';
import {
  getMetaMaskAccountsOrdered,
  getOriginOfCurrentTab,
  getSelectedAddress,
  getSubjectMetadata,
  getTargetSubjectMetadata,
} from '.';

// selectors

/**
 * Get the permission subjects object.
 *
 * @param {object} state - The current state.
 * @returns {object} The permissions subjects object.
 */
export function getPermissionSubjects(state) {
  return state.metamask.subjects || {};
}

/**
 * Selects the permitted accounts from the eth_accounts permission given state
 * and an origin.
 *
 * @param {object} state - The current state.
 * @param {string} origin - The origin/subject to get the permitted accounts for.
 * @returns {Array<string>} An empty array or an array of accounts.
 */
export function getPermittedAccounts(state, origin) {
  return getAccountsFromPermission(
    getAccountsPermissionFromSubject(subjectSelector(state, origin)),
  );
}

/**
 * Selects the permitted accounts from the eth_accounts permission for the
 * origin of the current tab.
 *
 * @param {object} state - The current state.
 * @returns {Array<string>} An empty array or an array of accounts.
 */
export function getPermittedAccountsForCurrentTab(state) {
  return getPermittedAccounts(state, getOriginOfCurrentTab(state));
}

/**
 * Returns a map of permitted accounts by origin for all origins.
 *
 * @param {object} state - The current state.
 * @returns {object} Permitted accounts by origin.
 */
export function getPermittedAccountsByOrigin(state) {
  const subjects = getPermissionSubjects(state);
  return Object.keys(subjects).reduce((acc, subjectKey) => {
    const accounts = getAccountsFromSubject(subjects[subjectKey]);
    if (accounts.length > 0) {
      acc[subjectKey] = accounts;
    }
    return acc;
  }, {});
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
export function getConnectedSubjectsForSelectedAddress(state) {
  const { selectedAddress } = state.metamask;
  const subjects = getPermissionSubjects(state);
  const subjectMetadata = getSubjectMetadata(state);

  const connectedSubjects = [];

  Object.entries(subjects).forEach(([subjectKey, subjectValue]) => {
    const exposedAccounts = getAccountsFromSubject(subjectValue);
    if (!exposedAccounts.includes(selectedAddress)) {
      return;
    }

    const { extensionId, name, iconUrl } = subjectMetadata[subjectKey] || {};

    connectedSubjects.push({
      extensionId,
      origin: subjectKey,
      name,
      iconUrl,
    });
  });

  return connectedSubjects;
}

export function getSubjectsWithPermission(state, permissionName) {
  const subjects = getPermissionSubjects(state);

  const connectedSubjects = [];

  Object.entries(subjects).forEach(([origin, { permissions }]) => {
    if (permissions[permissionName]) {
      const { extensionId, name, iconUrl } =
        getTargetSubjectMetadata(state, origin) || {};

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
export function getAddressConnectedSubjectMap(state) {
  const subjectMetadata = getSubjectMetadata(state);
  const accountsMap = getPermittedAccountsByOrigin(state);
  const addressConnectedIconMap = {};

  Object.keys(accountsMap).forEach((subjectKey) => {
    const { iconUrl, name } = subjectMetadata[subjectKey] || {};

    accountsMap[subjectKey].forEach((address) => {
      const nameToRender = name || subjectKey;

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

// selector helpers

function getAccountsFromSubject(subject) {
  return getAccountsFromPermission(getAccountsPermissionFromSubject(subject));
}

function getAccountsPermissionFromSubject(subject = {}) {
  return subject.permissions?.eth_accounts || {};
}

function getAccountsFromPermission(accountsPermission) {
  const accountsCaveat = getAccountsCaveatFromPermission(accountsPermission);
  return accountsCaveat && Array.isArray(accountsCaveat.value)
    ? accountsCaveat.value
    : [];
}

function getAccountsCaveatFromPermission(accountsPermission = {}) {
  return (
    Array.isArray(accountsPermission.caveats) &&
    accountsPermission.caveats.find(
      (caveat) => caveat.type === CaveatTypes.restrictReturnedAccounts,
    )
  );
}

function subjectSelector(state, origin) {
  return origin && state.metamask.subjects?.[origin];
}

export function getAccountToConnectToActiveTab(state) {
  const selectedAddress = getSelectedAddress(state);
  const connectedAccounts = getPermittedAccountsForCurrentTab(state);

  const {
    metamask: { identities },
  } = state;
  const numberOfAccounts = Object.keys(identities).length;

  if (
    connectedAccounts.length &&
    connectedAccounts.length !== numberOfAccounts
  ) {
    if (
      connectedAccounts.findIndex((address) => address === selectedAddress) ===
      -1
    ) {
      return identities[selectedAddress];
    }
  }

  return undefined;
}

export function getOrderedConnectedAccountsForActiveTab(state) {
  const {
    activeTab,
    metamask: { permissionHistory },
  } = state;

  const permissionHistoryByAccount =
    // eslint-disable-next-line camelcase
    permissionHistory[activeTab.origin]?.eth_accounts?.accounts;
  const orderedAccounts = getMetaMaskAccountsOrdered(state);
  const connectedAccounts = getPermittedAccountsForCurrentTab(state);

  return orderedAccounts
    .filter((account) => connectedAccounts.includes(account.address))
    .map((account) => ({
      ...account,
      lastActive: permissionHistoryByAccount?.[account.address],
    }))
    .sort(
      ({ lastSelected: lastSelectedA }, { lastSelected: lastSelectedB }) => {
        if (lastSelectedA === lastSelectedB) {
          return 0;
        } else if (lastSelectedA === undefined) {
          return 1;
        } else if (lastSelectedB === undefined) {
          return -1;
        }

        return lastSelectedB - lastSelectedA;
      },
    );
}

export function getPermissionsForActiveTab(state) {
  const { activeTab, metamask } = state;
  const { subjects = {} } = metamask;

  return Object.keys(subjects[activeTab.origin]?.permissions || {}).map(
    (parentCapability) => {
      return {
        key: parentCapability,
      };
    },
  );
}

export function activeTabHasPermissions(state) {
  const { activeTab, metamask } = state;
  const { subjects = {} } = metamask;

  return Boolean(
    Object.keys(subjects[activeTab.origin]?.permissions || {}).length > 0,
  );
}

/**
 * Get the connected accounts history for all origins.
 *
 * @param {Record<string, unknown>} state - The MetaMask state.
 * @returns {Record<string, { accounts: Record<string, number> }>} An object
 * with account connection histories by origin.
 */
export function getLastConnectedInfo(state) {
  const { permissionHistory = {} } = state.metamask;
  return Object.keys(permissionHistory).reduce((lastConnectedInfo, origin) => {
    if (permissionHistory[origin].eth_accounts) {
      lastConnectedInfo[origin] = JSON.parse(
        JSON.stringify(permissionHistory[origin].eth_accounts),
      );
    }

    return lastConnectedInfo;
  }, {});
}

export function getPermissionsRequests(state) {
  return Object.values(state.metamask.pendingApprovals)
    .filter(({ type }) => type === 'wallet_requestPermissions')
    .map(({ requestData }) => requestData);
}

export function getFirstPermissionRequest(state) {
  const requests = getPermissionsRequests(state);
  return requests && requests[0] ? requests[0] : null;
}
