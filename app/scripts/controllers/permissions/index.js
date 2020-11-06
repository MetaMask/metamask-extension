import nanoid from 'nanoid'
import JsonRpcEngine from 'json-rpc-engine'
import asMiddleware from 'json-rpc-engine/src/asMiddleware'
import ObservableStore from 'obs-store'
import log from 'loglevel'
import { CapabilitiesController as RpcCap } from 'rpc-cap'
import { ethErrors } from 'eth-json-rpc-errors'
import { cloneDeep } from 'lodash'

import createPermissionsMethodMiddleware from './permissionsMethodMiddleware'
import PermissionsLogController from './permissionsLog'

// Methods that do not require any permissions to use:
import {
  SAFE_METHODS, // methods that do not require any permissions to use
  WALLET_PREFIX,
  METADATA_STORE_KEY,
  METADATA_CACHE_MAX_SIZE,
  LOG_STORE_KEY,
  HISTORY_STORE_KEY,
  CAVEAT_NAMES,
  NOTIFICATION_NAMES,
  CAVEAT_TYPES,
} from './enums'

export class PermissionsController {
  constructor(
    {
      getKeyringAccounts,
      getRestrictedMethods,
      getUnlockPromise,
      notifyDomain,
      notifyAllDomains,
      preferences,
      showPermissionRequest,
    } = {},
    restoredPermissions = {},
    restoredState = {},
  ) {
    // additional top-level store key set in _initializeMetadataStore
    this.store = new ObservableStore({
      [LOG_STORE_KEY]: restoredState[LOG_STORE_KEY] || [],
      [HISTORY_STORE_KEY]: restoredState[HISTORY_STORE_KEY] || {},
    })

    this.getKeyringAccounts = getKeyringAccounts
    this._getUnlockPromise = getUnlockPromise
    this._notifyDomain = notifyDomain
    this._notifyAllDomains = notifyAllDomains
    this._showPermissionRequest = showPermissionRequest

    this._restrictedMethods = getRestrictedMethods({
      getKeyringAccounts: this.getKeyringAccounts.bind(this),
      getIdentities: this._getIdentities.bind(this),
    })
    this.permissionsLog = new PermissionsLogController({
      restrictedMethods: Object.keys(this._restrictedMethods),
      store: this.store,
    })
    this.pendingApprovals = new Map()
    this.pendingApprovalOrigins = new Set()
    this._initializePermissions(restoredPermissions)
    this._lastSelectedAddress = preferences.getState().selectedAddress
    this.preferences = preferences

    this._initializeMetadataStore(restoredState)

    preferences.subscribe(async ({ selectedAddress }) => {
      if (selectedAddress && selectedAddress !== this._lastSelectedAddress) {
        this._lastSelectedAddress = selectedAddress
        await this._handleAccountSelected(selectedAddress)
      }
    })
  }

  createMiddleware({ origin, extensionId }) {
    if (typeof origin !== 'string' || !origin.length) {
      throw new Error('Must provide non-empty string origin.')
    }

    const metadataState = this.store.getState()[METADATA_STORE_KEY]

    if (extensionId && metadataState[origin]?.extensionId !== extensionId) {
      this.addDomainMetadata(origin, { extensionId })
    }

    const engine = new JsonRpcEngine()

    engine.push(this.permissionsLog.createMiddleware())

    engine.push(
      createPermissionsMethodMiddleware({
        addDomainMetadata: this.addDomainMetadata.bind(this),
        getAccounts: this.getAccounts.bind(this, origin),
        getUnlockPromise: () => this._getUnlockPromise(true),
        hasPermission: this.hasPermission.bind(this, origin),
        notifyAccountsChanged: this.notifyAccountsChanged.bind(this, origin),
        requestAccountsPermission: this._requestPermissions.bind(
          this,
          { origin },
          { eth_accounts: {} },
        ),
      }),
    )

    engine.push(
      this.permissions.providerMiddlewareFunction.bind(this.permissions, {
        origin,
      }),
    )

    return asMiddleware(engine)
  }

  /**
   * Request {@code eth_accounts} permissions
   * @param {string} origin - The requesting origin
   * @returns {Promise<string>} The permissions request ID
   */
  async requestAccountsPermissionWithId(origin) {
    const id = nanoid()
    this._requestPermissions({ origin }, { eth_accounts: {} }, id)
    return id
  }

