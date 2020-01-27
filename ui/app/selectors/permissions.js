
import { createSelector, createSelectorCreator, defaultMemoize } from 'reselect'
import deepEqual from 'fast-deep-equal'
import {
  CAVEAT_NAMES,
} from '../../../app/scripts/controllers/permissions/enums'

const permissionsSelector = (state, origin) => {
  return origin && state.metamask.domains && state.metamask.domains[origin]
}

// all permissions for the origin probably too expensive for deep equality check
const accountsPermissionSelector = createSelector(
  permissionsSelector,
  (domain = {}) => {

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
export const getPermittedAccounts = createCaveatEqualSelector(
  accountsPermissionSelector, // deep equal check performed on this output
  (accountsPermission = {}) => {

    const accountsCaveat = (
      Array.isArray(accountsPermission.caveats) &&
      accountsPermission.caveats.find(
        c => c.name === CAVEAT_NAMES.exposedAccounts
      )
    )

    return (
      accountsCaveat && Array.isArray(accountsCaveat.value)
        ? accountsCaveat.value
        : []
    )
  }
)
