import deepFreeze from 'deep-freeze-strict';
import { CaveatTypes } from '../../shared/constants/permissions';

/**
 * This file contains mocks for the PermissionLogController tests.
 */

export const noop = () => undefined;

const keyringAccounts = deepFreeze([
  '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
  '0x7ae1cdd37bcbdb0e1f491974da8022bfdbf9c2bf',
  '0xcc74c7a59194e5d9268476955650d1e285be703c',
]);

const SUBJECTS = {
  a: { origin: 'https://foo.xyz' },
  b: { origin: 'https://bar.abc' },
  c: { origin: 'https://baz.def' },
};

const PERM_NAMES = {
  eth_accounts: 'eth_accounts',
  test_method: 'test_method',
  does_not_exist: 'does_not_exist',
};

const ACCOUNTS = {
  a: {
    permitted: keyringAccounts.slice(0, 3),
    primary: keyringAccounts[0],
  },
  b: {
    permitted: [keyringAccounts[0]],
    primary: keyringAccounts[0],
  },
  c: {
    permitted: [keyringAccounts[1]],
    primary: keyringAccounts[1],
  },
};

/**
 * Helpers for getting mock caveats.
 */
const CAVEATS = {
  /**
   * Gets a correctly formatted eth_accounts restrictReturnedAccounts caveat.
   *
   * @param {Array<string>} accounts - The accounts for the caveat
   * @returns {object} An eth_accounts restrictReturnedAccounts caveats
   */
  eth_accounts: (accounts) => {
    return [
      {
        type: CaveatTypes.restrictReturnedAccounts,
        value: accounts,
      },
    ];
  },
};

/**
 * Each function here corresponds to what would be a type or interface consumed
 * by permissions controller functions if we used TypeScript.
 */
const PERMS = {
  /**
   * Requested permissions objects, as passed to wallet_requestPermissions.
   */
  requests: {
    /**
     * @returns {object} A permissions request object with eth_accounts
     */
    eth_accounts: () => {
      return { eth_accounts: {} };
    },

    /**
     * @returns {object} A permissions request object with test_method
     */
    test_method: () => {
      return { test_method: {} };
    },

    /**
     * @returns {object} A permissions request object with does_not_exist
     */
    does_not_exist: () => {
      return { does_not_exist: {} };
    },
  },

  /**
   * Partial members of res.result for successful:
   * - wallet_requestPermissions
   * - wallet_getPermissions
   */
  granted: {
    /**
     * @param {Array<string>} accounts - The accounts for the eth_accounts permission caveat
     * @returns {object} A granted permissions object with eth_accounts and its caveat
     */
    eth_accounts: (accounts) => {
      return {
        parentCapability: PERM_NAMES.eth_accounts,
        caveats: CAVEATS.eth_accounts(accounts),
      };
    },

    /**
     * @returns {object} A granted permissions object with test_method
     */
    test_method: () => {
      return {
        parentCapability: PERM_NAMES.test_method,
      };
    },
  },
};

/**
 * Objects with function values for getting correctly formatted permissions,
 * caveats, errors, permissions requests etc.
 */
export const getters = deepFreeze({
  PERMS,

  /**
   * Getters for mock RPC request objects.
   */
  RPC_REQUESTS: {
    /**
     * Gets an arbitrary RPC request object.
     *
     * @param {string} origin - The origin of the request
     * @param {string} method - The request method
     * @param {Array<any>} params - The request parameters
     * @param {string} [id] - The request id
     * @returns {object} An RPC request object
     */
    custom: (origin, method, params = [], id) => {
      const req = {
        origin,
        method,
        params,
      };
      if (id !== undefined) {
        req.id = id;
      }
      return req;
    },

    /**
     * Gets an eth_accounts RPC request object.
     *
     * @param {string} origin - The origin of the request
     * @returns {object} An RPC request object
     */
    eth_accounts: (origin) => {
      return {
        origin,
        method: 'eth_accounts',
        params: [],
      };
    },

    /**
     * Gets a test_method RPC request object.
     *
     * @param {string} origin - The origin of the request
     * @param {boolean} param - The request param
     * @returns {object} An RPC request object
     */
    test_method: (origin, param = false) => {
      return {
        origin,
        method: 'test_method',
        params: [param],
      };
    },

    /**
     * Gets an eth_requestAccounts RPC request object.
     *
     * @param {string} origin - The origin of the request
     * @returns {object} An RPC request object
     */
    eth_requestAccounts: (origin) => {
      return {
        origin,
        method: 'eth_requestAccounts',
        params: [],
      };
    },

    /**
     * Gets a wallet_requestPermissions RPC request object,
     * for a single permission.
     *
     * @param {string} origin - The origin of the request
     * @param {string} permissionName - The name of the permission to request
     * @returns {object} An RPC request object
     */
    requestPermission: (origin, permissionName) => {
      return {
        origin,
        method: 'wallet_requestPermissions',
        params: [PERMS.requests[permissionName]()],
      };
    },

    /**
     * Gets a wallet_requestPermissions RPC request object,
     * for multiple permissions.
     *
     * @param {string} origin - The origin of the request
     * @param {object} permissions - A permission request object
     * @returns {object} An RPC request object
     */
    requestPermissions: (origin, permissions = {}) => {
      return {
        origin,
        method: 'wallet_requestPermissions',
        params: [permissions],
      };
    },

    /**
     * Gets a metamask_sendDomainMetadata RPC request object.
     *
     * @param {string} origin - The origin of the request
     * @param {object} name - The subjectMetadata name
     * @param {Array<any>} [args] - Any other data for the request's subjectMetadata
     * @returns {object} An RPC request object
     */
    metamask_sendDomainMetadata: (origin, name, ...args) => {
      return {
        origin,
        method: 'metamask_sendDomainMetadata',
        params: {
          ...args,
          name,
        },
      };
    },
  },
});

