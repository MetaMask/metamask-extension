import assert from 'assert'

import {
  METADATA_STORE_KEY,
} from '../../../../../app/scripts/controllers/permissions/enums'

import {
  getPermController,
  getEventEmitter,
  grantPermissions,
  getPermissionsMiddleware,
  getApprovedPermissionsRequest,
  rpcRequests,
  ACCOUNT_ARRAYS,
  CAVEATS,
  ERRORS,
  ORIGINS,
  PERM_NAMES,
  PERMS,
} from './mocks'

let permController, eventEmitter

const initPermController = () => {
  permController = getPermController()
}

const initEventEmitter = () => {
  eventEmitter = getEventEmitter()
}

// specify an object and an key with a target object value on that object,
// get a Promise that resolves once something is set on the target
const getWatchPropertyPromise = (object, key) => {

  const handler = {
    set (_obj, prop, _value) {
      eventEmitter.emit(`set:${key}`, prop)
      return Reflect.set(...arguments)
    },
  }

  object[key] = new Proxy(object[key], handler)

  return new Promise((resolve) => {
    eventEmitter.once(`set:${key}`, () => resolve())
  })
}

// specify a name to identify the object and, optionally, an object,
// get a Proxy that emits an event when something is set on the target
const getWatchableObject = (name, object = {}) => {
  const handler = {
    set (_obj, prop, _value) {
      eventEmitter.emit(`set:${name}:${prop}`)
      return Reflect.set(...arguments)
    },
  }
  return new Proxy(object, handler)
}

// get a Promise that resolves once the given prop is set on the object with
// the given name, to be called after getWatchableObject
const getWatchObjectPromise = (name, prop) => {
  return new Promise((resolve) => {
    eventEmitter.once(`set:${name}:${prop}`, () => resolve())
  })
}

const validatePermission = (perm, name, origin, caveats) => {
  assert.equal(name, perm.parentCapability, 'unexpected permission name')
  assert.equal(origin, perm.invoker, 'unexpected permission origin')
  assert.deepEqual(caveats, perm.caveats, 'unexpected permission caveats')
}

