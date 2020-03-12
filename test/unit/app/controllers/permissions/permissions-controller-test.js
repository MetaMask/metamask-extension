import { strict as assert } from 'assert'
import { find } from 'lodash'
import nanoid from 'nanoid'

import {
  METADATA_STORE_KEY,
  WALLET_PREFIX,
} from '../../../../../app/scripts/controllers/permissions/enums'

import getRestrictedMethods
  from '../../../../../app/scripts/controllers/permissions/restrictedMethods'

import {
  PermissionsController,
  addInternalMethodPrefix,
} from '../../../../../app/scripts/controllers/permissions'

import {
  grantPermissions,
} from './helpers'

import {
  noop,
  constants,
  getters,
  getNotifyDomain,
  getNotifyAllDomains,
  getPermControllerOpts,
} from './mocks'

const {
  ERRORS,
  NOTIFICATIONS,
  PERMS,
} = getters

const {
  ACCOUNT_ARRAYS,
  DUMMY_ACCOUNT,
  ORIGINS,
  PERM_NAMES,
  REQUEST_IDS,
} = constants

const initNotifications = () => {
  return Object.values(ORIGINS).reduce((acc, domain) => {
    acc[domain] = []
    return acc
  }, {})
}

const initPermController = (notifications = initNotifications()) => {
  return new PermissionsController({
    ...getPermControllerOpts(),
    notifyDomain: getNotifyDomain(notifications),
    notifyAllDomains: getNotifyAllDomains(notifications),
  })
}

const getMockRequestUserApprovalFunction = (permController) => (id, origin) => {
  return new Promise((resolve, reject) => {
    permController.pendingApprovals.set(id, { origin, resolve, reject })
  })
}

