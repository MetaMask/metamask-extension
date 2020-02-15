
import { createSelector } from 'reselect'
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
          (perm) => perm.parentCapability === 'eth_accounts'
        )
        : {}
    )
  }
)

/**
 * Selects the permitted accounts from an eth_accounts permission.
 * Expects input from accountsPermissionsSelector.
 * @returns - An empty array or an array of accounts.
 */
export const getPermittedAccounts = createSelector(
  accountsPermissionSelector, // deep equal check performed on this output
  (accountsPermission = {}) => {

    const accountsCaveat = (
      Array.isArray(accountsPermission.caveats) &&
      accountsPermission.caveats.find(
        (c) => c.name === CAVEAT_NAMES.exposedAccounts
      )
    )

    return (
      accountsCaveat && Array.isArray(accountsCaveat.value)
        ? accountsCaveat.value
        : []
    )
  }
)
