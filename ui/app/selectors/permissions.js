
import { createSelector, createSelectorCreator, defaultMemoize } from 'reselect'
import deepEqual from 'fast-deep-equal'
import {
  CAVEAT_NAMES,
} from '../../../app/scripts/controllers/permissions/enums'

/**
 * TODO:LoginPerSite
 * There are performance gains here once `domain.permissions` is converted
 * to key:value instead of an array. (requires update to rpc-cap)
 */

const permissionsSelector = (state, origin) => {
  console.log('permissionsSelector', origin)
  return origin && state.metamask.domains && state.metamask.domains[origin]
}

// all permissions for the origin probably too expensive for deep equality check
const accountsPermissionSelector = createSelector(
  permissionsSelector,
  (domain = {}) => {

    console.log('accountsPermissionSelector:domain', domain)
    return (
      Array.isArray(domain.permissions)
        ? domain.permissions.find(
          perm => perm.parentCapability === 'eth_accounts'
        )
        : {}
    )
  }
)

// comparing caveats should be cheap, at least for now
const createCaveatEqualSelector = createSelectorCreator(
  defaultMemoize,
  (a = {}, b = {}) => deepEqual(a.caveats, b.caveats)
)

/**
 * Selects the permitted accounts from an eth_accounts permission.
 * Expects input from accountsPermissionsSelector.
 * @returns - An empty array or an array of accounts.
 */
export const permittedAccountsSelector = createCaveatEqualSelector(
  accountsPermissionSelector, // deep equal check performed on this output
  (accountsPermission = {}) => {

    console.log('permittedAccountsSelector:accountsPermission', accountsPermission)
    const accountsCaveat = (
      Array.isArray(accountsPermission.caveats) &&
      accountsPermission.caveats.find(
        c => c.name === CAVEAT_NAMES.exposedAccounts
      )
    )

    console.log('permittedAccountsSelector:accountsCaveat', accountsCaveat)
    return (
      accountsCaveat && Array.isArray(accountsCaveat.value)
        ? accountsCaveat.value
        : []
    )
  }
)
