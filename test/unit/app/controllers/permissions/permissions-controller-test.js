import assert from 'assert'
import { find } from 'lodash'

import {
  METADATA_STORE_KEY,
  WALLET_PREFIX,
} from '../../../../../app/scripts/controllers/permissions/enums'

import getRestrictedMethods
  from '../../../../../app/scripts/controllers/permissions/restrictedMethods'

import {
  addInternalMethodPrefix,
} from '../../../../../app/scripts/controllers/permissions'

import {
  getPermController,
  grantPermissions,
  getNotifyDomain,
  getNotifyAllDomains,
  getApprovedPermissionsRequest,
  ACCOUNT_ARRAYS,
  DUMMY_ACCOUNT,
  ERRORS,
  ORIGINS,
  PERM_NAMES,
  PERMS,
  NOTIFICATIONS,
  REQUEST_IDS,
} from './mocks'

let permController

const notifications = Object.values(ORIGINS).reduce((acc, domain) => {
  acc[domain] = []
  return acc
}, {})

const initNotifications = () => {
  Object.values(ORIGINS).forEach((domain) => {
    notifications[domain] = []
  })
}

const initPermController = () => {
  permController = getPermController({
    notifyDomain: getNotifyDomain(notifications),
    notifyAllDomains: getNotifyAllDomains(notifications),
  })
}

const mockRequestUserApproval = (id) => {
  return new Promise((resolve, reject) => {
    permController.pendingApprovals[id] = { resolve, reject }
  })
}