  /**
   * Returns the accounts that should be exposed for the given origin domain,
   * if any. This method exists for when a trusted context needs to know
   * which accounts are exposed to a given domain.
   *
   * @param {string} origin - The origin string.
   */
  getAccounts(origin) {
    return new Promise((resolve, _) => {
      const req = { method: 'eth_accounts' }
      const res = {}
      this.permissions.providerMiddlewareFunction(
        { origin },
        req,
        res,
        () => undefined,
        _end,
      )

      function _end() {
        if (res.error || !Array.isArray(res.result)) {
          resolve([])
        } else {
          resolve(res.result)
        }
      }
    })
  }

  /**
   * Returns whether the given origin has the given permission.
   *
   * @param {string} origin - The origin to check.
   * @param {string} permission - The permission to check for.
   * @returns {boolean} Whether the origin has the permission.
   */
  hasPermission(origin, permission) {
    return Boolean(this.permissions.getPermission(origin, permission))
  }

  /**
   * Gets the identities from the preferences controller store
   *
   * @returns {Object} identities
   */
  _getIdentities() {
    return this.preferences.getState().identities
  }

  /**
   * Submits a permissions request to rpc-cap. Internal, background use only.
   *
   * @param {IOriginMetadata} domain - The external domain metadata.
   * @param {IRequestedPermissions} permissions - The requested permissions.
   * @param {string} [id] - The desired id of the permissions request, if any.
   * @returns {Promise<IOcapLdCapability[]>} A Promise that resolves with the
   * approved permissions, or rejects with an error.
   */
  _requestPermissions(domain, permissions, id) {
    return new Promise((resolve, reject) => {
      // rpc-cap assigns an id to the request if there is none, as expected by
      // requestUserApproval below
      const req = {
        id,
        method: 'wallet_requestPermissions',
        params: [permissions],
      }
      const res = {}

      this.permissions.providerMiddlewareFunction(
        domain,
        req,
        res,
        () => undefined,
        _end,
      )

      function _end(_err) {
        const err = _err || res.error
        if (err) {
          reject(err)
        } else {
          resolve(res.result)
        }
      }
    })
  }

  /**
   * User approval callback. Resolves the Promise for the permissions request
   * waited upon by rpc-cap, see requestUserApproval in _initializePermissions.
   * The request will be rejected if finalizePermissionsRequest fails.
   * Idempotent for a given request id.
   *
   * @param {Object} approved - The request object approved by the user
   * @param {Array} accounts - The accounts to expose, if any
   */
  async approvePermissionsRequest(approved, accounts) {
    const { id } = approved.metadata
    const approval = this.pendingApprovals.get(id)

    if (!approval) {
      log.debug(`Permissions request with id '${id}' not found`)
      return
    }

    try {
      if (Object.keys(approved.permissions).length === 0) {
        approval.reject(
          ethErrors.rpc.invalidRequest({
            message: 'Must request at least one permission.',
          }),
        )
      } else {
        // attempt to finalize the request and resolve it,
        // settings caveats as necessary
        approved.permissions = await this.finalizePermissionsRequest(
          approved.permissions,
          accounts,
        )
        approval.resolve(approved.permissions)
      }
    } catch (err) {
      // if finalization fails, reject the request
      approval.reject(
        ethErrors.rpc.invalidRequest({
          message: err.message,
          data: err,
        }),
      )
    }

    this._removePendingApproval(id)
  }

  /**
   * User rejection callback. Rejects the Promise for the permissions request
   * waited upon by rpc-cap, see requestUserApproval in _initializePermissions.
   * Idempotent for a given id.
   *
   * @param {string} id - The id of the request rejected by the user
   */
  async rejectPermissionsRequest(id) {
    const approval = this.pendingApprovals.get(id)

    if (!approval) {
      log.debug(`Permissions request with id '${id}' not found`)
      return
    }

    approval.reject(ethErrors.provider.userRejectedRequest())
    this._removePendingApproval(id)
  }

  /**
   * Expose an account to the given origin. Changes the eth_accounts
   * permissions and emits accountsChanged.
   *
   * Throws error if the origin or account is invalid, or if the update fails.
   *
   * @param {string} origin - The origin to expose the account to.
   * @param {string} account - The new account to expose.
   */
  async addPermittedAccount(origin, account) {
    const domains = this.permissions.getDomains()
    if (!domains[origin]) {
      throw new Error('Unrecognized domain')
    }

    this.validatePermittedAccounts([account])

    const oldPermittedAccounts = this._getPermittedAccounts(origin)
    if (!oldPermittedAccounts) {
      throw new Error(`Origin does not have 'eth_accounts' permission`)
    } else if (oldPermittedAccounts.includes(account)) {
      throw new Error('Account is already permitted for origin')
    }

    this.permissions.updateCaveatFor(
      origin,
      'eth_accounts',
      CAVEAT_NAMES.exposedAccounts,
      [...oldPermittedAccounts, account],
    )

    const permittedAccounts = await this.getAccounts(origin)

    this.notifyAccountsChanged(origin, permittedAccounts)
  }

