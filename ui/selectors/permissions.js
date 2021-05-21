import { forOwn } from 'lodash';
import { CAVEAT_NAMES } from '../../shared/constants/permissions';
import {
  getMetaMaskAccountsOrdered,
  getOriginOfCurrentTab,
  getSelectedAddress,
} from '.';

// selectors

/**
 * Get the permission domains object.
 *
 * @param {Object} state - The current state.
 * @returns {Object} The permissions domains object.
 */
export function getPermissionDomains(state) {
  return state.metamask.domains || {};
}

/**
 * Get the permission domains metadata object.
 *
 * @param {Object} state - The current state.
 * @returns {Object} The permission domains metadata object.
 */
export function getPermissionDomainsMetadata(state) {
  return state.metamask.domainMetadata || {};
}

/**
 * Selects the permitted accounts from the eth_accounts permission given state
 * and an origin.
 *
 * @param {Object} state - The current state.
 * @param {string} origin - The origin/domain to get the permitted accounts for.
 * @returns {Array<string>} An empty array or an array of accounts.
 */
export function getPermittedAccounts(state, origin) {
  return getAccountsFromPermission(
    getAccountsPermissionFromDomain(domainSelector(state, origin)),
  );
}

/**
 * Selects the permitted accounts from the eth_accounts permission for the
 * origin of the current tab.
 *
 * @param {Object} state - The current state.
 * @returns {Array<string>} An empty array or an array of accounts.
 */
export function getPermittedAccountsForCurrentTab(state) {
  return getPermittedAccounts(state, getOriginOfCurrentTab(state));
}

/**
 * Returns a map of permitted accounts by origin for all origins.
 *
 * @param {Object} state - The current state.
 * @returns {Object} Permitted accounts by origin.
 */
export function getPermittedAccountsByOrigin(state) {
  const domains = getPermissionDomains(state);
  return Object.keys(domains).reduce((acc, domainKey) => {
    const accounts = getAccountsFromPermission(
      getAccountsPermissionFromDomain(domains[domainKey]),
    );
    if (accounts.length > 0) {
      acc[domainKey] = accounts;
    }
    return acc;
  }, {});
}

/**
 * Returns an array of connected domain objects, with the following properties:
 * - extensionId
 * - key (i.e. origin)
 * - name
 * - icon
 *
 * @param {Object} state - The current state.
 * @returns {Array<Object>} An array of connected domain objects.
 */
export function getConnectedDomainsForSelectedAddress(state) {
  const { selectedAddress } = state.metamask;
  const domains = getPermissionDomains(state);
  const domainMetadata = getPermissionDomainsMetadata(state);

  const connectedDomains = [];

  forOwn(domains, (domainValue, domainKey) => {
    const exposedAccounts = getAccountsFromDomain(domainValue);
    if (!exposedAccounts.includes(selectedAddress)) {
      return;
    }

    const { extensionId, name, icon, host } = domainMetadata[domainKey] || {};

    connectedDomains.push({
      extensionId,
      origin: domainKey,
      name,
      icon,
      host,
    });
  });

  return connectedDomains;
}

/**
 * Returns an object mapping addresses to objects mapping origins to connected
 * domain info. Domain info objects have the following properties:
 * - icon
 * - name
 *
 * @param {Object} state - The current state.
 * @returns {Object} A mapping of addresses to a mapping of origins to
 * connected domain info.
 */
export function getAddressConnectedDomainMap(state) {
  const domainMetadata = getPermissionDomainsMetadata(state);
  const accountsMap = getPermittedAccountsByOrigin(state);
  const addressConnectedIconMap = {};

  Object.keys(accountsMap).forEach((domainKey) => {
    const { icon, name } = domainMetadata[domainKey] || {};

    accountsMap[domainKey].forEach((address) => {
      const nameToRender = name || domainKey;

      addressConnectedIconMap[address] = addressConnectedIconMap[address]
        ? {
            ...addressConnectedIconMap[address],
            [domainKey]: { icon, name: nameToRender },
          }
        : { [domainKey]: { icon, name: nameToRender } };
    });
  });

  return addressConnectedIconMap;
}

// selector helpers

function getAccountsFromDomain(domain) {
  return getAccountsFromPermission(getAccountsPermissionFromDomain(domain));
}

function getAccountsPermissionFromDomain(domain = {}) {
  return Array.isArray(domain.permissions)
    ? domain.permissions.find(
        (perm) => perm.parentCapability === 'eth_accounts',
      )
    : {};
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
      (c) => c.name === CAVEAT_NAMES.exposedAccounts,
    )
  );
}

function domainSelector(state, origin) {
  return origin && state.metamask.domains?.[origin];
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
    metamask: { permissionsHistory },
  } = state;

  const permissionsHistoryByAccount =
    // eslint-disable-next-line camelcase
    permissionsHistory[activeTab.origin]?.eth_accounts?.accounts;
  const orderedAccounts = getMetaMaskAccountsOrdered(state);
  const connectedAccounts = getPermittedAccountsForCurrentTab(state);

  return orderedAccounts
    .filter((account) => connectedAccounts.includes(account.address))
    .map((account) => ({
      ...account,
      lastActive: permissionsHistoryByAccount?.[account.address],
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
  const { domains = {} } = metamask;

  return domains[activeTab.origin]?.permissions?.map(({ parentCapability }) => {
    return {
      key: parentCapability,
    };
  });
}

export function activeTabHasPermissions(state) {
  const { activeTab, metamask } = state;
  const { domains = {} } = metamask;

  return Boolean(domains[activeTab.origin]?.permissions?.length > 0);
}

export function getLastConnectedInfo(state) {
  const { permissionsHistory = {} } = state.metamask;
  return Object.keys(permissionsHistory).reduce((acc, origin) => {
    const ethAccountsHistory = JSON.parse(
      JSON.stringify(permissionsHistory[origin].eth_accounts),
    );
    return {
      ...acc,
      [origin]: ethAccountsHistory,
    };
  }, {});
}

export function getPermissionsMetadataHostCounts(state) {
  const metadata = getPermissionDomainsMetadata(state);
  return Object.values(metadata).reduce((counts, { host }) => {
    if (host) {
      if (counts[host]) {
        counts[host] += 1;
      } else {
        counts[host] = 1;
      }
    }
    return counts;
  }, {});
}

export function getPermissionsRequests(state) {
  return state.metamask.permissionsRequests || [];
}

export function getFirstPermissionRequest(state) {
  const requests = getPermissionsRequests(state);
  return requests && requests[0] ? requests[0] : null;
}
