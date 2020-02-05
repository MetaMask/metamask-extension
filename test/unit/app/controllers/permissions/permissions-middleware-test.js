import assert from 'assert'

import {
  PermissionsController,
} from '../../../../../app/scripts/controllers/permissions'

import {
  METADATA_STORE_KEY,
} from '../../../../../app/scripts/controllers/permissions/enums'

import {
  getKeyringAccounts,
  getApprovedPermissionsRequest,
  getRestrictedMethods,
  platform,
  rpcRequests,
  ACCOUNT_ARRAYS,
  CAVEATS,
  ERRORS,
  ORIGINS,
  PERMS,
  noop,
} from './mocks'

const EventEmitter = require('events')

let permController, eventEmitter

const initPermController = () => {
  permController = new PermissionsController({
    platform,
    getKeyringAccounts,
    notifyDomain: noop,
    notifyAllDomains: noop,
    getRestrictedMethods,
  })
}

const initEventEmitter = () => {
  eventEmitter = new EventEmitter()
}

const grantPermissions = (origin, permissions) => {
  permController.permissions.grantNewPermissions(
    origin, permissions, {}, noop
  )
}

// returns a Promise-wrapped middleware function with convenient default args
const getPermissionsMiddleware = (origin, extensionId) => {
  const middleware = permController.createMiddleware({ origin, extensionId })
  return (req, res = {}, next = noop, end) => {
    return new Promise((resolve, reject) => {

      end = end || _end

      middleware(req, res, next, end)

      // emulates json-rpc-engine error handling
      function _end (err) {
        if (err || res.error) {
          reject(err || res.error)
        } else {
          resolve(res)
        }
      }
    })
  }
}

// specify an object and an key with a target object value on that object,
// get a Promise that resolves once something is set on the target
const watchPropAndGetPromise = (object, key) => {

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

describe('permissions middleware', () => {

  const validatePermission = (perm, name, origin, caveats) => {
    assert.equal(name, perm.parentCapability, 'unexpected permission name')
    assert.equal(origin, perm.invoker, 'unexpected permission origin')
    assert.deepEqual(caveats, perm.caveats, 'unexpected permission caveats')
  }

  describe('requesting permissions', () => {

    beforeEach(() => {
      initPermController()
    })

    it('grants permissions on user approval', async () => {

      const aMiddleware = getPermissionsMiddleware(ORIGINS.a)

      const req = rpcRequests.requestPermission(
        ORIGINS.a, PERMS.names.eth_accounts
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
      const approvedReq = getApprovedPermissionsRequest(id, PERMS.request.eth_accounts())

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
        PERMS.names.eth_accounts,
        ORIGINS.a,
        [CAVEATS.eth_accounts(ACCOUNT_ARRAYS.a)]
      )

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(aAccounts, ACCOUNT_ARRAYS.a, 'origin does not have correct accounts')
    })

    it('rejects permissions on user rejection', async () => {

      const aMiddleware = getPermissionsMiddleware(ORIGINS.a)

      const req = rpcRequests.requestPermission(
        ORIGINS.a, PERMS.names.eth_accounts
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

  describe('restricted methods', () => {

    beforeEach(() => {
      initPermController()
    })

    it('prevents restricted method access for unpermitted domain', async () => {

      const aMiddleware = getPermissionsMiddleware(ORIGINS.a)

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

    it('allows restricted method access for permitted domain', async () => {

      const bMiddleware = getPermissionsMiddleware(ORIGINS.b)

      grantPermissions(ORIGINS.b, PERMS.complete.test_method())

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

  describe('eth_accounts', () => {

    beforeEach(() => {
      initPermController()
    })

    it('returns empty array for non-permitted domain', async () => {

      const aMiddleware = getPermissionsMiddleware(ORIGINS.a)

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

    it('returns correct accounts for permitted domain', async () => {

      const aMiddleware = getPermissionsMiddleware(ORIGINS.a)

      grantPermissions(ORIGINS.a, PERMS.complete.eth_accounts(ACCOUNT_ARRAYS.a))

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

  describe('eth_requestAccounts', () => {

    beforeEach(() => {
      initPermController()
      initEventEmitter()
    })

    it('requests accounts for unpermitted origin, and approves on user approval', async () => {

      const pendingApprovalPromise = watchPropAndGetPromise(permController, 'pendingApprovals')

      const aMiddleware = getPermissionsMiddleware(ORIGINS.a)

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
      const approvedReq = getApprovedPermissionsRequest(id, PERMS.request.eth_accounts())

      await permController.approvePermissionsRequest(approvedReq, ACCOUNT_ARRAYS.a)

      // at this point, the permission should have been granted
      const perms = permController.permissions.getPermissionsForDomain(ORIGINS.a)

      assert.equal(
        perms.length, 1,
        'domain has correct number of permissions'
      )

      validatePermission(
        perms[0],
        PERMS.names.eth_accounts,
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

    it('requests accounts for unpermitted origin, and rejects on user rejection', async () => {

      const pendingApprovalPromise = watchPropAndGetPromise(permController, 'pendingApprovals')

      const aMiddleware = getPermissionsMiddleware(ORIGINS.a)

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

    it('just returns accounts for permitted domain', async () => {

      const cMiddleware = getPermissionsMiddleware(ORIGINS.c)

      grantPermissions(ORIGINS.c, PERMS.complete.eth_accounts(ACCOUNT_ARRAYS.c))

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

  describe('wallet_sendDomainMetadata', () => {

    beforeEach(() => {
      initPermController()
    })

    it('records domain metadata', async () => {

      const name = 'BAZ'

      const cMiddleware = getPermissionsMiddleware(ORIGINS.c)

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

    it('records domain metadata and preserves extensionId', async () => {

      const extensionId = 'fooExtension'

      const name = 'BAZ'

      const cMiddleware = getPermissionsMiddleware(ORIGINS.c, extensionId)

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

    it('does not record domain metadata if no name', async () => {

      const name = null

      const cMiddleware = getPermissionsMiddleware(ORIGINS.c)

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

    it('does not record domain metadata if no metadata', async () => {

      const cMiddleware = getPermissionsMiddleware(ORIGINS.c)

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