describe('permissions controller', function () {

  describe('getAccounts', function () {

    before(async function () {
      initPermController()
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
        'first origin does not have correct accounts'
      )
      assert.deepEqual(
        bAccounts, ACCOUNT_ARRAYS.b,
        'second origin does not have correct accounts'
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

      initPermController()
      initNotifications()

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
        'first origin does not have correct accounts'
      )
      assert.deepEqual(
        bAccounts, ACCOUNT_ARRAYS.b,
        'second origin does not have correct accounts'
      )
      assert.deepEqual(
        cAccounts, ACCOUNT_ARRAYS.c,
        'third origin does not have correct accounts'
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

    before(function () {
      initPermController()
    })

    beforeEach(async function () {
      initNotifications()
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
        'first origin does not have correct accounts'
      )
      assert.deepEqual(
        bAccounts, ACCOUNT_ARRAYS.b,
        'second origin does not have correct accounts'
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
        'targeted permission only should have been removed'
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
        'first origin does not have correct accounts'
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

    // we do not check notifications in this test, because while the mocks will
    // register notifications, they will be ignored before being emitted if the
    // domain doesn't exist
    it('does nothing for unknown domains', async function () {

      permController.removePermissionsFor({
        [ORIGINS.c]: [PERM_NAMES.eth_accounts],
      })

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      const bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(
        aAccounts, ACCOUNT_ARRAYS.a,
        'first origin does not have correct accounts'
      )
      assert.deepEqual(
        bAccounts, ACCOUNT_ARRAYS.b,
        'second origin does not have correct accounts'
      )

      assert.deepEqual(
        Object.keys(permController.permissions.getDomains()),
        [ORIGINS.a, ORIGINS.b],
        'should have correct domains'
      )
    })
  })

  describe('validatePermittedAccounts', function () {

    before(function () {
      initPermController()
    })

    beforeEach(async function () {
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

      assert.rejects(
        permController.validatePermittedAccounts([DUMMY_ACCOUNT]),
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account'
      )

      assert.rejects(
        permController.validatePermittedAccounts(ACCOUNT_ARRAYS.a.concat(DUMMY_ACCOUNT)),
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account with other accounts'
      )
    })

    it('succeeds if all accounts are in keyring', async function () {

      assert.doesNotReject(
        permController.validatePermittedAccounts(ACCOUNT_ARRAYS.a),
        'should not throw on all keyring accounts'
      )

      assert.doesNotReject(
        permController.validatePermittedAccounts(ACCOUNT_ARRAYS.b),
        'should not throw on single keyring account'
      )

      assert.doesNotReject(
        permController.validatePermittedAccounts(ACCOUNT_ARRAYS.c),
        'should not throw on single keyring account'
      )
    })
  })

  describe('updatePermittedAccounts', function () {

    before(function () {
      initPermController()
    })

    beforeEach(async function () {
      initNotifications()
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

    before(function () {
      initPermController()
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

      assert.deepEqual(perm, PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.b))
    })

    it('handles non-eth_accounts permission', async function () {

      const perm = await permController.finalizePermissionsRequest(
        PERMS.finalizedRequests.test_method(),
        ACCOUNT_ARRAYS.b,
      )

      assert.deepEqual(
        perm, PERMS.finalizedRequests.test_method()
      )
    })
  })

  describe('legacyExposeAccounts', function () {

    // most failures for this method are either covered by finalizePermissionsRequest
    // tests or too difficult to induce in rpc-cap to be worth the trouble

    beforeEach(function () {
      initPermController()
      initNotifications()
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
      assert.equal(historyOrigins[0], ORIGINS.a)

      assert.ok(
        permissionsHistory[ORIGINS.a].eth_accounts,
        'history should have eth_accounts entry'
      )

      assert.deepEqual(
        Object.keys(permissionsHistory[ORIGINS.a].eth_accounts.accounts),
        ACCOUNT_ARRAYS.a,
        'eth_accounts entry accounts should be as expected'
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

    before(function () {
      initPermController()
    })

    beforeEach(async function () {
      initNotifications()
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

    beforeEach(function () {
      initPermController()
    })

    it('does nothing if called on non-existing request', async function () {

      assert.deepEqual(
        permController.pendingApprovals, {},
        'pending approvals empty on init',
      )

      permController.finalizePermissionsRequest = () => {
        throw new Error('should not be reached')
      }

      const request = getApprovedPermissionsRequest(REQUEST_IDS.a, null)

      assert.doesNotReject(
        permController.approvePermissionsRequest(request, null),
        'should not throw on non-existing request'
      )

      assert.deepEqual(
        permController.pendingApprovals, {},
        'pending approvals still empty after request',
      )
    })

    it('rejects invalid requests', async function () {

      let request

      // bad accounts param

      request = getApprovedPermissionsRequest(REQUEST_IDS.a, PERMS.requests.eth_accounts())

      assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.a),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should reject bad accounts'
      )

      // bad param causing above rejection is here
      await permController.approvePermissionsRequest(request, null)

      assert.deepEqual(
        permController.pendingApprovals, {},
        'pending approvals empty after rejection',
      )

      // no permissions

      request = getApprovedPermissionsRequest(REQUEST_IDS.a, {})

      assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.a),
        ERRORS.approvePermissionsRequest.noPermsRequested(),
        'should reject if no permissions in request'
      )

      await permController.approvePermissionsRequest(request, ACCOUNT_ARRAYS.a)

      assert.deepEqual(
        permController.pendingApprovals, {},
        'pending approvals empty after rejection',
      )
    })

    it('approves valid request', async function () {

      const request = getApprovedPermissionsRequest(REQUEST_IDS.a, PERMS.requests.eth_accounts())

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
        'produced expected approved permissions'
      )

      assert.deepEqual(
        permController.pendingApprovals, {},
        'pending approvals empty after approval',
      )
    })

    it('approves valid requests regardless of order', async function () {

      const request1 = getApprovedPermissionsRequest(REQUEST_IDS.a, PERMS.requests.eth_accounts())
      const request2 = getApprovedPermissionsRequest(REQUEST_IDS.b, PERMS.requests.eth_accounts())
      const request3 = getApprovedPermissionsRequest(REQUEST_IDS.c, PERMS.requests.eth_accounts())

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
        'first request produced expected approved permissions'
      )

      assert.deepEqual(
        perms2, PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.b),
        'second request produced expected approved permissions'
      )

      assert.deepEqual(
        permController.pendingApprovals, {},
        'pending approvals empty after approvals',
      )
    })
  })

  describe('rejectPermissionsRequest', function () {

    beforeEach(async function () {
      initPermController()
    })

    it('does nothing if called on non-existing request', async function () {

      assert.deepEqual(
        permController.pendingApprovals, {},
        'pending approvals empty on init',
      )

      assert.doesNotReject(
        permController.rejectPermissionsRequest(REQUEST_IDS.a),
        'should not throw on non-existing request'
      )

      assert.deepEqual(
        permController.pendingApprovals, {},
        'pending approvals still empty after request',
      )
    })

    it('rejects single existing request', async function () {

      assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.a),
        ERRORS.rejectPermissionsRequest.rejection(),
        'rejects as expected'
      )

      await permController.rejectPermissionsRequest(REQUEST_IDS.a)

      assert.deepEqual(
        permController.pendingApprovals, {},
        'pending approvals empty after rejection',
      )
    })

    it('rejects requests regardless of order', async function () {

      assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.b),
        ERRORS.rejectPermissionsRequest.rejection(),
        'rejects as expected'
      )

      assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.c),
        ERRORS.rejectPermissionsRequest.rejection(),
        'rejects as expected'
      )

      // reject out of order
      await permController.rejectPermissionsRequest(REQUEST_IDS.c)
      // add a non-existing request to the mix
      await permController.rejectPermissionsRequest(REQUEST_IDS.a)
      await permController.rejectPermissionsRequest(REQUEST_IDS.b)

      assert.deepEqual(
        permController.pendingApprovals, {},
        'pending approvals empty after approval',
      )
    })
  })

  describe('_requestPermissions', function () {

    beforeEach(async function () {
      initPermController()
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
        Object.keys(permController.pendingApprovals).length, 1,
        'perm controller should have single pending approval',
      )

      const id = Object.keys(permController.pendingApprovals)[0]
      const request = getApprovedPermissionsRequest(id, PERMS.requests.eth_accounts())

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
        Object.keys(permController.pendingApprovals).length, 1,
        'perm controller should have single pending approval',
      )

      const id = Object.keys(permController.pendingApprovals)[0]

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

    before(function () {
      initPermController()
    })

    it('should throw on bad origin', function () {

      assert.throws(
        () => permController.createMiddleware({ origin: {} }),
        ERRORS.createMiddleware.badOrigin()
      )

      assert.throws(
        () => permController.createMiddleware({ origin: '' }),
        ERRORS.createMiddleware.badOrigin(),
      )

      assert.throws(
        () => permController.createMiddleware({}),
        ERRORS.createMiddleware.badOrigin(),
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
        'function name should be "engineAsMiddleware'
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
        'function name should be "engineAsMiddleware'
      )

      const metadataStore = permController.store.getState()[METADATA_STORE_KEY]

      assert.deepEqual(
        metadataStore[ORIGINS.a], { extensionId },
        'metadata should be stored'
      )
    })
  })

  describe('miscellanea and edge cases', function () {

    beforeEach(async function () {
      initPermController()
      initNotifications()
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