/**
 * Objects with immutable mock values.
 */
export const constants = deepFreeze({
  REQUEST_IDS: {
    a: '1',
    b: '2',
    c: '3',
  },

  SUBJECTS: { ...SUBJECTS },

  ACCOUNTS: { ...ACCOUNTS },

  PERM_NAMES: { ...PERM_NAMES },

  RESTRICTED_METHODS: new Set(['eth_accounts', 'test_method']),

  /**
   * Mock permissions history objects.
   */
  EXPECTED_HISTORIES: {
    case1: [
      {
        [SUBJECTS.a.origin]: {
          [PERM_NAMES.eth_accounts]: {
            lastApproved: 1,
            accounts: {
              [ACCOUNTS.a.permitted[0]]: 1,
              [ACCOUNTS.a.permitted[1]]: 1,
              [ACCOUNTS.a.permitted[2]]: 1,
            },
          },
        },
      },
      {
        [SUBJECTS.a.origin]: {
          [PERM_NAMES.eth_accounts]: {
            lastApproved: 2,
            accounts: {
              [ACCOUNTS.a.permitted[0]]: 2,
              [ACCOUNTS.a.permitted[1]]: 1,
              [ACCOUNTS.a.permitted[2]]: 1,
            },
          },
        },
      },
    ],

    case2: [
      {
        [SUBJECTS.a.origin]: {
          [PERM_NAMES.eth_accounts]: {
            lastApproved: 1,
            accounts: {},
          },
        },
      },
    ],

    case3: [
      {
        [SUBJECTS.a.origin]: {
          [PERM_NAMES.test_method]: { lastApproved: 1 },
        },
        [SUBJECTS.b.origin]: {
          [PERM_NAMES.eth_accounts]: {
            lastApproved: 1,
            accounts: {
              [ACCOUNTS.b.permitted[0]]: 1,
            },
          },
        },
        [SUBJECTS.c.origin]: {
          [PERM_NAMES.test_method]: { lastApproved: 1 },
          [PERM_NAMES.eth_accounts]: {
            lastApproved: 1,
            accounts: {
              [ACCOUNTS.c.permitted[0]]: 1,
            },
          },
        },
      },
      {
        [SUBJECTS.a.origin]: {
          [PERM_NAMES.test_method]: { lastApproved: 2 },
        },
        [SUBJECTS.b.origin]: {
          [PERM_NAMES.eth_accounts]: {
            lastApproved: 1,
            accounts: {
              [ACCOUNTS.b.permitted[0]]: 1,
            },
          },
        },
        [SUBJECTS.c.origin]: {
          [PERM_NAMES.test_method]: { lastApproved: 1 },
          [PERM_NAMES.eth_accounts]: {
            lastApproved: 2,
            accounts: {
              [ACCOUNTS.c.permitted[0]]: 1,
              [ACCOUNTS.b.permitted[0]]: 2,
            },
          },
        },
      },
    ],

    case4: [
      {
        [SUBJECTS.a.origin]: {
          [PERM_NAMES.test_method]: {
            lastApproved: 1,
          },
        },
      },
    ],
  },
});
