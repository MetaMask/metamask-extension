import { strict as assert } from 'assert'

import {
  METADATA_STORE_KEY,
} from '../../../../../app/scripts/controllers/permissions/enums'

import {
  getters,
  getConstants,
  getApprovedPermissionsRequest,
  getPermController,
  getPermissionsMiddleware,
  getUserApprovalPromise,
  grantPermissions,
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
} = getConstants()

let permController

const initPermController = () => {
  permController = getPermController()
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

      const req = RPC_REQUESTS.requestPermission(
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

      const req = RPC_REQUESTS.requestPermission(
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

      const req = RPC_REQUESTS.test_method(ORIGINS.a)
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

      const req = RPC_REQUESTS.test_method(ORIGINS.b, true)
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

      const req = RPC_REQUESTS.eth_accounts(ORIGINS.a)
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

      const req = RPC_REQUESTS.eth_accounts(ORIGINS.a)
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
    })

    it('requests accounts for unpermitted origin, and approves on user approval', async function () {

      const userApprovalPromise = getUserApprovalPromise(permController)

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = RPC_REQUESTS.eth_requestAccounts(ORIGINS.a)
      const res = {}

      const middlewarePromise = assert.doesNotReject(
        aMiddleware(req, res),
        'should not reject permissions request'
      )

      await userApprovalPromise

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

      await middlewarePromise

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

      const userApprovalPromise = getUserApprovalPromise(permController)

      const aMiddleware = getPermissionsMiddleware(permController, ORIGINS.a)

      const req = RPC_REQUESTS.eth_requestAccounts(ORIGINS.a)
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

      await userApprovalPromise

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

      const req = RPC_REQUESTS.eth_requestAccounts(ORIGINS.c)
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

      const req = RPC_REQUESTS.wallet_sendDomainMetadata(ORIGINS.c, name)
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

      const req = RPC_REQUESTS.wallet_sendDomainMetadata(ORIGINS.c, name)
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

      const req = RPC_REQUESTS.wallet_sendDomainMetadata(ORIGINS.c, name)
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

      const req = RPC_REQUESTS.wallet_sendDomainMetadata(ORIGINS.c)
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