describe('permissions middleware', function () {

  describe('wallet_requestPermissions', function () {

    beforeEach(function () {
      initPermController()
    })

    it('grants permissions on user approval', async function () {

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = rpcRequests.requestPermission(
        ORIGINS.a, PERM_NAMES.eth_accounts
      )
      const res = {}

      assert.doesNotReject(
        aMiddleware(req, res),
        'should not reject permissions request'
      )

      assert.equal(
        Object.keys(permController.pendingApprovals).length, 1,
        'perm controller should have single pending approval',
      )

      const id = Object.keys(permController.pendingApprovals)[0]
      const approvedReq = getApprovedPermissionsRequest(id, PERMS.requests.eth_accounts())

      await permController.approvePermissionsRequest(approvedReq, ACCOUNT_ARRAYS.a)

      assert.ok(
        res.result && !res.error,
        'response should have result and no error'
      )

      assert.equal(
        res.result.length, 1,
        'origin should have single approved permission'
      )

      validatePermission(
        res.result[0],
        PERM_NAMES.eth_accounts,
        ORIGINS.a,
        [CAVEATS.eth_accounts(ACCOUNT_ARRAYS.a)]
      )

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(aAccounts, ACCOUNT_ARRAYS.a, 'origin does not have correct accounts')
    })

    it('rejects permissions on user rejection', async function () {

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = rpcRequests.requestPermission(
        ORIGINS.a, PERM_NAMES.eth_accounts
      )
      const res = {}

      const expectedError = ERRORS.rejectPermissionsRequest.rejection()

      assert.rejects(
        aMiddleware(req, res),
        expectedError,
        'request should be rejected with correct error',
      )
        .then(() => {
          assert.ok(
            (
              !res.result && res.error &&
            res.error.message === expectedError.message
            ),
            'response has no result and correct error'
          )
        })

      assert.equal(
        Object.keys(permController.pendingApprovals).length, 1,
        'perm controller should have single pending approval',
      )

      const id = Object.keys(permController.pendingApprovals)[0]

      await permController.rejectPermissionsRequest(id)

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(aAccounts, [], 'origin does not have correct accounts')
    })
  })

  describe('restricted methods', function () {

    beforeEach(function () {
      initPermController()
    })

    it('prevents restricted method access for unpermitted domain', async function () {

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = rpcRequests.test_method(ORIGINS.a)
      const res = {}

      const expectedError = ERRORS.rpcCap.unauthorized()

      assert.rejects(
        aMiddleware(req, res),
        expectedError,
        'request should be rejected with correct error',
      )
        .then(() => {
          assert.ok(
            (
              !res.result && res.error &&
            res.error.code === expectedError.code
            ),
            'response has no result and correct error'
          )
        })
    })

    it('allows restricted method access for permitted domain', async function () {

      const bMiddleware = getPermissionsMiddleware(permController, ORIGINS.b)

      grantPermissions(permController, ORIGINS.b, PERMS.finalizedRequests.test_method())

      const req = rpcRequests.test_method(ORIGINS.b, true)
      const res = {}

      assert.doesNotReject(
        bMiddleware(req, res),
        'should not reject'
      )
        .then(() => {
          assert.ok(
            res.result && res.result === 1,
            'response should have correct result'
          )
        })
    })
  })

  describe('eth_accounts', function () {

    beforeEach(function () {
      initPermController()
    })

    it('returns empty array for non-permitted domain', async function () {

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = rpcRequests.eth_accounts(ORIGINS.a)
      const res = {}

      assert.doesNotReject(
        aMiddleware(req, res),
        'should not reject'
      )
        .then(() => {
          assert.ok(
            res.result && !res.error,
            'response should have result and no error'
          )
          assert.deepEqual(
            res.result, [],
            'response should have correct result'
          )
        })
    })

    it('returns correct accounts for permitted domain', async function () {

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      grantPermissions(permController, ORIGINS.a, PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.a))

      const req = rpcRequests.eth_accounts(ORIGINS.a)
      const res = {}

      assert.doesNotReject(
        aMiddleware(req, res),
        'should not reject'
      )
        .then(() => {
          assert.ok(
            res.result && !res.error,
            'response should have result and no error'
          )
          assert.deepEqual(
            res.result, ACCOUNT_ARRAYS.a,
            'response should have correct result'
          )
        })
    })
  })

  describe('eth_requestAccounts', function () {

    beforeEach(function () {
      initPermController()
      initEventEmitter()
    })

    it('requests accounts for unpermitted origin, and approves on user approval', async function () {

      const pendingApprovalPromise = getWatchPropertyPromise(permController, 'pendingApprovals')

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = rpcRequests.eth_requestAccounts(ORIGINS.a)
      const res = getWatchableObject('response')
      const resultPromise = getWatchObjectPromise('response', 'result')

      assert.doesNotReject(
        aMiddleware(req, res),
        'should not reject permissions request'
      )

      await pendingApprovalPromise

      assert.equal(
        Object.keys(permController.pendingApprovals).length, 1,
        'perm controller should have single pending approval',
      )

      const id = Object.keys(permController.pendingApprovals)[0]
      const approvedReq = getApprovedPermissionsRequest(id, PERMS.requests.eth_accounts())

      await permController.approvePermissionsRequest(approvedReq, ACCOUNT_ARRAYS.a)

      // at this point, the permission should have been granted
      const perms = permController.permissions.getPermissionsForDomain(ORIGINS.a)

      assert.equal(
        perms.length, 1,
        'domain has correct number of permissions'
      )

      validatePermission(
        perms[0],
        PERM_NAMES.eth_accounts,
        ORIGINS.a,
        [CAVEATS.eth_accounts(ACCOUNT_ARRAYS.a)]
      )

      await resultPromise

      // we should also see the accounts on the response
      assert.ok(
        res.result && !res.error,
        'response should have result and no error'
      )

      assert.deepEqual(
        res.result, ACCOUNT_ARRAYS.a,
        'result should have correct accounts'
      )

      // we should also be able to get the accounts independently
      const aAccounts = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(aAccounts, ACCOUNT_ARRAYS.a, 'origin does not have correct accounts')
    })

    it('requests accounts for unpermitted origin, and rejects on user rejection', async function () {

      const pendingApprovalPromise = getWatchPropertyPromise(permController, 'pendingApprovals')

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = rpcRequests.eth_requestAccounts(ORIGINS.a)
      const res = {}
      // const res = getWatchableObject('response')
      // const errorPromise = getWatchObjectPromise('response', 'error')

      const expectedError = ERRORS.rejectPermissionsRequest.rejection()

      assert.rejects(
        aMiddleware(req, res),
        expectedError,
        'request should be rejected with correct error',
      )
        .then(() => {
          assert.ok(
            (
              !res.result && res.error &&
            res.error.message === expectedError.message
            ),
            'response has no result and correct error'
          )
        })

      await pendingApprovalPromise

      assert.equal(
        Object.keys(permController.pendingApprovals).length, 1,
        'perm controller should have single pending approval',
      )

      const id = Object.keys(permController.pendingApprovals)[0]

      await permController.rejectPermissionsRequest(id)

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(aAccounts, [], 'origin does not have correct accounts')
    })

    it('just returns accounts for permitted domain', async function () {

      const cMiddleware = getPermissionsMiddleware(permController, ORIGINS.c)

      grantPermissions(permController, ORIGINS.c, PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.c))

      const req = rpcRequests.eth_requestAccounts(ORIGINS.c)
      const res = {}

      assert.doesNotReject(
        cMiddleware(req, res),
        'should not reject'
      )
        .then(() => {
          assert.ok(
            res.result && !res.error,
            'response should have result and no error'
          )
          assert.deepEqual(
            res.result, ACCOUNT_ARRAYS.c,
            'response should have correct result'
          )
        })
    })
  })

  describe('wallet_sendDomainMetadata', function () {

    beforeEach(function () {
      initPermController()
    })

    it('records domain metadata', async function () {

      const name = 'BAZ'

      const cMiddleware = getPermissionsMiddleware(permController, ORIGINS.c)

      const req = rpcRequests.wallet_sendDomainMetadata(ORIGINS.c, name)
      const res = {}

      assert.doesNotReject(
        cMiddleware(req, res),
        'should not reject'
      )
        .then(() => {

          assert.ok(res.result, 'result should be true')

          const metadataStore = permController.store.getState()[METADATA_STORE_KEY]

          assert.deepEqual(
            metadataStore,
            { [ORIGINS.c]: { name, extensionId: undefined } },
            'metadata should have been added to store'
          )
        })
    })

    it('records domain metadata and preserves extensionId', async function () {

      const extensionId = 'fooExtension'

      const name = 'BAZ'

      const cMiddleware = getPermissionsMiddleware(permController, ORIGINS.c, extensionId)

      const req = rpcRequests.wallet_sendDomainMetadata(ORIGINS.c, name)
      const res = {}

      assert.doesNotReject(
        cMiddleware(req, res),
        'should not reject'
      )
        .then(() => {

          assert.ok(res.result, 'result should be true')

          const metadataStore = permController.store.getState()[METADATA_STORE_KEY]

          assert.deepEqual(
            metadataStore,
            { [ORIGINS.c]: { name, extensionId } },
            'metadata should have been added to store'
          )
        })
    })

    it('does not record domain metadata if no name', async function () {

      const name = null

      const cMiddleware = getPermissionsMiddleware(permController, ORIGINS.c)

      const req = rpcRequests.wallet_sendDomainMetadata(ORIGINS.c, name)
      const res = {}

      assert.doesNotReject(
        cMiddleware(req, res),
        'should not reject'
      )
        .then(() => {

          assert.ok(res.result, 'result should be true')

          const metadataStore = permController.store.getState()[METADATA_STORE_KEY]

          assert.deepEqual(
            metadataStore, {},
            'metadata should not have been added to store'
          )
        })
    })

    it('does not record domain metadata if no metadata', async function () {

      const cMiddleware = getPermissionsMiddleware(permController, ORIGINS.c)

      const req = rpcRequests.wallet_sendDomainMetadata(ORIGINS.c)
      delete req.domainMetadata
      const res = {}

      assert.doesNotReject(
        cMiddleware(req, res),
        'should not reject'
      )
        .then(() => {

          assert.ok(res.result, 'result should be true')

          const metadataStore = permController.store.getState()[METADATA_STORE_KEY]

          assert.deepEqual(
            metadataStore, {},
            'metadata should not have been added to store'
          )
        })
    })
  })
})
