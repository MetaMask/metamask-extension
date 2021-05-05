import { strict as assert } from 'assert';
import sinon from 'sinon';

import {
  constants,
  getters,
  getPermControllerOpts,
  getPermissionsMiddleware,
} from '../../../../test/mocks/permission-controller';
import {
  getUserApprovalPromise,
  grantPermissions,
} from '../../../../test/helpers/permission-controller-helpers';
import { METADATA_STORE_KEY } from './enums';

import { PermissionsController } from '.';

const { CAVEATS, ERRORS, PERMS, RPC_REQUESTS } = getters;

const { ACCOUNTS, DOMAINS, PERM_NAMES } = constants;

const initPermController = () => {
  return new PermissionsController({
    ...getPermControllerOpts(),
  });
};

const createApprovalSpies = (permController) => {
  sinon.spy(permController.approvals, '_add');
};

const getNextApprovalId = (permController) => {
  return permController.approvals._approvals.keys().next().value;
};

const validatePermission = (perm, name, origin, caveats) => {
  assert.equal(
    name,
    perm.parentCapability,
    'should have expected permission name',
  );
  assert.equal(origin, perm.invoker, 'should have expected permission origin');
  if (caveats) {
    assert.deepEqual(
      caveats,
      perm.caveats,
      'should have expected permission caveats',
    );
  } else {
    assert.ok(!perm.caveats, 'should not have any caveats');
  }
};