describe('permissions controller', function () {

  describe('getAccounts', function () {

    let permController

    beforeEach(function () {
      permController = initPermController()
      grantPermissions(
        permController, ORIGINS.a,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.a)
      )
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.b)
      )
    })

    it('gets permitted accounts for permitted origins', async function () {

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      const bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(
        aAccounts, ACCOUNT_ARRAYS.a,
        'first origin should have correct accounts'
      )
      assert.deepEqual(
        bAccounts, ACCOUNT_ARRAYS.b,
        'second origin should have correct accounts'
      )
    })

    it('does not get accounts for unpermitted origins', async function () {
      const cAccounts = await permController.getAccounts(ORIGINS.c)
      assert.deepEqual(cAccounts, [], 'origin should have no accounts')
    })

    it('does not handle "MetaMask" origin as special case', async function () {
      const metamaskAccounts = await permController.getAccounts('MetaMask')
      assert.deepEqual(metamaskAccounts, [], 'origin should have no accounts')
    })
  })

  describe('clearPermissions', function () {

    it('notifies all appropriate domains and removes permissions', async function () {

      const notifications = initNotifications()
      const permController = initPermController(notifications)

      grantPermissions(
        permController, ORIGINS.a,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.a)
      )
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.b)
      )
      grantPermissions(
        permController, ORIGINS.c,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.c)
      )

      let aAccounts = await permController.getAccounts(ORIGINS.a)
      let bAccounts = await permController.getAccounts(ORIGINS.b)
      let cAccounts = await permController.getAccounts(ORIGINS.c)

      assert.deepEqual(
        aAccounts, ACCOUNT_ARRAYS.a,
        'first origin should have correct accounts'
      )
      assert.deepEqual(
        bAccounts, ACCOUNT_ARRAYS.b,
        'second origin should have correct accounts'
      )
      assert.deepEqual(
        cAccounts, ACCOUNT_ARRAYS.c,
        'third origin should have correct accounts'
      )

      permController.clearPermissions()

      Object.keys(notifications).forEach((origin) => {
        assert.deepEqual(
          notifications[origin],
          [ NOTIFICATIONS.removedAccounts() ],
          'origin should have single wallet_accountsChanged:[] notification',
        )
      })

      aAccounts = await permController.getAccounts(ORIGINS.a)
      bAccounts = await permController.getAccounts(ORIGINS.b)
      cAccounts = await permController.getAccounts(ORIGINS.c)

      assert.deepEqual(aAccounts, [], 'first origin should have no accounts')
      assert.deepEqual(bAccounts, [], 'second origin should have no accounts')
      assert.deepEqual(cAccounts, [], 'third origin should have no accounts')

      Object.keys(notifications).forEach((origin) => {
        assert.deepEqual(
          permController.permissions.getPermissionsForDomain(origin),
          [],
          'origin should have no permissions'
        )
      })

      assert.deepEqual(
        Object.keys(permController.permissions.getDomains()), [],
        'all domains should be deleted'
      )
    })
  })

  describe('removePermissionsFor', function () {

    let permController, notifications

    beforeEach(function () {
      notifications = initNotifications()
      permController = initPermController(notifications)
      grantPermissions(
        permController, ORIGINS.a,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.a)
      )
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.b)
      )
    })

    it('removes permissions for multiple domains', async function () {

      let aAccounts = await permController.getAccounts(ORIGINS.a)
      let bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(
        aAccounts, ACCOUNT_ARRAYS.a,
        'first origin should have correct accounts'
      )
      assert.deepEqual(
        bAccounts, ACCOUNT_ARRAYS.b,
        'second origin should have correct accounts'
      )

      permController.removePermissionsFor({
        [ORIGINS.a]: [PERM_NAMES.eth_accounts],
        [ORIGINS.b]: [PERM_NAMES.eth_accounts],
      })

      aAccounts = await permController.getAccounts(ORIGINS.a)
      bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(aAccounts, [], 'first origin should have no accounts')
      assert.deepEqual(bAccounts, [], 'second origin should have no accounts')

      assert.deepEqual(
        notifications[ORIGINS.a], [NOTIFICATIONS.removedAccounts()],
        'first origin should have correct notification'
      )
      assert.deepEqual(
        notifications[ORIGINS.b], [NOTIFICATIONS.removedAccounts()],
        'second origin should have correct notification'
      )

      assert.deepEqual(
        Object.keys(permController.permissions.getDomains()), [],
        'all domains should be deleted'
      )
    })

    it('only removes targeted permissions from single domain', async function () {

      grantPermissions(
        permController, ORIGINS.b, PERMS.finalizedRequests.test_method()
      )

      let bPermissions = permController.permissions.getPermissionsForDomain(ORIGINS.b)

      assert.ok(
        (
          bPermissions.length === 2 &&
          find(bPermissions, { parentCapability: PERM_NAMES.eth_accounts }) &&
          find(bPermissions, { parentCapability: PERM_NAMES.test_method })
        ),
        'origin should have correct permissions'
      )

      permController.removePermissionsFor({
        [ORIGINS.b]: [PERM_NAMES.test_method],
      })

      bPermissions = permController.permissions.getPermissionsForDomain(ORIGINS.b)

      assert.ok(
        (
          bPermissions.length === 1 &&
          find(bPermissions, { parentCapability: PERM_NAMES.eth_accounts })
        ),
        'only targeted permission should have been removed'
      )
    })

    it('removes permissions for a single domain, without affecting another', async function () {

      permController.removePermissionsFor({
        [ORIGINS.b]: [PERM_NAMES.eth_accounts],
      })

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      const bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(
        aAccounts, ACCOUNT_ARRAYS.a,
        'first origin should have correct accounts'
      )
      assert.deepEqual(bAccounts, [], 'second origin should have no accounts')

      assert.deepEqual(
        notifications[ORIGINS.a], [],
        'first origin should have no notifications'
      )
      assert.deepEqual(
        notifications[ORIGINS.b], [NOTIFICATIONS.removedAccounts()],
        'second origin should have correct notification'
      )

      assert.deepEqual(
        Object.keys(permController.permissions.getDomains()), [ORIGINS.a],
        'only first origin should remain'
      )
    })

    it('send notification but does not affect permissions for unknown domain', async function () {

      // it knows nothing of this origin
      permController.removePermissionsFor({
        [ORIGINS.c]: [PERM_NAMES.eth_accounts],
      })

      assert.deepEqual(
        notifications[ORIGINS.c], [NOTIFICATIONS.removedAccounts()],
        'unknown origin should have notification'
      )

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      const bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(
        aAccounts, ACCOUNT_ARRAYS.a,
        'first origin should have correct accounts'
      )
      assert.deepEqual(
        bAccounts, ACCOUNT_ARRAYS.b,
        'second origin should have correct accounts'
      )

      assert.deepEqual(
        Object.keys(permController.permissions.getDomains()),
        [ORIGINS.a, ORIGINS.b],
        'should have correct domains'
      )
    })
  })

  describe('validatePermittedAccounts', function () {

    let permController

    beforeEach(function () {
      permController = initPermController()
      grantPermissions(
        permController, ORIGINS.a,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.a)
      )
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.b)
      )
    })

    it('throws error on non-array accounts', async function () {

      assert.rejects(
        permController.validatePermittedAccounts(undefined),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on undefined'
      )

      assert.rejects(
        permController.validatePermittedAccounts(false),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on false'
      )

      assert.rejects(
        permController.validatePermittedAccounts(true),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on true'
      )

      assert.rejects(
        permController.validatePermittedAccounts({}),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on non-array object'
      )
    })

    it('throws error on empty array of accounts', async function () {

      assert.rejects(
        permController.validatePermittedAccounts([]),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on empty array'
      )
    })

    it('throws error if any account value is not in keyring', async function () {

      const keyringAccounts = await permController.getKeyringAccounts()

      assert.rejects(
        permController.validatePermittedAccounts([DUMMY_ACCOUNT]),
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account'
      )

      assert.rejects(
        permController.validatePermittedAccounts(keyringAccounts.concat(DUMMY_ACCOUNT)),
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account with other accounts'
      )
    })

    it('succeeds if all accounts are in keyring', async function () {

      const keyringAccounts = await permController.getKeyringAccounts()

      assert.doesNotReject(
        permController.validatePermittedAccounts(keyringAccounts),
        'should not throw on all keyring accounts'
      )

      assert.doesNotReject(
        permController.validatePermittedAccounts([ keyringAccounts[0] ]),
        'should not throw on single keyring account'
      )

      assert.doesNotReject(
        permController.validatePermittedAccounts([ keyringAccounts[1] ]),
        'should not throw on single keyring account'
      )
    })
  })

  describe('updatePermittedAccounts', function () {

    let permController, notifications

    beforeEach(function () {
      notifications = initNotifications()
      permController = initPermController(notifications)
      grantPermissions(
        permController, ORIGINS.a,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.a)
      )
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.b)
      )
    })

    it('throws on invalid accounts', async function () {

      assert.rejects(
        permController.updatePermittedAccounts(ORIGINS.a, {}),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on non-array accounts param'
      )

      assert.rejects(
        permController.updatePermittedAccounts(ORIGINS.a, []),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on empty array accounts param'
      )

      assert.rejects(
        permController.updatePermittedAccounts(ORIGINS.a, [DUMMY_ACCOUNT]),
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account'
      )
    })

    it('throws if origin invalid or lacks eth_accounts permission', async function () {

      assert.rejects(
        permController.updatePermittedAccounts(false, ACCOUNT_ARRAYS.a),
        ERRORS.updatePermittedAccounts.invalidOrigin(),
        'should throw on invalid origin'
      )

      assert.rejects(
        permController.updatePermittedAccounts(ORIGINS.c, ACCOUNT_ARRAYS.a),
        ERRORS.updatePermittedAccounts.invalidOrigin(),
        'should throw on origin without eth_accounts permission'
      )
    })

    it('successfully updates permitted accounts', async function () {

      await permController.updatePermittedAccounts(ORIGINS.a, ACCOUNT_ARRAYS.b)
      await permController.updatePermittedAccounts(ORIGINS.b, ACCOUNT_ARRAYS.c)

      let aAccounts = await permController.getAccounts(ORIGINS.a)
      let bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(
        aAccounts, ACCOUNT_ARRAYS.b,
        'first origin should have correct accounts'
      )
      assert.deepEqual(
        bAccounts, ACCOUNT_ARRAYS.c,
        'first origin should have correct accounts'
      )

      assert.deepEqual(
        notifications[ORIGINS.a][0],
        NOTIFICATIONS.newAccounts(ACCOUNT_ARRAYS.b),
        'first origin should have correct notification'
      )
      assert.deepEqual(
        notifications[ORIGINS.b][0],
        NOTIFICATIONS.newAccounts(ACCOUNT_ARRAYS.c),
        'second origin should have correct notification'
      )

      await permController.updatePermittedAccounts(ORIGINS.a, ACCOUNT_ARRAYS.c)
      await permController.updatePermittedAccounts(ORIGINS.b, ACCOUNT_ARRAYS.a)

      aAccounts = await permController.getAccounts(ORIGINS.a)
      bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(
        aAccounts, ACCOUNT_ARRAYS.c,
        'first origin should have correct accounts'
      )
      assert.deepEqual(
        bAccounts, ACCOUNT_ARRAYS.a,
        'first origin should have correct accounts'
      )

      assert.deepEqual(
        notifications[ORIGINS.a][1],
        NOTIFICATIONS.newAccounts(ACCOUNT_ARRAYS.c),
        'first origin should have correct notification'
      )
      assert.deepEqual(
        notifications[ORIGINS.b][1],
        NOTIFICATIONS.newAccounts(ACCOUNT_ARRAYS.a),
        'second origin should have correct notification'
      )
    })
  })

  describe('finalizePermissionsRequest', function () {

    let permController

    beforeEach(function () {
      permController = initPermController()
    })

    it('throws on non-keyring accounts', async function () {

      assert.rejects(
        permController.finalizePermissionsRequest(
          PERMS.requests.eth_accounts(), [DUMMY_ACCOUNT]
        ),
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account'
      )
    })

    it('adds caveat to eth_accounts permission', async function () {

      const perm = await permController.finalizePermissionsRequest(
        PERMS.requests.eth_accounts(),
        ACCOUNT_ARRAYS.a,
      )

      assert.deepEqual(perm, PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.a))
    })

    it('replaces caveat of eth_accounts permission', async function () {

      const perm = await permController.finalizePermissionsRequest(
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.a),
        ACCOUNT_ARRAYS.b,
      )

      assert.deepEqual(
        perm, PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.b),
        'permission should have correct caveat'
      )
    })

    it('handles non-eth_accounts permission', async function () {

      const perm = await permController.finalizePermissionsRequest(
        PERMS.finalizedRequests.test_method(),
        ACCOUNT_ARRAYS.b,
      )

      assert.deepEqual(
        perm, PERMS.finalizedRequests.test_method(),
        'permission should have correct caveat'
      )
    })
  })

  describe('legacyExposeAccounts', function () {

    let permController, notifications

    beforeEach(function () {
      notifications = initNotifications()
      permController = initPermController(notifications)
    })

    it('successfully exposes accounts and updates permissions history', async function () {

      let aAccounts = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(aAccounts, [], 'origin should have no accounts')

      await permController.legacyExposeAccounts(ORIGINS.a, ACCOUNT_ARRAYS.a)

      aAccounts = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(aAccounts, ACCOUNT_ARRAYS.a, 'origin should have correct accounts')

      // now, permissions history should be updated
      const permissionsHistory = permController.permissionsLog.getHistory()
      const historyOrigins = Object.keys(permissionsHistory)

      assert.equal(historyOrigins.length, 1, 'should have single origin')
      assert.equal(historyOrigins[0], ORIGINS.a, 'should have correct origin')

      assert.ok(
        permissionsHistory[ORIGINS.a].eth_accounts,
        'history should have eth_accounts entry'
      )

      assert.deepEqual(
        Object.keys(permissionsHistory[ORIGINS.a].eth_accounts.accounts),
        ACCOUNT_ARRAYS.a,
        'should have expected eth_accounts entry accounts'
      )

      // notification should also have been sent
      assert.deepEqual(
        notifications[ORIGINS.a][0],
        NOTIFICATIONS.newAccounts(ACCOUNT_ARRAYS.a),
        'first origin should have correct notification'
      )
    })

    it('throws if called on origin with existing exposed accounts', async function () {

      grantPermissions(
        permController, ORIGINS.a,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.a)
      )

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(aAccounts, ACCOUNT_ARRAYS.a, 'origin should have correct accounts')

      assert.rejects(
        permController.legacyExposeAccounts(ORIGINS.a, ACCOUNT_ARRAYS.b),
        ERRORS.legacyExposeAccounts.forbiddenUsage(),
        'should throw if called on origin with existing exposed accounts'
      )

      const permissionsHistory = permController.permissionsLog.getHistory()
      assert.deepEqual(
        permissionsHistory, {},
        'should not have modified history'
      )
      assert.deepEqual(
        notifications[ORIGINS.a], [],
        'should not have sent notification'
      )
    })

    it('throws if called with bad accounts', async function () {

      assert.rejects(
        permController.legacyExposeAccounts(ORIGINS.a, []),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw if called with no accounts'
      )

      const permissionsHistory = permController.permissionsLog.getHistory()
      assert.deepEqual(
        permissionsHistory, {},
        'should not have modified history'
      )
      assert.deepEqual(
        notifications[ORIGINS.a], [],
        'should not have sent notification'
      )
    })

    it('throws if called with bad origin', async function () {

      assert.rejects(
        permController.legacyExposeAccounts(null, ACCOUNT_ARRAYS.a),
        ERRORS.legacyExposeAccounts.badOrigin(),
        'should throw if called with invalid origin'
      )

      const permissionsHistory = permController.permissionsLog.getHistory()
      assert.deepEqual(
        permissionsHistory, {},
        'should not have modified history'
      )
      Object.keys(notifications).forEach((domain) => {
        assert.deepEqual(
          notifications[domain], [],
          'should not have sent notification'
        )
      })
    })
  })

  describe('handleNewAccountSelected', function () {

    let permController, notifications

    beforeEach(function () {
      notifications = initNotifications()
      permController = initPermController(notifications)
      grantPermissions(
        permController, ORIGINS.a,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.a)
      )
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.b)
      )
    })

    it('throws if invalid origin or account', async function () {

      assert.rejects(
        permController.handleNewAccountSelected({}, DUMMY_ACCOUNT),
        ERRORS.handleNewAccountSelected.invalidParams(),
        'should throw if origin non-string'
      )

      assert.rejects(
        permController.handleNewAccountSelected('', DUMMY_ACCOUNT),
        ERRORS.handleNewAccountSelected.invalidParams(),
        'should throw if origin empty string'
      )

      assert.rejects(
        permController.handleNewAccountSelected(ORIGINS.a, {}),
        ERRORS.handleNewAccountSelected.invalidParams(),
        'should throw if account non-string'
      )

      assert.rejects(
        permController.handleNewAccountSelected(ORIGINS.a, ''),
        ERRORS.handleNewAccountSelected.invalidParams(),
        'should throw if account empty string'
      )
    })

    it('does nothing if account not permitted for origin', async function () {

      await permController.handleNewAccountSelected(
        ORIGINS.b, ACCOUNT_ARRAYS.c[0]
      )

      assert.deepEqual(
        notifications[ORIGINS.b], [],
        'should not have emitted notification'
      )
    })

    it('does nothing if account already first in array', async function () {

      await permController.handleNewAccountSelected(
        ORIGINS.a, ACCOUNT_ARRAYS.a[0]
      )

      assert.deepEqual(
        notifications[ORIGINS.a], [],
        'should not have emitted notification'
      )
    })

    it('emits notification if selected account not first in array', async function () {

      await permController.handleNewAccountSelected(
        ORIGINS.a, ACCOUNT_ARRAYS.a[1]
      )

      assert.deepEqual(
        notifications[ORIGINS.a],
        [NOTIFICATIONS.newAccounts([ ...ACCOUNT_ARRAYS.a ].reverse())],
        'should have emitted notification'
      )
    })
  })

  describe('approvePermissionsRequest', function () {

    let permController, mockRequestUserApproval

    beforeEach(function () {
      permController = initPermController()
      mockRequestUserApproval = getMockRequestUserApprovalFunction(
        permController
      )
    })

    it('does nothing if called on non-existing request', async function () {

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should be empty on init',
      )

      permController.finalizePermissionsRequest = () => {
        throw new Error('should not be reached')
      }

      const request = PERMS.approvedRequest(REQUEST_IDS.a, null)

      assert.doesNotReject(
        permController.approvePermissionsRequest(request, null),
        'should not throw on non-existing request'
      )

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should still be empty after request',
      )
    })

    it('rejects invalid requests', async function () {

      let request

      // bad accounts param

      request = PERMS.approvedRequest(REQUEST_IDS.a, PERMS.requests.eth_accounts())

      assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.a),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should reject bad accounts'
      )

      // bad param causing above rejection is here
      await permController.approvePermissionsRequest(request, null)

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should be empty after rejection',
      )

      // no permissions

      request = PERMS.approvedRequest(REQUEST_IDS.a, {})

      assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.a),
        ERRORS.approvePermissionsRequest.noPermsRequested(),
        'should reject if no permissions in request'
      )

      await permController.approvePermissionsRequest(request, ACCOUNT_ARRAYS.a)

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should be empty after rejection',
      )
    })

    it('approves valid request', async function () {

      const request = PERMS.approvedRequest(REQUEST_IDS.a, PERMS.requests.eth_accounts())

      let perms

      assert.doesNotReject(
        async () => {
          perms = await mockRequestUserApproval(REQUEST_IDS.a)
        },
        'should not reject single valid request'
      )

      await permController.approvePermissionsRequest(request, ACCOUNT_ARRAYS.a)

      assert.deepEqual(
        perms, PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.a),
        'should produce expected approved permissions'
      )

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should be empty after approval',
      )
    })

    it('approves valid requests regardless of order', async function () {

      const request1 = PERMS.approvedRequest(REQUEST_IDS.a, PERMS.requests.eth_accounts())
      const request2 = PERMS.approvedRequest(REQUEST_IDS.b, PERMS.requests.eth_accounts())
      const request3 = PERMS.approvedRequest(REQUEST_IDS.c, PERMS.requests.eth_accounts())

      let perms1, perms2

      assert.doesNotReject(
        async () => {
          perms1 = await mockRequestUserApproval(REQUEST_IDS.a)
        },
        'should not reject request'
      )

      assert.doesNotReject(
        async () => {
          perms2 = await mockRequestUserApproval(REQUEST_IDS.b)
        },
        'should not reject request'
      )

      // approve out of order
      await permController.approvePermissionsRequest(request2, ACCOUNT_ARRAYS.b)
      // add a non-existing request to the mix
      await permController.approvePermissionsRequest(request3, ACCOUNT_ARRAYS.c)
      await permController.approvePermissionsRequest(request1, ACCOUNT_ARRAYS.a)

      assert.deepEqual(
        perms1, PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.a),
        'first request should produce expected approved permissions'
      )

      assert.deepEqual(
        perms2, PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.b),
        'second request should produce expected approved permissions'
      )

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should be empty after approvals',
      )
    })
  })

  describe('rejectPermissionsRequest', function () {

    let permController, mockRequestUserApproval

    beforeEach(async function () {
      permController = initPermController()
      mockRequestUserApproval = getMockRequestUserApprovalFunction(
        permController
      )
    })

    it('does nothing if called on non-existing request', async function () {

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should be empty on init',
      )

      assert.doesNotReject(
        permController.rejectPermissionsRequest(REQUEST_IDS.a),
        'should not throw on non-existing request'
      )

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should still be empty after request',
      )
    })

    it('rejects single existing request', async function () {

      assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.a),
        ERRORS.rejectPermissionsRequest.rejection(),
        'should reject with expected error'
      )

      await permController.rejectPermissionsRequest(REQUEST_IDS.a)

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should be empty after rejection',
      )
    })

    it('rejects requests regardless of order', async function () {

      assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.b),
        ERRORS.rejectPermissionsRequest.rejection(),
        'should reject with expected error'
      )

      assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.c),
        ERRORS.rejectPermissionsRequest.rejection(),
        'should reject with expected error'
      )

      // reject out of order
      await permController.rejectPermissionsRequest(REQUEST_IDS.c)
      // add a non-existing request to the mix
      await permController.rejectPermissionsRequest(REQUEST_IDS.a)
      await permController.rejectPermissionsRequest(REQUEST_IDS.b)

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should be empty after approval',
      )
    })
  })

  describe('_requestPermissions', function () {

    let permController

    beforeEach(function () {
      permController = initPermController()
    })

    it('requests the given permissions and grants them on user approval', async function () {

      permController._requestPermissions(
        ORIGINS.a, PERMS.requests.eth_accounts()
      )
        .then(async (result) => {

          // this is the last thing that will happen in this test

          assert.ok(
            result.length === 1 && result[0].parentCapability === 'eth_accounts',
            'single eth_accounts permission should have been granted'
          )

          const accounts = await permController.getAccounts(ORIGINS.a)
          assert.deepEqual(
            accounts, ACCOUNT_ARRAYS.a, 'origin should have correct accounts'
          )
        })
        .catch(() => {
          assert.fail('promise should not reject')
        })

      const accounts = await permController.getAccounts(ORIGINS.a)

      assert.deepEqual(accounts, [], 'origin should not have any accounts')

      assert.equal(
        permController.pendingApprovals.size, 1,
        'perm controller should have single pending approval',
      )

      const id = permController.pendingApprovals.keys().next().value
      const request = PERMS.approvedRequest(id, PERMS.requests.eth_accounts())

      permController.approvePermissionsRequest(request, ACCOUNT_ARRAYS.a)
    })

    it('requests the given permissions and rejects them on user rejection', async function () {

      permController._requestPermissions(
        ORIGINS.a, PERMS.requests.eth_accounts()
      )
        .then(() => {
          assert.fail('promise should not resolve')
        })
        .catch(async (err) => {

          // this is the last thing that will happen in this test

          assert.equal(
            err.message, ERRORS.rejectPermissionsRequest.rejection().message,
            'rejected with unexpected error'
          )

          const accounts = await permController.getAccounts(ORIGINS.a)
          assert.deepEqual(
            accounts, [], 'origin should have no accounts'
          )
        })

      const accounts = await permController.getAccounts(ORIGINS.a)

      assert.deepEqual(accounts, [], 'origin should not have any accounts')

      assert.equal(
        permController.pendingApprovals.size, 1,
        'perm controller should have single pending approval',
      )

      const id = permController.pendingApprovals.keys().next().value

      permController.rejectPermissionsRequest(id)
    })

    it('throws on bad request', async function () {

      assert.rejects(
        () => permController._requestPermissions(
          ORIGINS.a, PERMS.requests.does_not_exist()
        ),
        'should reject bad request'
      )
    })
  })

  // see permissions-middleware-test for testing the middleware itself
  describe('createMiddleware', function () {

    let permController

    beforeEach(function () {
      permController = initPermController()
    })

    it('should throw on bad origin', function () {

      assert.throws(
        () => permController.createMiddleware({ origin: {} }),
        ERRORS.createMiddleware.badOrigin(),
        'should throw expected error'
      )

      assert.throws(
        () => permController.createMiddleware({ origin: '' }),
        ERRORS.createMiddleware.badOrigin(),
        'should throw expected error'
      )

      assert.throws(
        () => permController.createMiddleware({}),
        ERRORS.createMiddleware.badOrigin(),
        'should throw expected error'
      )
    })

    it('should create a middleware', function () {

      let middleware
      assert.doesNotThrow(
        () => {
          middleware = permController.createMiddleware({ origin: ORIGINS.a })
        },
        'should not throw'
      )

      assert.equal(
        typeof middleware, 'function',
        'should return function'
      )

      assert.equal(
        middleware.name, 'engineAsMiddleware',
        'function name should be "engineAsMiddleware"'
      )
    })

    it('should create a middleware with extensionId', function () {

      const extensionId = 'fooExtension'

      let middleware
      assert.doesNotThrow(
        () => {
          middleware = permController.createMiddleware({
            origin: ORIGINS.a,
            extensionId,
          })
        },
        'should not throw'
      )

      assert.equal(
        typeof middleware, 'function',
        'should return function'
      )

      assert.equal(
        middleware.name, 'engineAsMiddleware',
        'function name should be "engineAsMiddleware"'
      )

      const metadataStore = permController.store.getState()[METADATA_STORE_KEY]

      assert.deepEqual(
        metadataStore[ORIGINS.a], { extensionId },
        'metadata should be stored'
      )
    })
  })

  describe('adding and removing pending approvals', function () {

    let permController

    beforeEach(function () {
      permController = initPermController()
    })

    it('should add and remove pending approval', function () {

      const id = nanoid()
      const origin = ORIGINS.a

      permController._addPendingApproval(id, origin, noop, noop)

      assert.equal(
        permController.pendingApprovals.size, 1,
        'pending approvals should have single entry',
      )

      assert.equal(
        permController.pendingApprovalOrigins.size, 1,
        'pending approval origins should have single item',
      )

      assert.deepEqual(
        permController.pendingApprovals.get(id),
        { origin, resolve: noop, reject: noop },
        'pending approvals should have expected entry'
      )

      assert.ok(
        permController.pendingApprovalOrigins.has(origin),
        'pending approval origins should have expected item',
      )

      permController._removePendingApproval(id)

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should be empty after removal',
      )

      assert.equal(
        permController.pendingApprovalOrigins.size, 0,
        'pending approval origins empty after removal',
      )
    })

    it('should add and remove multiple pending approvals', function () {

      const id1 = nanoid()
      const id2 = nanoid()
      const id3 = nanoid()

      permController._addPendingApproval(id1, ORIGINS.a, noop, noop)
      permController._addPendingApproval(id2, ORIGINS.b, noop, noop)
      permController._addPendingApproval(id3, ORIGINS.c, noop, noop)

      assert.equal(
        permController.pendingApprovals.size, 3,
        'pending approvals should have expected number of entries',
      )

      assert.equal(
        permController.pendingApprovalOrigins.size, 3,
        'pending approval origins should have expected number of items',
      )

      permController._removePendingApproval(id2)

      assert.equal(
        permController.pendingApprovals.size, 2,
        'pending approvals should have expected number of entries',
      )

      assert.equal(
        permController.pendingApprovalOrigins.size, 2,
        'pending approval origins should have expected number of items',
      )

      assert.deepEqual(
        permController.pendingApprovals.get(id1),
        { origin: ORIGINS.a, resolve: noop, reject: noop },
        'pending approvals should have expected entry'
      )
      assert.deepEqual(
        permController.pendingApprovals.get(id3),
        { origin: ORIGINS.c, resolve: noop, reject: noop },
        'pending approvals should have expected entry'
      )

      assert.ok(
        permController.pendingApprovalOrigins.has(ORIGINS.a),
        'pending approval origins should have expected item',
      )
      assert.ok(
        permController.pendingApprovalOrigins.has(ORIGINS.c),
        'pending approval origins should have expected item',
      )
    })

    it('should throw if adding origin twice', function () {

      const id = nanoid()
      const origin = ORIGINS.a

      permController._addPendingApproval(id, origin, noop, noop)

      const otherId = nanoid()

      assert.throws(
        () => permController._addPendingApproval(otherId, origin, noop, noop),
        ERRORS.pendingApprovals.duplicateOriginOrId(otherId, origin),
        'should throw expected error'
      )

      assert.equal(
        permController.pendingApprovals.size, 1,
        'pending approvals should have single entry',
      )

      assert.equal(
        permController.pendingApprovalOrigins.size, 1,
        'pending approval origins should have single item',
      )

      assert.deepEqual(
        permController.pendingApprovals.get(id),
        { origin, resolve: noop, reject: noop },
        'pending approvals should have expected entry'
      )

      assert.ok(
        permController.pendingApprovalOrigins.has(origin),
        'pending approval origins should have expected item',
      )
    })

    it('should throw if adding id twice', function () {

      const id = nanoid()
      const origin = ORIGINS.a

      permController._addPendingApproval(id, origin, noop, noop)

      assert.throws(
        () => permController._addPendingApproval(id, ORIGINS.b, noop, noop),
        ERRORS.pendingApprovals.duplicateOriginOrId(id, ORIGINS.b),
        'should throw expected error'
      )

      assert.equal(
        permController.pendingApprovals.size, 1,
        'pending approvals should have single entry',
      )

      assert.equal(
        permController.pendingApprovalOrigins.size, 1,
        'pending approval origins should have single item',
      )

      assert.deepEqual(
        permController.pendingApprovals.get(id),
        { origin, resolve: noop, reject: noop },
        'pending approvals should have expected entry'
      )

      assert.ok(
        permController.pendingApprovalOrigins.has(origin),
        'pending approval origins should have expected item',
      )
    })
  })

  describe('miscellanea and edge cases', function () {

    let permController, notifications

    beforeEach(function () {
      notifications = initNotifications()
      permController = initPermController(notifications)
    })

    it('notifyDomain handles notifications other than accountsChanged', async function () {

      permController.notifyDomain(ORIGINS.a, NOTIFICATIONS.test())

      assert.deepEqual(
        notifications[ORIGINS.a][0],
        NOTIFICATIONS.test(),
        'origin should have correct notification'
      )
    })

    it('addInternalMethodPrefix', function () {
      const str = 'foo'
      const res = addInternalMethodPrefix(str)
      assert.equal(res, WALLET_PREFIX + str, 'should prefix correctly')
    })

    it('eth_accounts restricted method failure', async function () {
      const restrictedMethods = getRestrictedMethods({
        getKeyringAccounts: async () => {
          throw new Error('foo')
        },
      })

      const res = {}
      restrictedMethods.eth_accounts.method(null, res, null, (err) => {

        const fooError = new Error('foo')

        assert.deepEqual(
          err, fooError,
          'error should be as expected'
        )

        assert.deepEqual(
          res, { error: fooError },
          'response should have correct error and no message'
        )
      })
    })
  })
})
