import assert from 'assert'
import { cloneDeep } from 'lodash'

import {
  PermissionsController,
} from '../../../../../app/scripts/controllers/permissions'

import {
  getKeyringAccounts,
  getNotifyDomain,
  getNotifyAllDomains,
  platform,
  ACCOUNT_ARRAYS,
  ORIGINS,
  PERMS,
  NOTIFICATIONS,
  ERRORS,
  DUMMY_ACCOUNT,
  noop,
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
  permController = new PermissionsController({
    platform,
    getKeyringAccounts,
    notifyDomain: getNotifyDomain(notifications),
    notifyAllDomains: getNotifyAllDomains(notifications),
  })
}

const grantPermissions = (origin, permissions) => {
  permController.permissions.grantNewPermissions(
    origin, permissions, {}, noop
  )
}

describe('permissions controller', () => {

  describe('getAccounts', () => {

    before(async () => {
      initPermController()
      grantPermissions(ORIGINS.a, PERMS.get.ethAccounts(ACCOUNT_ARRAYS.a))
      grantPermissions(ORIGINS.b, PERMS.get.ethAccounts(ACCOUNT_ARRAYS.b))
    })

    it('gets permitted accounts for permitted origins', async () => {

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      const bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(aAccounts, ACCOUNT_ARRAYS.a, 'first origin does not have correct accounts')
      assert.deepEqual(bAccounts, ACCOUNT_ARRAYS.b, 'second origin does not have correct accounts')
    })

    it('does not get accounts for unpermitted origins', async () => {
      const cAccounts = await permController.getAccounts(ORIGINS.c)
      assert.deepEqual(cAccounts, [], 'origin should have no accounts')
    })

    it('does not handle "MetaMask" origin as special case', async () => {
      const metamaskAccounts = await permController.getAccounts(ORIGINS.metamask)
      assert.deepEqual(metamaskAccounts, [], 'origin should have no accounts')
    })
  })

  describe('removePermissionsFor', () => {

    before(() => {
      initPermController()
    })

    beforeEach(async () => {
      initNotifications()
      grantPermissions(ORIGINS.a, PERMS.get.ethAccounts(ACCOUNT_ARRAYS.a))
      grantPermissions(ORIGINS.b, PERMS.get.ethAccounts(ACCOUNT_ARRAYS.b))
    })

    it('removes permissions for multiple domains', async () => {

      let aAccounts = await permController.getAccounts(ORIGINS.a)
      let bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(aAccounts, ACCOUNT_ARRAYS.a, 'first origin does not have correct accounts')
      assert.deepEqual(bAccounts, ACCOUNT_ARRAYS.b, 'second origin does not have correct accounts')

      permController.removePermissionsFor({
        [ORIGINS.a]: [PERMS.names.ethAccounts],
        [ORIGINS.b]: [PERMS.names.ethAccounts],
      })

      aAccounts = await permController.getAccounts(ORIGINS.a)
      bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(aAccounts, [], 'first origin should have no accounts')
      assert.deepEqual(notifications[ORIGINS.a], [NOTIFICATIONS.removedAccounts()], 'first origin should have correct notification')
      assert.deepEqual(bAccounts, [], 'second origin should have no accounts')
      assert.deepEqual(notifications[ORIGINS.b], [NOTIFICATIONS.removedAccounts()], 'second origin should have correct notification')
      assert.deepEqual(Object.keys(permController.permissions.getDomains()), [], 'all domains should be deleted')
    })

    it('removes permissions for a single domain, without affecting another', async () => {

      permController.removePermissionsFor({
        [ORIGINS.b]: [PERMS.names.ethAccounts],
      })

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      const bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(aAccounts, ACCOUNT_ARRAYS.a, 'first origin does not have correct accounts')
      assert.deepEqual(notifications[ORIGINS.a], [], 'first origin should have no notifications')
      assert.deepEqual(bAccounts, [], 'second origin should have no accounts')
      assert.deepEqual(notifications[ORIGINS.b], [NOTIFICATIONS.removedAccounts()], 'second origin should have correct notification')
      assert.deepEqual(Object.keys(permController.permissions.getDomains()), [ORIGINS.a], 'only first origin should remain')
    })

    // we do not check notifications in this test, because while the mocks will
    // register notifications, they will be ignored before being emitted if the
    // domain doesn't exist
    it('does nothing for unknown domains', async () => {

      permController.removePermissionsFor({
        [ORIGINS.c]: [PERMS.names.ethAccounts],
      })

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      const bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(aAccounts, ACCOUNT_ARRAYS.a, 'first origin does not have correct accounts')
      assert.deepEqual(bAccounts, ACCOUNT_ARRAYS.b, 'second origin does not have correct accounts')
      assert.deepEqual(Object.keys(permController.permissions.getDomains()), [ORIGINS.a, ORIGINS.b], 'should have correct domains')
    })
  })

  describe('validatePermittedAccounts', () => {

    before(() => {
      initPermController()
    })

    beforeEach(async () => {
      grantPermissions(ORIGINS.a, PERMS.get.ethAccounts(ACCOUNT_ARRAYS.a))
      grantPermissions(ORIGINS.b, PERMS.get.ethAccounts(ACCOUNT_ARRAYS.b))
    })

    it('throws error on non-array accounts', async () => {

      assert.rejects(
        async () => {
          await permController.validatePermittedAccounts(undefined)
        },
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on undefined'
      )

      assert.rejects(
        async () => {
          await permController.validatePermittedAccounts(false)
        },
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on false'
      )

      assert.rejects(
        async () => {
          await permController.validatePermittedAccounts(true)
        },
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on true'
      )

      assert.rejects(
        async () => {
          await permController.validatePermittedAccounts({})
        },
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on non-array object'
      )
    })

    it('throws error on empty array of accounts', async () => {

      assert.rejects(
        async () => {
          await permController.validatePermittedAccounts([])
        },
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on empty array'
      )
    })

    it('throws error if any account value is not in keyring', async () => {

      assert.rejects(
        async () => {
          await permController.validatePermittedAccounts([DUMMY_ACCOUNT])
        },
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account'
      )

      assert.rejects(
        async () => {
          await permController.validatePermittedAccounts(ACCOUNT_ARRAYS.a.concat(DUMMY_ACCOUNT))
        },
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account with other accounts'
      )
    })

    it('succeeds if all accounts are in keyring', async () => {

      assert.doesNotReject(
        async () => {
          await permController.validatePermittedAccounts(ACCOUNT_ARRAYS.a)
        },
        'should not throw on all keyring accounts'
      )

      assert.doesNotReject(
        async () => {
          await permController.validatePermittedAccounts(ACCOUNT_ARRAYS.b)
        },
        'should not throw on single keyring account'
      )

      assert.doesNotReject(
        async () => {
          await permController.validatePermittedAccounts(ACCOUNT_ARRAYS.c)
        },
        'should not throw on single keyring account'
      )
    })
  })

  describe('updatePermittedAccounts', () => {

    before(() => {
      initPermController()
    })

    beforeEach(async () => {
      initNotifications()
      grantPermissions(ORIGINS.a, PERMS.get.ethAccounts(ACCOUNT_ARRAYS.a))
      grantPermissions(ORIGINS.b, PERMS.get.ethAccounts(ACCOUNT_ARRAYS.b))
    })

    it('throws on invalid accounts', async () => {

      assert.rejects(
        async () => {
          await permController.updatePermittedAccounts(ORIGINS.a, {})
        },
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on non-array accounts param'
      )

      assert.rejects(
        async () => {
          await permController.updatePermittedAccounts(ORIGINS.a, [])
        },
        ERRORS.validatePermittedAccounts.invalidParam(),
        'should throw on empty array accounts param'
      )

      assert.rejects(
        async () => {
          await permController.updatePermittedAccounts(ORIGINS.a, [DUMMY_ACCOUNT])
        },
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account'
      )
    })

    it('throws if origin invalid or lacks eth_accounts permission', async () => {

      assert.rejects(
        async () => {
          await permController.updatePermittedAccounts(false, ACCOUNT_ARRAYS.a)
        },
        ERRORS.updatePermittedAccounts.invalidOrigin(),
        'should throw on invalid origin'
      )

      assert.rejects(
        async () => {
          await permController.updatePermittedAccounts(ORIGINS.c, ACCOUNT_ARRAYS.a)
        },
        ERRORS.updatePermittedAccounts.invalidOrigin(),
        'should throw on origin without eth_accounts permission'
      )
    })

    it('successfully updates permitted accounts', async () => {

      await permController.updatePermittedAccounts(ORIGINS.a, ACCOUNT_ARRAYS.b)
      await permController.updatePermittedAccounts(ORIGINS.b, ACCOUNT_ARRAYS.c)

      let aAccounts = await permController.getAccounts(ORIGINS.a)
      let bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(aAccounts, ACCOUNT_ARRAYS.b, 'first origin should have correct accounts')
      assert.deepEqual(notifications[ORIGINS.a][0], NOTIFICATIONS.newAccounts(ACCOUNT_ARRAYS.b), 'first origin should have correct notification')
      assert.deepEqual(bAccounts, ACCOUNT_ARRAYS.c, 'first origin should have correct accounts')
      assert.deepEqual(notifications[ORIGINS.b][0], NOTIFICATIONS.newAccounts(ACCOUNT_ARRAYS.c), 'second origin should have correct notification')

      await permController.updatePermittedAccounts(ORIGINS.a, ACCOUNT_ARRAYS.c)
      await permController.updatePermittedAccounts(ORIGINS.b, ACCOUNT_ARRAYS.a)

      aAccounts = await permController.getAccounts(ORIGINS.a)
      bAccounts = await permController.getAccounts(ORIGINS.b)

      assert.deepEqual(aAccounts, ACCOUNT_ARRAYS.c, 'first origin should have correct accounts')
      assert.deepEqual(notifications[ORIGINS.a][1], NOTIFICATIONS.newAccounts(ACCOUNT_ARRAYS.c), 'first origin should have correct notification')
      assert.deepEqual(bAccounts, ACCOUNT_ARRAYS.a, 'first origin should have correct accounts')
      assert.deepEqual(notifications[ORIGINS.b][1], NOTIFICATIONS.newAccounts(ACCOUNT_ARRAYS.a), 'second origin should have correct notification')
    })
  })

  describe('finalizePermissionsRequest', () => {

    before(() => {
      initPermController()
    })

    it('throws on non-keyring accounts', async () => {

      assert.rejects(
        async () => {
          await permController.finalizePermissionsRequest(
            PERMS.request.ethAccounts, [DUMMY_ACCOUNT]
          )
        },
        ERRORS.validatePermittedAccounts.nonKeyringAccount(DUMMY_ACCOUNT),
        'should throw on non-keyring account'
      )
    })

    it('adds caveat to eth_accounts permission', async () => {

      const perm = cloneDeep(PERMS.request.ethAccounts)
      await permController.finalizePermissionsRequest(perm, ACCOUNT_ARRAYS.a)

      assert.deepEqual(perm, PERMS.get.ethAccounts(ACCOUNT_ARRAYS.a))
    })

    it('replaces caveat of eth_accounts permission', async () => {

      const perm = cloneDeep(PERMS.get.ethAccounts(ACCOUNT_ARRAYS.a))
      await permController.finalizePermissionsRequest(perm, ACCOUNT_ARRAYS.b)

      assert.deepEqual(perm, PERMS.get.ethAccounts(ACCOUNT_ARRAYS.b))
    })
  })

  describe('legacyExposeAccounts', () => {

    // most failures for this method are either covered by finalizePermissionsRequest
    // tests or too difficult to induce in rpc-cap to be worth the trouble

    beforeEach(() => {
      initPermController()
    })

    it('successfully exposes accounts', async () => {

      let aAccounts = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(aAccounts, [], 'origin should have no accounts')

      await permController.legacyExposeAccounts(ORIGINS.a, ACCOUNT_ARRAYS.a)

      aAccounts = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(aAccounts, ACCOUNT_ARRAYS.a, 'origin should have correct accounts')
    })

    it('throws if called on origin with existing exposed accounts', async () => {

      grantPermissions(ORIGINS.a, PERMS.get.ethAccounts(ACCOUNT_ARRAYS.a))

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(aAccounts, ACCOUNT_ARRAYS.a, 'origin should correct accounts')

      assert.rejects(
        async () => {
          await permController.legacyExposeAccounts(ORIGINS.a, ACCOUNT_ARRAYS.b)
        },
        ERRORS.legacyExposeAccounts.forbiddenUsage(),
        'should throw if called on origin with existing exposed accounts'
      )
    })
  })

  describe('handleNewAccountSelected', () => {

    before(() => {
      initPermController()
    })

    beforeEach(async () => {
      initNotifications()
      grantPermissions(ORIGINS.a, PERMS.get.ethAccounts(ACCOUNT_ARRAYS.a))
      grantPermissions(ORIGINS.b, PERMS.get.ethAccounts(ACCOUNT_ARRAYS.b))
    })

    it('throws if invalid origin or account', async () => {

      assert.rejects(
        async () => {
          await permController.handleNewAccountSelected({}, DUMMY_ACCOUNT)
        },
        ERRORS.handleNewAccountSelected.invalidParams(),
        'should throw if origin non-string'
      )

      assert.rejects(
        async () => {
          await permController.handleNewAccountSelected('', DUMMY_ACCOUNT)
        },
        ERRORS.handleNewAccountSelected.invalidParams(),
        'should throw if origin empty string'
      )

      assert.rejects(
        async () => {
          await permController.handleNewAccountSelected(ORIGINS.a, {})
        },
        ERRORS.handleNewAccountSelected.invalidParams(),
        'should throw if account non-string'
      )

      assert.rejects(
        async () => {
          await permController.handleNewAccountSelected(ORIGINS.a, '')
        },
        ERRORS.handleNewAccountSelected.invalidParams(),
        'should throw if account empty string'
      )
    })

    it('does nothing if account not permitted for origin', async () => {

      await permController.handleNewAccountSelected(ORIGINS.b, ACCOUNT_ARRAYS.c[0])

      assert.deepEqual(notifications[ORIGINS.b], [], 'should not have emitted notification')
    })

    it('does nothing if account already first in array', async () => {

      await permController.handleNewAccountSelected(ORIGINS.a, ACCOUNT_ARRAYS.a[0])

      assert.deepEqual(notifications[ORIGINS.a], [], 'should not have emitted notification')
    })

    it('emits notification if selected account not first in array', async () => {

      await permController.handleNewAccountSelected(ORIGINS.a, ACCOUNT_ARRAYS.a[1])

      assert.deepEqual(
        notifications[ORIGINS.a],
        [NOTIFICATIONS.newAccounts(ACCOUNT_ARRAYS.a.reverse())],
        'should have emitted notification'
      )
    })
  })
})