describe('permissions middleware', function () {
  describe('wallet_requestPermissions', function () {
    let permController;

    beforeEach(function () {
      permController = initPermController();
      permController.notifyAccountsChanged = sinon.fake();
    });

    it('grants permissions on user approval', async function () {
      createApprovalSpies(permController);

      const aMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.a.origin,
      );

      const req = RPC_REQUESTS.requestPermission(
        DOMAINS.a.origin,
        PERM_NAMES.eth_accounts,
      );
      const res = {};

      const userApprovalPromise = getUserApprovalPromise(permController);

      const pendingApproval = assert.doesNotReject(
        aMiddleware(req, res),
        'should not reject permissions request',
      );

      await userApprovalPromise;

      assert.ok(
        permController.approvals._add.calledOnce,
        'should have added single approval request',
      );

      const id = getNextApprovalId(permController);
      const approvedReq = PERMS.approvedRequest(
        id,
        PERMS.requests.eth_accounts(),
      );

      await permController.approvePermissionsRequest(
        approvedReq,
        ACCOUNTS.a.permitted,
      );
      await pendingApproval;

      assert.ok(
        res.result && !res.error,
        'response should have result and no error',
      );

      assert.equal(
        res.result.length,
        1,
        'origin should have single approved permission',
      );

      validatePermission(
        res.result[0],
        PERM_NAMES.eth_accounts,
        DOMAINS.a.origin,
        CAVEATS.eth_accounts(ACCOUNTS.a.permitted),
      );

      const aAccounts = await permController.getAccounts(DOMAINS.a.origin);
      assert.deepEqual(
        aAccounts,
        [ACCOUNTS.a.primary],
        'origin should have correct accounts',
      );

      assert.ok(
        permController.notifyAccountsChanged.calledOnceWith(
          DOMAINS.a.origin,
          aAccounts,
        ),
        'expected notification call should have been made',
      );
    });

    it('handles serial approved requests that overwrite existing permissions', async function () {
      const aMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.a.origin,
      );

      // create first request

      const req1 = RPC_REQUESTS.requestPermission(
        DOMAINS.a.origin,
        PERM_NAMES.eth_accounts,
      );
      const res1 = {};

      // send, approve, and validate first request
      // note use of ACCOUNTS.a.permitted

      let userApprovalPromise = getUserApprovalPromise(permController);

      const pendingApproval1 = assert.doesNotReject(
        aMiddleware(req1, res1),
        'should not reject permissions request',
      );

      await userApprovalPromise;

      const id1 = getNextApprovalId(permController);
      const approvedReq1 = PERMS.approvedRequest(
        id1,
        PERMS.requests.eth_accounts(),
      );

      await permController.approvePermissionsRequest(
        approvedReq1,
        ACCOUNTS.a.permitted,
      );
      await pendingApproval1;

      assert.ok(
        res1.result && !res1.error,
        'response should have result and no error',
      );

      assert.equal(
        res1.result.length,
        1,
        'origin should have single approved permission',
      );

      validatePermission(
        res1.result[0],
        PERM_NAMES.eth_accounts,
        DOMAINS.a.origin,
        CAVEATS.eth_accounts(ACCOUNTS.a.permitted),
      );

      const accounts1 = await permController.getAccounts(DOMAINS.a.origin);
      assert.deepEqual(
        accounts1,
        [ACCOUNTS.a.primary],
        'origin should have correct accounts',
      );

      assert.ok(
        permController.notifyAccountsChanged.calledOnceWith(
          DOMAINS.a.origin,
          accounts1,
        ),
        'expected notification call should have been made',
      );

      // create second request

      const requestedPerms2 = {
        ...PERMS.requests.eth_accounts(),
        ...PERMS.requests.test_method(),
      };

      const req2 = RPC_REQUESTS.requestPermissions(DOMAINS.a.origin, {
        ...requestedPerms2,
      });
      const res2 = {};

      // send, approve, and validate second request
      // note use of ACCOUNTS.b.permitted

      userApprovalPromise = getUserApprovalPromise(permController);

      const pendingApproval2 = assert.doesNotReject(
        aMiddleware(req2, res2),
        'should not reject permissions request',
      );

      await userApprovalPromise;

      const id2 = getNextApprovalId(permController);
      const approvedReq2 = PERMS.approvedRequest(id2, { ...requestedPerms2 });

      await permController.approvePermissionsRequest(
        approvedReq2,
        ACCOUNTS.b.permitted,
      );
      await pendingApproval2;

      assert.ok(
        res2.result && !res2.error,
        'response should have result and no error',
      );

      assert.equal(
        res2.result.length,
        2,
        'origin should have single approved permission',
      );

      validatePermission(
        res2.result[0],
        PERM_NAMES.eth_accounts,
        DOMAINS.a.origin,
        CAVEATS.eth_accounts(ACCOUNTS.b.permitted),
      );

      validatePermission(
        res2.result[1],
        PERM_NAMES.test_method,
        DOMAINS.a.origin,
      );

      const accounts2 = await permController.getAccounts(DOMAINS.a.origin);
      assert.deepEqual(
        accounts2,
        [ACCOUNTS.b.primary],
        'origin should have correct accounts',
      );

      assert.equal(
        permController.notifyAccountsChanged.callCount,
        2,
        'should have called notification method 2 times in total',
      );

      assert.ok(
        permController.notifyAccountsChanged.lastCall.calledWith(
          DOMAINS.a.origin,
          accounts2,
        ),
        'expected notification call should have been made',
      );
    });

    it('rejects permissions on user rejection', async function () {
      createApprovalSpies(permController);

      const aMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.a.origin,
      );

      const req = RPC_REQUESTS.requestPermission(
        DOMAINS.a.origin,
        PERM_NAMES.eth_accounts,
      );
      const res = {};

      const expectedError = ERRORS.rejectPermissionsRequest.rejection();

      const userApprovalPromise = getUserApprovalPromise(permController);

      const requestRejection = assert.rejects(
        aMiddleware(req, res),
        expectedError,
        'request should be rejected with correct error',
      );

      await userApprovalPromise;

      assert.ok(
        permController.approvals._add.calledOnce,
        'should have added single approval request',
      );

      const id = getNextApprovalId(permController);

      await permController.rejectPermissionsRequest(id);
      await requestRejection;

      assert.ok(
        !res.result && res.error && res.error.message === expectedError.message,
        'response should have expected error and no result',
      );

      const aAccounts = await permController.getAccounts(DOMAINS.a.origin);
      assert.deepEqual(
        aAccounts,
        [],
        'origin should have have correct accounts',
      );

      assert.ok(
        permController.notifyAccountsChanged.notCalled,
        'should not have called notification method',
      );
    });

    it('rejects requests with unknown permissions', async function () {
      createApprovalSpies(permController);

      const aMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.a.origin,
      );

      const req = RPC_REQUESTS.requestPermissions(DOMAINS.a.origin, {
        ...PERMS.requests.does_not_exist(),
        ...PERMS.requests.test_method(),
      });
      const res = {};

      const expectedError = ERRORS.rejectPermissionsRequest.methodNotFound(
        PERM_NAMES.does_not_exist,
      );

      await assert.rejects(
        aMiddleware(req, res),
        expectedError,
        'request should be rejected with correct error',
      );

      assert.ok(
        permController.approvals._add.notCalled,
        'no approval requests should have been added',
      );

      assert.ok(
        !res.result && res.error && res.error.message === expectedError.message,
        'response should have expected error and no result',
      );

      assert.ok(
        permController.notifyAccountsChanged.notCalled,
        'should not have called notification method',
      );
    });

    it('accepts only a single pending permissions request per origin', async function () {
      createApprovalSpies(permController);

      // two middlewares for two origins

      const aMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.a.origin,
      );
      const bMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.b.origin,
      );

      // create and start processing first request for first origin

      const reqA1 = RPC_REQUESTS.requestPermission(
        DOMAINS.a.origin,
        PERM_NAMES.test_method,
      );
      const resA1 = {};

      let userApprovalPromise = getUserApprovalPromise(permController);

      const requestApproval1 = assert.doesNotReject(
        aMiddleware(reqA1, resA1),
        'should not reject permissions request',
      );

      await userApprovalPromise;

      // create and start processing first request for second origin

      const reqB1 = RPC_REQUESTS.requestPermission(
        DOMAINS.b.origin,
        PERM_NAMES.test_method,
      );
      const resB1 = {};

      userApprovalPromise = getUserApprovalPromise(permController);

      const requestApproval2 = assert.doesNotReject(
        bMiddleware(reqB1, resB1),
        'should not reject permissions request',
      );

      await userApprovalPromise;

      assert.ok(
        permController.approvals._add.calledTwice,
        'should have added two approval requests',
      );

      // create and start processing second request for first origin,
      // which should throw

      const reqA2 = RPC_REQUESTS.requestPermission(
        DOMAINS.a.origin,
        PERM_NAMES.test_method,
      );
      const resA2 = {};

      userApprovalPromise = getUserApprovalPromise(permController);

      const expectedError = ERRORS.pendingApprovals.requestAlreadyPending(
        DOMAINS.a.origin,
      );

      const requestApprovalFail = assert.rejects(
        aMiddleware(reqA2, resA2),
        expectedError,
        'request should be rejected with correct error',
      );

      await userApprovalPromise;
      await requestApprovalFail;

      assert.ok(
        !resA2.result &&
          resA2.error &&
          resA2.error.message === expectedError.message,
        'response should have expected error and no result',
      );

      assert.equal(
        permController.approvals._add.callCount,
        3,
        'should have attempted to create three pending approvals',
      );
      assert.equal(
        permController.approvals._approvals.size,
        2,
        'should only have created two pending approvals',
      );

      // now, remaining pending requests should be approved without issue

      for (const id of permController.approvals._approvals.keys()) {
        await permController.approvePermissionsRequest(
          PERMS.approvedRequest(id, PERMS.requests.test_method()),
        );
      }
      await requestApproval1;
      await requestApproval2;

      assert.ok(
        resA1.result && !resA1.error,
        'first response should have result and no error',
      );
      assert.equal(
        resA1.result.length,
        1,
        'first origin should have single approved permission',
      );

      assert.ok(
        resB1.result && !resB1.error,
        'second response should have result and no error',
      );
      assert.equal(
        resB1.result.length,
        1,
        'second origin should have single approved permission',
      );
    });
  });

  describe('restricted methods', function () {
    let permController;

    beforeEach(function () {
      permController = initPermController();
    });

    it('prevents restricted method access for unpermitted domain', async function () {
      const aMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.a.origin,
      );

      const req = RPC_REQUESTS.test_method(DOMAINS.a.origin);
      const res = {};

      const expectedError = ERRORS.rpcCap.unauthorized();

      await assert.rejects(
        aMiddleware(req, res),
        expectedError,
        'request should be rejected with correct error',
      );

      assert.ok(
        !res.result && res.error && res.error.code === expectedError.code,
        'response should have expected error and no result',
      );
    });

    it('allows restricted method access for permitted domain', async function () {
      const bMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.b.origin,
      );

      grantPermissions(
        permController,
        DOMAINS.b.origin,
        PERMS.finalizedRequests.test_method(),
      );

      const req = RPC_REQUESTS.test_method(DOMAINS.b.origin, true);
      const res = {};

      await assert.doesNotReject(bMiddleware(req, res), 'should not reject');

      assert.ok(
        res.result && res.result === 1,
        'response should have correct result',
      );
    });
  });

  describe('eth_accounts', function () {
    let permController;

    beforeEach(function () {
      permController = initPermController();
    });

    it('returns empty array for non-permitted domain', async function () {
      const aMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.a.origin,
      );

      const req = RPC_REQUESTS.eth_accounts(DOMAINS.a.origin);
      const res = {};

      await assert.doesNotReject(aMiddleware(req, res), 'should not reject');

      assert.ok(
        res.result && !res.error,
        'response should have result and no error',
      );
      assert.deepEqual(res.result, [], 'response should have correct result');
    });

    it('returns correct accounts for permitted domain', async function () {
      const aMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.a.origin,
      );

      grantPermissions(
        permController,
        DOMAINS.a.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.a.permitted),
      );

      const req = RPC_REQUESTS.eth_accounts(DOMAINS.a.origin);
      const res = {};

      await assert.doesNotReject(aMiddleware(req, res), 'should not reject');

      assert.ok(
        res.result && !res.error,
        'response should have result and no error',
      );
      assert.deepEqual(
        res.result,
        [ACCOUNTS.a.primary],
        'response should have correct result',
      );
    });
  });

  describe('eth_requestAccounts', function () {
    let permController;

    beforeEach(function () {
      permController = initPermController();
    });

    it('requests accounts for unpermitted origin, and approves on user approval', async function () {
      createApprovalSpies(permController);

      const userApprovalPromise = getUserApprovalPromise(permController);

      const aMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.a.origin,
      );

      const req = RPC_REQUESTS.eth_requestAccounts(DOMAINS.a.origin);
      const res = {};

      const pendingApproval = assert.doesNotReject(
        aMiddleware(req, res),
        'should not reject permissions request',
      );

      await userApprovalPromise;

      assert.ok(
        permController.approvals._add.calledOnce,
        'should have added single approval request',
      );

      const id = getNextApprovalId(permController);
      const approvedReq = PERMS.approvedRequest(
        id,
        PERMS.requests.eth_accounts(),
      );

      await permController.approvePermissionsRequest(
        approvedReq,
        ACCOUNTS.a.permitted,
      );

      // wait for permission to be granted
      await pendingApproval;

      const perms = permController.permissions.getPermissionsForDomain(
        DOMAINS.a.origin,
      );

      assert.equal(
        perms.length,
        1,
        'domain should have correct number of permissions',
      );

      validatePermission(
        perms[0],
        PERM_NAMES.eth_accounts,
        DOMAINS.a.origin,
        CAVEATS.eth_accounts(ACCOUNTS.a.permitted),
      );

      // we should also see the accounts on the response
      assert.ok(
        res.result && !res.error,
        'response should have result and no error',
      );

      assert.deepEqual(
        res.result,
        [ACCOUNTS.a.primary],
        'result should have correct accounts',
      );

      // we should also be able to get the accounts independently
      const aAccounts = await permController.getAccounts(DOMAINS.a.origin);
      assert.deepEqual(
        aAccounts,
        [ACCOUNTS.a.primary],
        'origin should have have correct accounts',
      );
    });

    it('requests accounts for unpermitted origin, and rejects on user rejection', async function () {
      createApprovalSpies(permController);

      const userApprovalPromise = getUserApprovalPromise(permController);

      const aMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.a.origin,
      );

      const req = RPC_REQUESTS.eth_requestAccounts(DOMAINS.a.origin);
      const res = {};

      const expectedError = ERRORS.rejectPermissionsRequest.rejection();

      const requestRejection = assert.rejects(
        aMiddleware(req, res),
        expectedError,
        'request should be rejected with correct error',
      );

      await userApprovalPromise;

      assert.ok(
        permController.approvals._add.calledOnce,
        'should have added single approval request',
      );

      const id = getNextApprovalId(permController);

      await permController.rejectPermissionsRequest(id);
      await requestRejection;

      assert.ok(
        !res.result && res.error && res.error.message === expectedError.message,
        'response should have expected error and no result',
      );

      const aAccounts = await permController.getAccounts(DOMAINS.a.origin);
      assert.deepEqual(
        aAccounts,
        [],
        'origin should have have correct accounts',
      );
    });

    it('directly returns accounts for permitted domain', async function () {
      const cMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.c.origin,
      );

      grantPermissions(
        permController,
        DOMAINS.c.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.c.permitted),
      );

      const req = RPC_REQUESTS.eth_requestAccounts(DOMAINS.c.origin);
      const res = {};

      await assert.doesNotReject(cMiddleware(req, res), 'should not reject');

      assert.ok(
        res.result && !res.error,
        'response should have result and no error',
      );
      assert.deepEqual(
        res.result,
        [ACCOUNTS.c.primary],
        'response should have correct result',
      );
    });

    it('rejects new requests when request already pending', async function () {
      let unlock;
      const unlockPromise = new Promise((resolve) => {
        unlock = resolve;
      });

      permController.getUnlockPromise = () => unlockPromise;

      const cMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.c.origin,
      );

      grantPermissions(
        permController,
        DOMAINS.c.origin,
        PERMS.finalizedRequests.eth_accounts(ACCOUNTS.c.permitted),
      );

      const req = RPC_REQUESTS.eth_requestAccounts(DOMAINS.c.origin);
      const res = {};

      // this will block until we resolve the unlock Promise
      const requestApproval = assert.doesNotReject(
        cMiddleware(req, res),
        'should not reject',
      );

      // this will reject because of the already pending request
      await assert.rejects(
        cMiddleware({ ...req }, {}),
        ERRORS.eth_requestAccounts.requestAlreadyPending(DOMAINS.c.origin),
      );

      // now unlock and let through the first request
      unlock();

      await requestApproval;

      assert.ok(
        res.result && !res.error,
        'response should have result and no error',
      );
      assert.deepEqual(
        res.result,
        [ACCOUNTS.c.primary],
        'response should have correct result',
      );
    });
  });

  describe('metamask_sendDomainMetadata', function () {
    let permController, clock;

    beforeEach(function () {
      permController = initPermController();
      clock = sinon.useFakeTimers(1);
    });

    afterEach(function () {
      clock.restore();
    });

    it('records domain metadata', async function () {
      const name = 'BAZ';

      const cMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.c.origin,
      );

      const req = RPC_REQUESTS.metamask_sendDomainMetadata(
        DOMAINS.c.origin,
        name,
      );
      const res = {};

      await assert.doesNotReject(cMiddleware(req, res), 'should not reject');

      assert.ok(res.result, 'result should be true');

      const metadataStore = permController.store.getState()[METADATA_STORE_KEY];

      assert.deepEqual(
        metadataStore,
        {
          [DOMAINS.c.origin]: {
            name,
            host: DOMAINS.c.host,
            lastUpdated: 1,
          },
        },
        'metadata should have been added to store',
      );
    });

    it('records domain metadata and preserves extensionId', async function () {
      const extensionId = 'fooExtension';

      const name = 'BAZ';

      const cMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.c.origin,
        extensionId,
      );

      const req = RPC_REQUESTS.metamask_sendDomainMetadata(
        DOMAINS.c.origin,
        name,
      );
      const res = {};

      await assert.doesNotReject(cMiddleware(req, res), 'should not reject');

      assert.ok(res.result, 'result should be true');

      const metadataStore = permController.store.getState()[METADATA_STORE_KEY];

      assert.deepEqual(
        metadataStore,
        { [DOMAINS.c.origin]: { name, extensionId, lastUpdated: 1 } },
        'metadata should have been added to store',
      );
    });

    it('should not record domain metadata if no name', async function () {
      const name = null;

      const cMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.c.origin,
      );

      const req = RPC_REQUESTS.metamask_sendDomainMetadata(
        DOMAINS.c.origin,
        name,
      );
      const res = {};

      await assert.doesNotReject(cMiddleware(req, res), 'should not reject');

      assert.ok(res.result, 'result should be true');

      const metadataStore = permController.store.getState()[METADATA_STORE_KEY];

      assert.deepEqual(
        metadataStore,
        {},
        'metadata should not have been added to store',
      );
    });

    it('should not record domain metadata if no metadata', async function () {
      const cMiddleware = getPermissionsMiddleware(
        permController,
        DOMAINS.c.origin,
      );

      const req = RPC_REQUESTS.metamask_sendDomainMetadata(DOMAINS.c.origin);
      delete req.domainMetadata;
      const res = {};

      await assert.doesNotReject(cMiddleware(req, res), 'should not reject');

      assert.ok(res.result, 'result should be true');

      const metadataStore = permController.store.getState()[METADATA_STORE_KEY];

      assert.deepEqual(
        metadataStore,
        {},
        'metadata should not have been added to store',
      );
    });
  });
});