  /**
   * Removes an exposed account from the given origin. Changes the eth_accounts
   * permission and emits accountsChanged.
   * If origin only has a single permitted account, removes the eth_accounts
   * permission from the origin.
   *
   * Throws error if the origin or account is invalid, or if the update fails.
   *
   * @param {string} origin - The origin to remove the account from.
   * @param {string} account - The account to remove.
   */
  async removePermittedAccount(origin, account) {
    const domains = this.permissions.getDomains()
    if (!domains[origin]) {
      throw new Error('Unrecognized domain')
    }

    this.validatePermittedAccounts([account])

    const oldPermittedAccounts = this._getPermittedAccounts(origin)
    if (!oldPermittedAccounts) {
      throw new Error(`Origin does not have 'eth_accounts' permission`)
    } else if (!oldPermittedAccounts.includes(account)) {
      throw new Error('Account is not permitted for origin')
    }

    let newPermittedAccounts = oldPermittedAccounts.filter(
      (acc) => acc !== account,
    )

    if (newPermittedAccounts.length === 0) {
      this.removePermissionsFor({ [origin]: ['eth_accounts'] })
    } else {
      this.permissions.updateCaveatFor(
        origin,
        'eth_accounts',
        CAVEAT_NAMES.exposedAccounts,
        newPermittedAccounts,
      )

      newPermittedAccounts = await this.getAccounts(origin)
    }

    this.notifyAccountsChanged(origin, newPermittedAccounts)
  }

  /**
   * Remove all permissions associated with a particular account. Any eth_accounts
   * permissions left with no permitted accounts will be removed as well.
   *
   * Throws error if the account is invalid, or if the update fails.
   *
   * @param {string} account - The account to remove.
   */
  async removeAllAccountPermissions(account) {
    this.validatePermittedAccounts([account])

    const domains = this.permissions.getDomains()
    const connectedOrigins = Object.keys(domains).filter((origin) =>
      this._getPermittedAccounts(origin).includes(account),
    )

    await Promise.all(
      connectedOrigins.map((origin) =>
        this.removePermittedAccount(origin, account),
      ),
    )
  }

  /**
   * Finalizes a permissions request. Throws if request validation fails.
   * Clones the passed-in parameters to prevent inadvertent modification.
   * Sets (adds or replaces) caveats for the following permissions:
   * - eth_accounts: the permitted accounts caveat
   *
   * @param {Object} requestedPermissions - The requested permissions.
   * @param {string[]} requestedAccounts - The accounts to expose, if any.
   * @returns {Object} The finalized permissions request object.
   */
  async finalizePermissionsRequest(requestedPermissions, requestedAccounts) {
    const finalizedPermissions = cloneDeep(requestedPermissions)
    const finalizedAccounts = cloneDeep(requestedAccounts)

    const { eth_accounts: ethAccounts } = finalizedPermissions

    if (ethAccounts) {
      this.validatePermittedAccounts(finalizedAccounts)

      if (!ethAccounts.caveats) {
        ethAccounts.caveats = []
      }

      // caveat names are unique, and we will only construct this caveat here
      ethAccounts.caveats = ethAccounts.caveats.filter(
        (c) =>
          c.name !== CAVEAT_NAMES.exposedAccounts &&
          c.name !== CAVEAT_NAMES.primaryAccountOnly,
      )

      ethAccounts.caveats.push({
        type: CAVEAT_TYPES.limitResponseLength,
        value: 1,
        name: CAVEAT_NAMES.primaryAccountOnly,
      })

      ethAccounts.caveats.push({
        type: CAVEAT_TYPES.filterResponse,
        value: finalizedAccounts,
        name: CAVEAT_NAMES.exposedAccounts,
      })
    }

    return finalizedPermissions
  }

  /**
   * Validate an array of accounts representing accounts to be exposed
   * to a domain. Throws error if validation fails.
   *
   * @param {string[]} accounts - An array of addresses.
   */
  validatePermittedAccounts(accounts) {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error('Must provide non-empty array of account(s).')
    }

