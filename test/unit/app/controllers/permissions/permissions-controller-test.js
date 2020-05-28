import { strict as assert } from 'assert'
import { find } from 'lodash'
import nanoid from 'nanoid'
import sinon from 'sinon'

import {
  METADATA_STORE_KEY,
  METADATA_CACHE_MAX_SIZE,
  WALLET_PREFIX,
} from '../../../../../app/scripts/controllers/permissions/enums'

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
  ALL_ACCOUNTS,
  ACCOUNTS,
  DUMMY_ACCOUNT,
  ORIGINS,
  PERM_NAMES,
  REQUEST_IDS,
  EXTRA_ACCOUNT,
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
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted)
      )
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted)
      )
    })

    it('gets permitted accounts for permitted origins', async function () {

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      const bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(
        aAccounts, [ACCOUNTS.a.primary],
        'first origin should have correct accounts'
      )
      assert.deepEqual(
        bAccounts, [ACCOUNTS.b.primary],
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

  describe('hasPermission', function () {

    it('returns correct values', async function () {

      const permController = initPermController()
      grantPermissions(
        permController, ORIGINS.a,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted)
      )
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.test_method()
      )

      assert.ok(
        permController.hasPermission(ORIGINS.a, 'eth_accounts'),
        'should return true for granted permission'
      )
      assert.ok(
        permController.hasPermission(ORIGINS.b, 'test_method'),
        'should return true for granted permission'
      )

      assert.ok(
        !permController.hasPermission(ORIGINS.a, 'test_method'),
        'should return false for non-granted permission'
      )
      assert.ok(
        !permController.hasPermission(ORIGINS.b, 'eth_accounts'),
        'should return true for non-granted permission'
      )

      assert.ok(
        !permController.hasPermission('foo', 'eth_accounts'),
        'should return false for unknown origin'
      )
      assert.ok(
        !permController.hasPermission(ORIGINS.b, 'foo'),
        'should return false for unknown permission'
      )
    })
  })

  describe('clearPermissions', function () {

    it('notifies all appropriate domains and removes permissions', async function () {

      const notifications = initNotifications()
      const permController = initPermController(notifications)

      grantPermissions(
        permController, ORIGINS.a,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted)
      )
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted)
      )
      grantPermissions(
        permController, ORIGINS.c,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.c.permitted)
      )

      let aAccounts = await permController.getAccounts(ORIGINS.a)
      let bAccounts = await permController.getAccounts(ORIGINS.b)
      let cAccounts = await permController.getAccounts(ORIGINS.c)


      assert.deepEqual(
        aAccounts, [ACCOUNTS.a.primary],
        'first origin should have correct accounts'
      )
      assert.deepEqual(
        bAccounts, [ACCOUNTS.b.primary],
        'second origin should have correct accounts'
      )
      assert.deepEqual(
        cAccounts, [ACCOUNTS.c.primary],
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
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted)
      )
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted)
      )
    })

    it('removes permissions for multiple domains', async function () {

      let aAccounts = await permController.getAccounts(ORIGINS.a)
      let bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(
        aAccounts, [ACCOUNTS.a.primary],
        'first origin should have correct accounts'
      )
      assert.deepEqual(
        bAccounts, [ACCOUNTS.b.primary],
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
        aAccounts, [ACCOUNTS.a.primary],
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
        aAccounts, [ACCOUNTS.a.primary],
        'first origin should have correct accounts'
      )
      assert.deepEqual(
        bAccounts, [ACCOUNTS.b.primary],
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
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted)
      )
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted)
      )
    })

    it('throws error on non-array accounts', async function () {

      await assert.throws(
        () => permController.validatePermittedAccounts(undefined),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on undefined'
      )

      await assert.throws(
        () => permController.validatePermittedAccounts(false),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on false'
      )

      await assert.throws(
        () => permController.validatePermittedAccounts(true),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on true'
      )

      await assert.throws(
        () => permController.validatePermittedAccounts({}),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on non-array object'
      )
    })

    it('throws error on empty array of accounts', async function () {

      await assert.throws(
        () => permController.validatePermittedAccounts([]),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on empty array'
      )
    })

    it('throws error if any account value is not in keyring', async function () {

      const keyringAccounts = await permController.getKeyringAccounts()

      await assert.throws(
        () => permController.validatePermittedAccounts([DUMMY_ACCOUNT]),
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account'
      )

      await assert.throws(
        () => permController.validatePermittedAccounts(keyringAccounts.concat(DUMMY_ACCOUNT)),
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account with other accounts'
      )
    })

    it('succeeds if all accounts are in keyring', async function () {

      const keyringAccounts = await permController.getKeyringAccounts()

      await assert.doesNotThrow(
        () => permController.validatePermittedAccounts(keyringAccounts),
        'should not throw on all keyring accounts'
      )

      await assert.doesNotThrow(
        () => permController.validatePermittedAccounts([ keyringAccounts[0] ]),
        'should not throw on single keyring account'
      )

      await assert.doesNotThrow(
        () => permController.validatePermittedAccounts([ keyringAccounts[1] ]),
        'should not throw on single keyring account'
      )
    })
  })

  describe('addPermittedAccount', function () {
    let permController, notifications

    beforeEach(function () {
      notifications = initNotifications()
      permController = initPermController(notifications)
      grantPermissions(
        permController, ORIGINS.a,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted)
      )
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted)
      )
    })

    it('should throw if account is not a string', async function () {
      await assert.rejects(
        () => permController.addPermittedAccount(ORIGINS.a, {}),
        ERRORS.validatePermittedAccounts.nonKeyringAccount({}),
        'should throw on non-string account param'
      )
    })

    it('should throw if given account is not in keyring', async function () {
      await assert.rejects(
        () => permController.addPermittedAccount(ORIGINS.a, DUMMY_ACCOUNT),
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account'
      )
    })

    it('should throw if origin is invalid', async function () {
      await assert.rejects(
        () => permController.addPermittedAccount(false, EXTRA_ACCOUNT),
        ERRORS.addPermittedAccount.invalidOrigin(),
        'should throw on invalid origin'
      )
    })

    it('should throw if origin lacks any permissions', async function () {
      await assert.rejects(
        () => permController.addPermittedAccount(ORIGINS.c, EXTRA_ACCOUNT),
        ERRORS.addPermittedAccount.invalidOrigin(),
        'should throw on origin without permissions'
      )
    })

    it('should throw if origin lacks eth_accounts permission', async function () {
      grantPermissions(
        permController, ORIGINS.c,
        PERMS.finalizedRequests.test_method()
      )

      await assert.rejects(
        () => permController.addPermittedAccount(ORIGINS.c, EXTRA_ACCOUNT),
        ERRORS.addPermittedAccount.noEthAccountsPermission(),
        'should throw on origin without eth_accounts permission'
      )
    })

    it('should throw if account is already permitted', async function () {
      await assert.rejects(
        () => permController.addPermittedAccount(ORIGINS.a, ACCOUNTS.a.permitted[0]),
        ERRORS.addPermittedAccount.alreadyPermitted(),
        'should throw if account is already permitted'
      )
    })

    it('should successfully add permitted account', async function () {
      await permController.addPermittedAccount(ORIGINS.a, EXTRA_ACCOUNT)

      const accounts = await permController._getPermittedAccounts(ORIGINS.a)

      assert.deepEqual(
        accounts, [...ACCOUNTS.a.permitted, EXTRA_ACCOUNT],
        'origin should have correct accounts'
      )

      assert.deepEqual(
        notifications[ORIGINS.a][0],
        NOTIFICATIONS.newAccounts([ACCOUNTS.a.primary]),
        'origin should have correct notification'
      )
    })
  })

  describe('removePermittedAccount', function () {
    let permController, notifications

    beforeEach(function () {
      notifications = initNotifications()
      permController = initPermController(notifications)
      grantPermissions(
        permController, ORIGINS.a,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted)
      )
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted)
      )
    })

    it('should throw if account is not a string', async function () {
      await assert.rejects(
        () => permController.removePermittedAccount(ORIGINS.a, {}),
        ERRORS.validatePermittedAccounts.nonKeyringAccount({}),
        'should throw on non-string account param'
      )
    })

    it('should throw if given account is not in keyring', async function () {
      await assert.rejects(
        () => permController.removePermittedAccount(ORIGINS.a, DUMMY_ACCOUNT),
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account'
      )
    })

    it('should throw if origin is invalid', async function () {
      await assert.rejects(
        () => permController.removePermittedAccount(false, EXTRA_ACCOUNT),
        ERRORS.removePermittedAccount.invalidOrigin(),
        'should throw on invalid origin'
      )
    })

    it('should throw if origin lacks any permissions', async function () {
      await assert.rejects(
        () => permController.removePermittedAccount(ORIGINS.c, EXTRA_ACCOUNT),
        ERRORS.removePermittedAccount.invalidOrigin(),
        'should throw on origin without permissions'
      )
    })

    it('should throw if origin lacks eth_accounts permission', async function () {
      grantPermissions(
        permController, ORIGINS.c,
        PERMS.finalizedRequests.test_method()
      )

      await assert.rejects(
        () => permController.removePermittedAccount(ORIGINS.c, EXTRA_ACCOUNT),
        ERRORS.removePermittedAccount.noEthAccountsPermission(),
        'should throw on origin without eth_accounts permission'
      )
    })

    it('should throw if account is not permitted', async function () {
      await assert.rejects(
        () => permController.removePermittedAccount(ORIGINS.b, ACCOUNTS.c.permitted[0]),
        ERRORS.removePermittedAccount.notPermitted(),
        'should throw if account is not permitted'
      )
    })

    it('should successfully remove permitted account', async function () {
      await permController.removePermittedAccount(ORIGINS.a, ACCOUNTS.a.permitted[1])

      const accounts = await permController._getPermittedAccounts(ORIGINS.a)

      assert.deepEqual(
        accounts, ACCOUNTS.a.permitted.filter((acc) => acc !== ACCOUNTS.a.permitted[1]),
        'origin should have correct accounts'
      )

      assert.deepEqual(
        notifications[ORIGINS.a][0],
        NOTIFICATIONS.newAccounts([ACCOUNTS.a.primary]),
        'origin should have correct notification'
      )
    })

    it('should remove eth_accounts permission if removing only permitted account', async function () {
      await permController.removePermittedAccount(ORIGINS.b, ACCOUNTS.b.permitted[0])

      const accounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(
        accounts, [],
        'origin should have no accounts'
      )

      const permission = await permController.permissions.getPermission(
        ORIGINS.b, PERM_NAMES.eth_accounts
      )

      assert.equal(permission, undefined, 'origin should not have eth_accounts permission')

      assert.deepEqual(
        notifications[ORIGINS.b][0],
        NOTIFICATIONS.removedAccounts(),
        'origin should have correct notification'
      )
    })
  })

  describe('finalizePermissionsRequest', function () {

    let permController

    beforeEach(function () {
      permController = initPermController()
    })

    it('throws on non-keyring accounts', async function () {

      await assert.rejects(
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
        ACCOUNTS.a.permitted,
      )

      assert.deepEqual(perm, PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted))
    })

    it('replaces caveat of eth_accounts permission', async function () {

      const perm = await permController.finalizePermissionsRequest(
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
        ACCOUNTS.b.permitted,
      )

      assert.deepEqual(
        perm, PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted),
        'permission should have correct caveat'
      )
    })

    it('handles non-eth_accounts permission', async function () {

      const perm = await permController.finalizePermissionsRequest(
        PERMS.finalizedRequests.test_method(),
        ACCOUNTS.b.permitted,
      )

      assert.deepEqual(
        perm, PERMS.finalizedRequests.test_method(),
        'permission should have correct caveat'
      )
    })
  })

  describe('preferences state update', function () {

    let permController, notifications, preferences, identities

    beforeEach(function () {
      identities = ALL_ACCOUNTS.reduce(
        (identities, account) => {
          identities[account] = {}
          return identities
        },
        {}
      )
      preferences = {
        getState: sinon.stub(),
        subscribe: sinon.stub(),
      }
      preferences.getState.returns({
        identities,
        selectedAddress: DUMMY_ACCOUNT,
      })
      notifications = initNotifications()
      permController = new PermissionsController({
        ...getPermControllerOpts(),
        notifyDomain: getNotifyDomain(notifications),
        notifyAllDomains: getNotifyAllDomains(notifications),
        preferences,
      })
      grantPermissions(
        permController, ORIGINS.b,
        PERMS.finalizedRequests.eth_accounts([...ACCOUNTS.a.permitted, EXTRA_ACCOUNT])
      )
      grantPermissions(
        permController, ORIGINS.c,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted)
      )
    })

    it('should throw if given invalid account', async function () {

      assert(preferences.subscribe.calledOnce)
      assert(preferences.subscribe.firstCall.args.length === 1)
      const onPreferencesUpdate = preferences.subscribe.firstCall.args[0]

      await assert.rejects(
        () => onPreferencesUpdate({ selectedAddress: {} }),
        ERRORS._handleAccountSelected.invalidParams(),
        'should throw if account is not a string'
      )
    })

    it('should do nothing if account not permitted for any origins', async function () {
      assert(preferences.subscribe.calledOnce)
      assert(preferences.subscribe.firstCall.args.length === 1)
      const onPreferencesUpdate = preferences.subscribe.firstCall.args[0]

      await onPreferencesUpdate({ selectedAddress: DUMMY_ACCOUNT })

      assert.deepEqual(
        notifications[ORIGINS.b], [],
        'should not have emitted notification'
      )
      assert.deepEqual(
        notifications[ORIGINS.c], [],
        'should not have emitted notification'
      )
    })

    it('should emit notification if account already first in array for each connected site', async function () {
      identities[ACCOUNTS.a.permitted[0]] = { lastSelected: 1000 }
      assert(preferences.subscribe.calledOnce)
      assert(preferences.subscribe.firstCall.args.length === 1)
      const onPreferencesUpdate = preferences.subscribe.firstCall.args[0]

      await onPreferencesUpdate({ selectedAddress: ACCOUNTS.a.permitted[0] })

      assert.deepEqual(
        notifications[ORIGINS.b],
        [NOTIFICATIONS.newAccounts([ACCOUNTS.a.primary])],
        'should not have emitted notification'
      )
      assert.deepEqual(
        notifications[ORIGINS.c],
        [NOTIFICATIONS.newAccounts([ACCOUNTS.a.primary])],
        'should not have emitted notification'
      )
    })

    it('should emit notification just for connected domains', async function () {
      identities[EXTRA_ACCOUNT] = { lastSelected: 1000 }
      assert(preferences.subscribe.calledOnce)
      assert(preferences.subscribe.firstCall.args.length === 1)
      const onPreferencesUpdate = preferences.subscribe.firstCall.args[0]

      await onPreferencesUpdate({ selectedAddress: EXTRA_ACCOUNT })

      assert.deepEqual(
        notifications[ORIGINS.b],
        [NOTIFICATIONS.newAccounts([EXTRA_ACCOUNT])],
        'should have emitted notification'
      )
      assert.deepEqual(
        notifications[ORIGINS.c], [],
        'should not have emitted notification'
      )
    })

    it('should emit notification for multiple connected domains', async function () {
      identities[ACCOUNTS.a.permitted[1]] = { lastSelected: 1000 }
      assert(preferences.subscribe.calledOnce)
      assert(preferences.subscribe.firstCall.args.length === 1)
      const onPreferencesUpdate = preferences.subscribe.firstCall.args[0]

      await onPreferencesUpdate({ selectedAddress: ACCOUNTS.a.permitted[1] })

      assert.deepEqual(
        notifications[ORIGINS.b],
        [NOTIFICATIONS.newAccounts([ACCOUNTS.a.permitted[1]])],
        'should have emitted notification'
      )
      assert.deepEqual(
        notifications[ORIGINS.c],
        [NOTIFICATIONS.newAccounts([ACCOUNTS.c.primary])],
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

      sinon.spy(permController, 'finalizePermissionsRequest')

      const request = PERMS.approvedRequest(REQUEST_IDS.a, null)

      await assert.doesNotReject(
        permController.approvePermissionsRequest(request, null),
        'should not throw on non-existing request'
      )

      assert.ok(
        permController.finalizePermissionsRequest.notCalled,
        'should not call finalizePermissionRequest'
      )

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should still be empty after request',
      )
    })

    it('rejects request with bad accounts param', async function () {

      const request = PERMS.approvedRequest(
        REQUEST_IDS.a,
        PERMS.requests.eth_accounts()
      )

      const requestRejection = assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.a),
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should reject bad accounts'
      )

      await permController.approvePermissionsRequest(request, null)
      await requestRejection

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should be empty after rejection',
      )
    })

    it('rejects request with no permissions', async function () {

      const request = PERMS.approvedRequest(REQUEST_IDS.a, {})

      const requestRejection = assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.a),
        ERRORS.approvePermissionsRequest.noPermsRequested(),
        'should reject if no permissions in request'
      )

      await permController.approvePermissionsRequest(request, ACCOUNTS.a.permitted)
      await requestRejection

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should be empty after rejection',
      )
    })

    it('approves valid request', async function () {

      const request = PERMS.approvedRequest(REQUEST_IDS.a, PERMS.requests.eth_accounts())

      let perms

      const requestApproval = assert.doesNotReject(
        async () => {
          perms = await mockRequestUserApproval(REQUEST_IDS.a)
        },
        'should not reject single valid request'
      )

      await permController.approvePermissionsRequest(request, ACCOUNTS.a.permitted)
      await requestApproval

      assert.deepEqual(
        perms, PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
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

      const approval1 = assert.doesNotReject(
        async () => {
          perms1 = await mockRequestUserApproval(REQUEST_IDS.a)
        },
        'should not reject request'
      )

      const approval2 = assert.doesNotReject(
        async () => {
          perms2 = await mockRequestUserApproval(REQUEST_IDS.b)
        },
        'should not reject request'
      )

      // approve out of order
      await permController.approvePermissionsRequest(request2, ACCOUNTS.b.permitted)
      // add a non-existing request to the mix
      await permController.approvePermissionsRequest(request3, ACCOUNTS.c.permitted)
      await permController.approvePermissionsRequest(request1, ACCOUNTS.a.permitted)

      await approval1
      await approval2

      assert.deepEqual(
        perms1, PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
        'first request should produce expected approved permissions'
      )

      assert.deepEqual(
        perms2, PERMS.finalizedRequests.eth_accounts(ACCOUNTS.b.permitted),
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

      await assert.doesNotReject(
        permController.rejectPermissionsRequest(REQUEST_IDS.a),
        'should not throw on non-existing request'
      )

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should still be empty after request',
      )
    })

    it('rejects single existing request', async function () {

      const requestRejection = assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.a),
        ERRORS.rejectPermissionsRequest.rejection(),
        'should reject with expected error'
      )

      await permController.rejectPermissionsRequest(REQUEST_IDS.a)
      await requestRejection

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should be empty after rejection',
      )
    })

    it('rejects requests regardless of order', async function () {

      const requestRejection1 = assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.b),
        ERRORS.rejectPermissionsRequest.rejection(),
        'should reject with expected error'
      )

      const requestRejection2 = assert.rejects(
        mockRequestUserApproval(REQUEST_IDS.c),
        ERRORS.rejectPermissionsRequest.rejection(),
        'should reject with expected error'
      )

      // reject out of order
      await permController.rejectPermissionsRequest(REQUEST_IDS.c)
      // add a non-existing request to the mix
      await permController.rejectPermissionsRequest(REQUEST_IDS.a)
      await permController.rejectPermissionsRequest(REQUEST_IDS.b)

      await requestRejection1
      await requestRejection2

      assert.equal(
        permController.pendingApprovals.size, 0,
        'pending approvals should be empty after approval',
      )
    })
  })

  // see permissions-middleware-test for testing the middleware itself
  describe('createMiddleware', function () {

    let permController, clock

    beforeEach(function () {
      permController = initPermController()
      clock = sinon.useFakeTimers(1)
    })

    afterEach(function () {
      clock.restore()
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
        metadataStore[ORIGINS.a], { extensionId, lastUpdated: 1 },
        'metadata should be stored'
      )
    })
  })

  describe('notifyDomain', function () {

    let notifications, permController

    beforeEach(function () {
      notifications = initNotifications()
      permController = initPermController(notifications)
      sinon.spy(permController.permissionsLog, 'updateAccountsHistory')
    })

    it('notifyDomain handles accountsChanged', async function () {

      permController.notifyDomain(
        ORIGINS.a,
        NOTIFICATIONS.newAccounts(ACCOUNTS.a.permitted),
      )

      assert.ok(
        permController.permissionsLog.updateAccountsHistory.calledOnce,
        'permissionsLog.updateAccountsHistory should have been called once'
      )

      assert.deepEqual(
        notifications[ORIGINS.a],
        [ NOTIFICATIONS.newAccounts(ACCOUNTS.a.permitted) ],
        'origin should have correct notification'
      )
    })

    it('notifyDomain handles notifications other than accountsChanged', async function () {

      permController.notifyDomain(ORIGINS.a, NOTIFICATIONS.test())

      assert.ok(
        permController.permissionsLog.updateAccountsHistory.notCalled,
        'permissionsLog.updateAccountsHistory should not have been called'
      )

      assert.deepEqual(
        notifications[ORIGINS.a],
        [ NOTIFICATIONS.test() ],
        'origin should have correct notification'
      )
    })
  })

  describe('addDomainMetadata', function () {

    let permController, clock

    function getMockMetadata (size) {
      const dummyData = {}
      for (let i = 0; i < size; i++) {
        const key = i.toString()
        dummyData[key] = {}
      }
      return dummyData
    }

    beforeEach(function () {
      permController = initPermController()
      permController._setDomainMetadata = sinon.fake()
      clock = sinon.useFakeTimers(1)
    })

    afterEach(function () {
      clock.restore()
    })

    it('calls setter function with expected new state when adding domain', function () {

      permController.store.getState = sinon.fake.returns({
        [METADATA_STORE_KEY]: {
          [ORIGINS.a]: {
            foo: 'bar',
          },
        },
      })

      permController.addDomainMetadata(ORIGINS.b, { foo: 'bar' })

      assert.ok(
        permController.store.getState.called,
        'should have called store.getState'
      )
      assert.equal(
        permController._setDomainMetadata.getCalls().length, 1,
        'should have called _setDomainMetadata once'
      )
      assert.deepEqual(
        permController._setDomainMetadata.lastCall.args,
        [{
          [ORIGINS.a]: {
            foo: 'bar',
          },
          [ORIGINS.b]: {
            foo: 'bar',
            lastUpdated: 1,
          },
        }]
      )
    })

    it('calls setter function with expected new states when updating existing domain', function () {

      permController.store.getState = sinon.fake.returns({
        [METADATA_STORE_KEY]: {
          [ORIGINS.a]: {
            foo: 'bar',
          },
          [ORIGINS.b]: {
            bar: 'baz',
          },
        },
      })

      permController.addDomainMetadata(ORIGINS.b, { foo: 'bar' })

      assert.ok(
        permController.store.getState.called,
        'should have called store.getState'
      )
      assert.equal(
        permController._setDomainMetadata.getCalls().length, 1,
        'should have called _setDomainMetadata once'
      )
      assert.deepEqual(
        permController._setDomainMetadata.lastCall.args,
        [{
          [ORIGINS.a]: {
            foo: 'bar',
          },
          [ORIGINS.b]: {
            foo: 'bar',
            bar: 'baz',
            lastUpdated: 1,
          },
        }]
      )
    })

    it('pops metadata on add when too many origins are pending', function () {

      sinon.spy(permController._pendingSiteMetadata, 'delete')

      const mockMetadata = getMockMetadata(METADATA_CACHE_MAX_SIZE)
      const expectedDeletedOrigin = Object.keys(mockMetadata)[0]

      permController.store.getState = sinon.fake.returns({
        [METADATA_STORE_KEY]: { ...mockMetadata },
      })

      // populate permController._pendingSiteMetadata, as though these origins
      // were actually added
      Object.keys(mockMetadata).forEach((origin) => {
        permController._pendingSiteMetadata.add(origin)
      })

      permController.addDomainMetadata(ORIGINS.a, { foo: 'bar' })

      assert.ok(
        permController.store.getState.called,
        'should have called store.getState'
      )

      const expectedMetadata = {
        ...mockMetadata,
        [ORIGINS.a]: {
          foo: 'bar',
          lastUpdated: 1,
        },
      }
      delete expectedMetadata[expectedDeletedOrigin]

      assert.ok(
        permController._pendingSiteMetadata.delete.calledOnceWithExactly(expectedDeletedOrigin),
        'should have called _pendingSiteMetadata.delete once'
      )
      assert.equal(
        permController._setDomainMetadata.getCalls().length, 1,
        'should have called _setDomainMetadata once'
      )
      assert.deepEqual(
        permController._setDomainMetadata.lastCall.args,
        [expectedMetadata],
      )
    })
  })

  describe('_trimDomainMetadata', function () {

    const permController = initPermController()

    it('trims domain metadata for domains without permissions', function () {

      const metadataArg = {
        [ORIGINS.a]: {},
        [ORIGINS.b]: {},
      }

      permController.permissions.getDomains = sinon.fake.returns({
        [ORIGINS.a]: {},
      })

      const metadataResult = permController._trimDomainMetadata(metadataArg)

      assert.equal(
        permController.permissions.getDomains.getCalls().length, 1,
        'should have called permissions.getDomains once'
      )
      assert.deepEqual(
        metadataResult,
        {
          [ORIGINS.a]: {},
        },
        'should have produced expected state'
      )
    })
  })

  describe('miscellanea and edge cases', function () {

    let permController

    beforeEach(function () {
      permController = initPermController()
    })

    it('requestAccountsPermission calls _requestAccountsPermission with an explicit request ID', async function () {
      const _requestPermissions = sinon.stub(permController, '_requestPermissions').resolves()
      await permController.requestAccountsPermission('example.com')
      assert.ok(_requestPermissions.calledOnceWithExactly(
        sinon.match.object.and(sinon.match.has('origin')).and(sinon.match.has('id')),
        { eth_accounts: {} },
      ))
      _requestPermissions.restore()
    })

    it('_addPendingApproval: should throw if adding origin twice', function () {

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

    it('addInternalMethodPrefix', function () {
      const str = 'foo'
      const res = addInternalMethodPrefix(str)
      assert.equal(res, WALLET_PREFIX + str, 'should prefix correctly')
    })
  })
})
