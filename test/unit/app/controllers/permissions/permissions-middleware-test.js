import { strict as assert } from 'assert'

import {
  METADATA_STORE_KEY,
} from '../../../../../app/scripts/controllers/permissions/enums'

import {
  PermissionsController,
} from '../../../../../app/scripts/controllers/permissions'

import {
  getUserApprovalPromise,
  grantPermissions,
} from './helpers'

import {
  constants,
  getters,
  getPermControllerOpts,
  getPermissionsMiddleware,
} from './mocks'

const {
  CAVEATS,
  ERRORS,
  PERMS,
  RPC_REQUESTS,
} = getters

const {
  ACCOUNT_ARRAYS,
  ORIGINS,
  PERM_NAMES,
} = constants

const validatePermission = (perm, name, origin, caveats) => {
  assert.equal(name, perm.parentCapability, 'should have expected permission name')
  assert.equal(origin, perm.invoker, 'should have expected permission origin')
  if (caveats) {
    assert.deepEqual(caveats, perm.caveats, 'should have expected permission caveats')
  } else {
    assert.ok(!perm.caveats, 'should not have any caveats')
  }
}

const initPermController = () => {
  return new PermissionsController({
    ...getPermControllerOpts(),
  })
}

describe('permissions middleware', function () {

  describe('wallet_requestPermissions', function () {

    let permController

    beforeEach(function () {
      permController = initPermController()
    })

    it('grants permissions on user approval', async function () {

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = RPC_REQUESTS.requestPermission(
        ORIGINS.a, PERM_NAMES.eth_accounts
      )
      const res = {}

      const pendingApproval = assert.doesNotReject(
        aMiddleware(req, res),
        'should not reject permissions request'
      )

      assert.equal(
        permController.pendingApprovals.size, 1,
        'perm controller should have single pending approval',
      )

      const id = permController.pendingApprovals.keys().next().value
      const approvedReq = PERMS.approvedRequest(id, PERMS.requests.eth_accounts())

      await permController.approvePermissionsRequest(approvedReq, ACCOUNT_ARRAYS.a)
      await pendingApproval

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
      assert.deepEqual(
        aAccounts, ACCOUNT_ARRAYS.a,
        'origin should have correct accounts'
      )
    })

    it('handles serial approved requests that overwrite existing permissions', async function () {

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      // create first request

      const req1 = RPC_REQUESTS.requestPermission(
        ORIGINS.a, PERM_NAMES.eth_accounts
      )
      const res1 = {}

      // send, approve, and validate first request
      // note use of ACCOUNT_ARRAYS.a

      const pendingApproval1 = assert.doesNotReject(
        aMiddleware(req1, res1),
        'should not reject permissions request'
      )

      const id1 = permController.pendingApprovals.keys().next().value
      const approvedReq1 = PERMS.approvedRequest(id1, PERMS.requests.eth_accounts())

      await permController.approvePermissionsRequest(approvedReq1, ACCOUNT_ARRAYS.a)
      await pendingApproval1

      assert.ok(
        res1.result && !res1.error,
        'response should have result and no error'
      )

      assert.equal(
        res1.result.length, 1,
        'origin should have single approved permission'
      )

      validatePermission(
        res1.result[0],
        PERM_NAMES.eth_accounts,
        ORIGINS.a,
        [CAVEATS.eth_accounts(ACCOUNT_ARRAYS.a)]
      )

      const accounts1 = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(
        accounts1, ACCOUNT_ARRAYS.a,
        'origin should have correct accounts'
      )

      // create second request

      const requestedPerms2 = {
        ...PERMS.requests.eth_accounts(),
        ...PERMS.requests.test_method(),
      }

      const req2 = RPC_REQUESTS.requestPermissions(
        ORIGINS.a, { ...requestedPerms2 }
      )
      const res2 = {}

      // send, approve, and validate second request
      // note use of ACCOUNT_ARRAYS.b

      const pendingApproval2 = assert.doesNotReject(
        aMiddleware(req2, res2),
        'should not reject permissions request'
      )

      const id2 = permController.pendingApprovals.keys().next().value
      const approvedReq2 = PERMS.approvedRequest(id2, { ...requestedPerms2 })

      await permController.approvePermissionsRequest(approvedReq2, ACCOUNT_ARRAYS.b)
      await pendingApproval2

      assert.ok(
        res2.result && !res2.error,
        'response should have result and no error'
      )

      assert.equal(
        res2.result.length, 2,
        'origin should have single approved permission'
      )

      validatePermission(
        res2.result[0],
        PERM_NAMES.eth_accounts,
        ORIGINS.a,
        [CAVEATS.eth_accounts(ACCOUNT_ARRAYS.b)]
      )

      validatePermission(
        res2.result[1],
        PERM_NAMES.test_method,
        ORIGINS.a,
      )

      const accounts2 = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(
        accounts2, ACCOUNT_ARRAYS.b,
        'origin should have correct accounts'
      )
    })

    it('rejects permissions on user rejection', async function () {

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = RPC_REQUESTS.requestPermission(
        ORIGINS.a, PERM_NAMES.eth_accounts
      )
      const res = {}

      const expectedError = ERRORS.rejectPermissionsRequest.rejection()

      const requestRejection = assert.rejects(
        aMiddleware(req, res),
        expectedError,
        'request should be rejected with correct error',
      )

      assert.equal(
        permController.pendingApprovals.size, 1,
        'perm controller should have single pending approval',
      )

      const id = permController.pendingApprovals.keys().next().value

      await permController.rejectPermissionsRequest(id)
      await requestRejection

      assert.ok(
        (
          !res.result && res.error &&
          res.error.message === expectedError.message
        ),
        'response should have expected error and no result'
      )

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(
        aAccounts, [], 'origin should have have correct accounts'
      )
    })

    it('rejects requests with unknown permissions', async function () {

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = RPC_REQUESTS.requestPermissions(
        ORIGINS.a, {
          ...PERMS.requests.does_not_exist(),
          ...PERMS.requests.test_method(),
        }
      )
      const res = {}

      const expectedError = ERRORS.rejectPermissionsRequest.methodNotFound(
        PERM_NAMES.does_not_exist
      )

      await assert.rejects(
        aMiddleware(req, res),
        expectedError,
        'request should be rejected with correct error',
      )

      assert.equal(
        permController.pendingApprovals.size, 0,
        'perm controller should have no pending approvals',
      )

      assert.ok(
        (
          !res.result && res.error &&
          res.error.message === expectedError.message
        ),
        'response should have expected error and no result'
      )
    })

    it('accepts only a single pending permissions request per origin', async function () {

      const expectedError = ERRORS.pendingApprovals.requestAlreadyPending()

      // two middlewares for two origins

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)
      const bMiddleware = getPermissionsMiddleware(permController, ORIGINS.b)

      // create and start processing first request for first origin

      const reqA1 = RPC_REQUESTS.requestPermission(
        ORIGINS.a, PERM_NAMES.test_method
      )
      const resA1 = {}

      const requestApproval1 = assert.doesNotReject(
        aMiddleware(reqA1, resA1),
        'should not reject permissions request'
      )

      // create and start processing first request for second origin

      const reqB1 = RPC_REQUESTS.requestPermission(
        ORIGINS.b, PERM_NAMES.test_method
      )
      const resB1 = {}

      const requestApproval2 = assert.doesNotReject(
        bMiddleware(reqB1, resB1),
        'should not reject permissions request'
      )

      assert.equal(
        permController.pendingApprovals.size, 2,
        'perm controller should have expected number of pending approvals',
      )

      // create and start processing second request for first origin,
      // which should throw

      const reqA2 = RPC_REQUESTS.requestPermission(
        ORIGINS.a, PERM_NAMES.test_method
      )
      const resA2 = {}

      await assert.rejects(
        aMiddleware(reqA2, resA2),
        expectedError,
        'request should be rejected with correct error',
      )

      assert.ok(
        (
          !resA2.result && resA2.error &&
          resA2.error.message === expectedError.message
        ),
        'response should have expected error and no result'
      )

      // first requests for both origins should remain

      assert.equal(
        permController.pendingApprovals.size, 2,
        'perm controller should have expected number of pending approvals',
      )

      // now, remaining pending requests should be approved without issue

      for (const id of permController.pendingApprovals.keys()) {
        await permController.approvePermissionsRequest(
          PERMS.approvedRequest(id, PERMS.requests.test_method())
        )
      }
      await requestApproval1
      await requestApproval2

      assert.ok(
        resA1.result && !resA1.error,
        'first response should have result and no error'
      )
      assert.equal(
        resA1.result.length, 1,
        'first origin should have single approved permission'
      )

      assert.ok(
        resB1.result && !resB1.error,
        'second response should have result and no error'
      )
      assert.equal(
        resB1.result.length, 1,
        'second origin should have single approved permission'
      )

      assert.equal(
        permController.pendingApprovals.size, 0,
        'perm controller should have expected number of pending approvals',
      )
    })
  })

  describe('restricted methods', function () {

    let permController

    beforeEach(function () {
      permController = initPermController()
    })

    it('prevents restricted method access for unpermitted domain', async function () {

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = RPC_REQUESTS.test_method(ORIGINS.a)
      const res = {}

      const expectedError = ERRORS.rpcCap.unauthorized()

      await assert.rejects(
        aMiddleware(req, res),
        expectedError,
        'request should be rejected with correct error',
      )

      assert.ok(
        (
          !res.result && res.error &&
          res.error.code === expectedError.code
        ),
        'response should have expected error and no result'
      )
    })

    it('allows restricted method access for permitted domain', async function () {

      const bMiddleware = getPermissionsMiddleware(permController, ORIGINS.b)

      grantPermissions(permController, ORIGINS.b, PERMS.finalizedRequests.test_method())

      const req = RPC_REQUESTS.test_method(ORIGINS.b, true)
      const res = {}

      await assert.doesNotReject(
        bMiddleware(req, res),
        'should not reject'
      )

      assert.ok(
        res.result && res.result === 1,
        'response should have correct result'
      )
    })
  })

  describe('eth_accounts', function () {

    let permController

    beforeEach(function () {
      permController = initPermController()
    })

    it('returns empty array for non-permitted domain', async function () {

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = RPC_REQUESTS.eth_accounts(ORIGINS.a)
      const res = {}

      await assert.doesNotReject(
        aMiddleware(req, res),
        'should not reject'
      )

      assert.ok(
        res.result && !res.error,
        'response should have result and no error'
      )
      assert.deepEqual(
        res.result, [],
        'response should have correct result'
      )
    })

    it('returns correct accounts for permitted domain', async function () {

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      grantPermissions(
        permController, ORIGINS.a,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.a)
      )

      const req = RPC_REQUESTS.eth_accounts(ORIGINS.a)
      const res = {}

      await assert.doesNotReject(
        aMiddleware(req, res),
        'should not reject'
      )

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

  describe('eth_requestAccounts', function () {

    let permController

    beforeEach(function () {
      permController = initPermController()
    })

    it('requests accounts for unpermitted origin, and approves on user approval', async function () {

      const userApprovalPromise = getUserApprovalPromise(permController)

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = RPC_REQUESTS.eth_requestAccounts(ORIGINS.a)
      const res = {}

      const pendingApproval = assert.doesNotReject(
        aMiddleware(req, res),
        'should not reject permissions request'
      )

      await userApprovalPromise

      assert.equal(
        permController.pendingApprovals.size, 1,
        'perm controller should have single pending approval',
      )

      const id = permController.pendingApprovals.keys().next().value
      const approvedReq = PERMS.approvedRequest(id, PERMS.requests.eth_accounts())

      await permController.approvePermissionsRequest(approvedReq, ACCOUNT_ARRAYS.a)

      // wait for permission to be granted
      await pendingApproval

      const perms = permController.permissions.getPermissionsForDomain(ORIGINS.a)

      assert.equal(
        perms.length, 1,
        'domain should have correct number of permissions'
      )

      validatePermission(
        perms[0],
        PERM_NAMES.eth_accounts,
        ORIGINS.a,
        [CAVEATS.eth_accounts(ACCOUNT_ARRAYS.a)]
      )

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
      assert.deepEqual(
        aAccounts, ACCOUNT_ARRAYS.a, 'origin should have have correct accounts'
      )
    })

    it('requests accounts for unpermitted origin, and rejects on user rejection', async function () {

      const userApprovalPromise = getUserApprovalPromise(permController)

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = RPC_REQUESTS.eth_requestAccounts(ORIGINS.a)
      const res = {}

      const expectedError = ERRORS.rejectPermissionsRequest.rejection()

      const requestRejection = assert.rejects(
        aMiddleware(req, res),
        expectedError,
        'request should be rejected with correct error',
      )

      await userApprovalPromise

      assert.equal(
        permController.pendingApprovals.size, 1,
        'perm controller should have single pending approval',
      )

      const id = permController.pendingApprovals.keys().next().value

      await permController.rejectPermissionsRequest(id)
      await requestRejection

      assert.ok(
        (
          !res.result && res.error &&
          res.error.message === expectedError.message
        ),
        'response should have expected error and no result'
      )

      const aAccounts = await permController.getAccounts(ORIGINS.a)
      assert.deepEqual(
        aAccounts, [], 'origin should have have correct accounts'
      )
    })

    it('directly returns accounts for permitted domain', async function () {

      const cMiddleware = getPermissionsMiddleware(permController, ORIGINS.c)

      grantPermissions(
        permController, ORIGINS.c,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.c)
      )

      const req = RPC_REQUESTS.eth_requestAccounts(ORIGINS.c)
      const res = {}

      await assert.doesNotReject(
        cMiddleware(req, res),
        'should not reject'
      )

      assert.ok(
        res.result && !res.error,
        'response should have result and no error'
      )
      assert.deepEqual(
        res.result, ACCOUNT_ARRAYS.c,
        'response should have correct result'
      )
    })

    it('rejects new requests when request already pending', async function () {

      let unlock
      const unlockPromise = new Promise((resolve) => {
        unlock = resolve
      })

      permController.getUnlockPromise = () => unlockPromise

      const cMiddleware = getPermissionsMiddleware(permController, ORIGINS.c)

      grantPermissions(
        permController, ORIGINS.c,
        PERMS.finalizedRequests.eth_accounts(ACCOUNT_ARRAYS.c)
      )

      const req = RPC_REQUESTS.eth_requestAccounts(ORIGINS.c)
      const res = {}

      // this will block until we resolve the unlock Promise
      const requestApproval = assert.doesNotReject(
        cMiddleware(req, res),
        'should not reject'
      )

      // this will reject because of the already pending request
      await assert.rejects(
        cMiddleware({ ...req }, {}),
        ERRORS.eth_requestAccounts.requestAlreadyPending()
      )

      // now unlock and let through the first request
      unlock()

      await requestApproval

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

  describe('wallet_sendDomainMetadata', function () {

    let permController

    beforeEach(function () {
      permController = initPermController()
    })

    it('records domain metadata', async function () {

      const name = 'BAZ'

      const cMiddleware = getPermissionsMiddleware(permController, ORIGINS.c)

      const req = RPC_REQUESTS.wallet_sendDomainMetadata(ORIGINS.c, name)
      const res = {}

      await assert.doesNotReject(
        cMiddleware(req, res),
        'should not reject'
      )

      assert.ok(res.result, 'result should be true')

      const metadataStore = permController.store.getState()[METADATA_STORE_KEY]

      assert.deepEqual(
        metadataStore,
        { [ORIGINS.c]: { name, extensionId: undefined } },
        'metadata should have been added to store'
      )
    })

    it('records domain metadata and preserves extensionId', async function () {

      const extensionId = 'fooExtension'

      const name = 'BAZ'

      const cMiddleware = getPermissionsMiddleware(permController, ORIGINS.c, extensionId)

      const req = RPC_REQUESTS.wallet_sendDomainMetadata(ORIGINS.c, name)
      const res = {}

      await assert.doesNotReject(
        cMiddleware(req, res),
        'should not reject'
      )

      assert.ok(res.result, 'result should be true')

      const metadataStore = permController.store.getState()[METADATA_STORE_KEY]

      assert.deepEqual(
        metadataStore,
        { [ORIGINS.c]: { name, extensionId } },
        'metadata should have been added to store'
      )
    })

    it('should not record domain metadata if no name', async function () {

      const name = null

      const cMiddleware = getPermissionsMiddleware(permController, ORIGINS.c)

      const req = RPC_REQUESTS.wallet_sendDomainMetadata(ORIGINS.c, name)
      const res = {}

      await assert.doesNotReject(
        cMiddleware(req, res),
        'should not reject'
      )

      assert.ok(res.result, 'result should be true')

      const metadataStore = permController.store.getState()[METADATA_STORE_KEY]

      assert.deepEqual(
        metadataStore, {},
        'metadata should not have been added to store'
      )
    })

    it('should not record domain metadata if no metadata', async function () {

      const cMiddleware = getPermissionsMiddleware(permController, ORIGINS.c)

      const req = RPC_REQUESTS.wallet_sendDomainMetadata(ORIGINS.c)
      delete req.domainMetadata
      const res = {}

      await assert.doesNotReject(
        cMiddleware(req, res),
        'should not reject'
      )

      assert.ok(res.result, 'result should be true')

      const metadataStore = permController.store.getState()[METADATA_STORE_KEY]

      assert.deepEqual(
        metadataStore, {},
        'metadata should not have been added to store'
      )
    })
  })
})