    // assert accounts exist
    const allIdentities = this._getIdentities()
    accounts.forEach((acc) => {
      if (!allIdentities[acc]) {
        throw new Error(`Unknown account: ${acc}`)
      }
    })
  }

  /**
   * Notify a domain that its permitted accounts have changed.
   * Also updates the accounts history log.
   *
   * @param {string} origin - The origin of the domain to notify.
   * @param {Array<string>} newAccounts - The currently permitted accounts.
   */
  notifyAccountsChanged(origin, newAccounts) {
    if (typeof origin !== 'string' || !origin) {
      throw new Error(`Invalid origin: '${origin}'`)
    }

    if (!Array.isArray(newAccounts)) {
      throw new Error('Invalid accounts', newAccounts)
    }

    this._notifyDomain(origin, {
      method: NOTIFICATION_NAMES.accountsChanged,
      result: newAccounts,
    })

    // if the accounts changed from the perspective of the dapp,
    // update "last seen" time for the origin and account(s)
    // exception: no accounts -> no times to update
    this.permissionsLog.updateAccountsHistory(origin, newAccounts)

    // NOTE:
    // we don't check for accounts changing in the notifyAllDomains case,
    // because the log only records when accounts were last seen,
    // and the accounts only change for all domains at once when permissions
    // are removed
  }

  /**
   * Removes the given permissions for the given domain.
   * Should only be called after confirming that the permissions exist, to
   * avoid sending unnecessary notifications.
   *
   * @param {Object} domains { origin: [permissions] } - The map of domain
   * origins to permissions to remove.
   */
  removePermissionsFor(domains) {
    Object.entries(domains).forEach(([origin, perms]) => {
      this.permissions.removePermissionsFor(
        origin,
        perms.map((methodName) => {
          if (methodName === 'eth_accounts') {
            this.notifyAccountsChanged(origin, [])
          }

          return { parentCapability: methodName }
        }),
      )
    })
  }

  /**
   * Removes all known domains and their related permissions.
   */
  clearPermissions() {
    this.permissions.clearDomains()
    this._notifyAllDomains({
      method: NOTIFICATION_NAMES.accountsChanged,
      result: [],
    })
  }

  /**
   * Stores domain metadata for the given origin (domain).
   * Deletes metadata for domains without permissions in a FIFO manner, once
   * more than 100 distinct origins have been added since boot.
   * Metadata is never deleted for domains with permissions, to prevent a
   * degraded user experience, since metadata cannot yet be requested on demand.
   *
   * @param {string} origin - The origin whose domain metadata to store.
   * @param {Object} metadata - The domain's metadata that will be stored.
   */
  addDomainMetadata(origin, metadata) {
    const oldMetadataState = this.store.getState()[METADATA_STORE_KEY]
    const newMetadataState = { ...oldMetadataState }

    // delete pending metadata origin from queue, and delete its metadata if
    // it doesn't have any permissions
    if (this._pendingSiteMetadata.size >= METADATA_CACHE_MAX_SIZE) {
      const permissionsDomains = this.permissions.getDomains()

      const oldOrigin = this._pendingSiteMetadata.values().next().value
      this._pendingSiteMetadata.delete(oldOrigin)
      if (!permissionsDomains[oldOrigin]) {
        delete newMetadataState[oldOrigin]
      }
    }

    // add new metadata to store after popping
    newMetadataState[origin] = {
      ...oldMetadataState[origin],
      ...metadata,
      lastUpdated: Date.now(),
    }

    if (
      !newMetadataState[origin].extensionId &&
      !newMetadataState[origin].host
    ) {
      newMetadataState[origin].host = new URL(origin).host
    }

    this._pendingSiteMetadata.add(origin)
    this._setDomainMetadata(newMetadataState)
  }

  /**
   * Removes all domains without permissions from the restored metadata state,
   * and rehydrates the metadata store.
   *
   * Requires PermissionsController._initializePermissions to have been called first.
   *
   * @param {Object} restoredState - The restored permissions controller state.
   */
  _initializeMetadataStore(restoredState) {
    const metadataState = restoredState[METADATA_STORE_KEY] || {}
    const newMetadataState = this._trimDomainMetadata(metadataState)

    this._pendingSiteMetadata = new Set()
    this._setDomainMetadata(newMetadataState)
  }

  /**
   * Trims the given metadataState object by removing metadata for all origins
   * without permissions.
   * Returns a new object; does not mutate the argument.
   *
   * @param {Object} metadataState - The metadata store state object to trim.
   * @returns {Object} The new metadata state object.
   */
  _trimDomainMetadata(metadataState) {
    const newMetadataState = { ...metadataState }
    const origins = Object.keys(metadataState)
    const permissionsDomains = this.permissions.getDomains()

    origins.forEach((origin) => {
      if (!permissionsDomains[origin]) {
        delete newMetadataState[origin]
      }
    })

    return newMetadataState
  }

  /**
   * Replaces the existing domain metadata with the passed-in object.
   * @param {Object} newMetadataState - The new metadata to set.
   */
  _setDomainMetadata(newMetadataState) {
    this.store.updateState({ [METADATA_STORE_KEY]: newMetadataState })
  }

  /**
   * Get current set of permitted accounts for the given origin
   *
   * @param {string} origin - The origin to obtain permitted accounts for
   * @returns {Array<string>|null} The list of permitted accounts
   */
  _getPermittedAccounts(origin) {
    const permittedAccounts = this.permissions
      .getPermission(origin, 'eth_accounts')
      ?.caveats?.find((caveat) => caveat.name === CAVEAT_NAMES.exposedAccounts)
      ?.value

    return permittedAccounts || null
  }

  /**
   * When a new account is selected in the UI, emit accountsChanged to each origin
   * where the selected account is exposed.
   *
   * Note: This will emit "false positive" accountsChanged events, but they are
   * handled by the inpage provider.
   *
   * @param {string} account - The newly selected account's address.
   */
  async _handleAccountSelected(account) {
    if (typeof account !== 'string') {
      throw new Error('Selected account should be a non-empty string.')
    }

    const domains = this.permissions.getDomains() || {}
    const connectedDomains = Object.entries(domains)
      .filter(([_, { permissions }]) => {
        const ethAccounts = permissions.find(
          (permission) => permission.parentCapability === 'eth_accounts',
        )
        const exposedAccounts = ethAccounts?.caveats.find(
          (caveat) => caveat.name === 'exposedAccounts',
        )?.value
        return exposedAccounts?.includes(account)
      })
      .map(([domain]) => domain)

    await Promise.all(
      connectedDomains.map((origin) =>
        this._handleConnectedAccountSelected(origin),
      ),
    )
  }

  /**
   * When a new account is selected in the UI, emit accountsChanged to 'origin'
   *
   * Note: This will emit "false positive" accountsChanged events, but they are
   * handled by the inpage provider.
   *
   * @param {string} origin - The origin
   */
  async _handleConnectedAccountSelected(origin) {
    const permittedAccounts = await this.getAccounts(origin)

    this.notifyAccountsChanged(origin, permittedAccounts)
  }

  /**
   * Adds a pending approval.
   * @param {string} id - The id of the pending approval.
   * @param {string} origin - The origin of the pending approval.
   * @param {Function} resolve - The function resolving the pending approval Promise.
   * @param {Function} reject - The function rejecting the pending approval Promise.
   */
  _addPendingApproval(id, origin, resolve, reject) {
    if (
      this.pendingApprovalOrigins.has(origin) ||
      this.pendingApprovals.has(id)
    ) {
      throw new Error(
        `Pending approval with id '${id}' or origin '${origin}' already exists.`,
      )
    }

    this.pendingApprovals.set(id, { origin, resolve, reject })
    this.pendingApprovalOrigins.add(origin)
  }

  /**
   * Removes the pending approval with the given id.
   * @param {string} id - The id of the pending approval to remove.
   */
  _removePendingApproval(id) {
    const { origin } = this.pendingApprovals.get(id)
    this.pendingApprovalOrigins.delete(origin)
    this.pendingApprovals.delete(id)
  }

  /**
   * A convenience method for retrieving a login object
   * or creating a new one if needed.
   *
   * @param {string} origin = The origin string representing the domain.
   */
  _initializePermissions(restoredState) {
    // these permission requests are almost certainly stale
    const initState = { ...restoredState, permissionsRequests: [] }

    this.permissions = new RpcCap(
      {
        // Supports passthrough methods:
        safeMethods: SAFE_METHODS,

        // optional prefix for internal methods
        methodPrefix: WALLET_PREFIX,

        restrictedMethods: this._restrictedMethods,

        /**
         * A promise-returning callback used to determine whether to approve
         * permissions requests or not.
         *
         * Currently only returns a boolean, but eventually should return any
         * specific parameters or amendments to the permissions.
         *
         * @param {string} req - The internal rpc-cap user request object.
         */
        requestUserApproval: async (req) => {
          const {
            metadata: { id, origin },
          } = req

          if (this.pendingApprovalOrigins.has(origin)) {
            throw ethErrors.rpc.resourceUnavailable(
              'Permissions request already pending; please wait.',
            )
          }

          this._showPermissionRequest()

          return new Promise((resolve, reject) => {
            this._addPendingApproval(id, origin, resolve, reject)
          })
        },
      },
      initState,
    )
  }
}

export function addInternalMethodPrefix(method) {
  return WALLET_PREFIX + method
}
