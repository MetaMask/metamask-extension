import { strict as assert } from 'assert';
import stringify from 'fast-safe-stringify';

import { noop } from '../mocks/permission-controller';

/**
 * Grants the given permissions to the given origin, using the given permissions
 * controller.
 *
 * Just a wrapper for an rpc-cap middleware function.
 *
 * @param {PermissionsController} permController - The permissions controller.
 * @param {string} origin - The origin to grant permissions to.
 * @param {Object} permissions - The permissions to grant.
 */
export function grantPermissions(permController, origin, permissions) {
  permController.permissions.grantNewPermissions(origin, permissions, {}, noop);
}

/**
 * Returns a wrapper for the given permissions controller's requestUserApproval
 * function, so we don't have to worry about its internals.
 *
 * @param {PermissionsController} permController - The permissions controller.
 * @return {Function} A convenient wrapper for the requestUserApproval function.
 */
export function getRequestUserApprovalHelper(permController) {
  /**
   * Returns a request object that can be passed to requestUserApproval.
   *
   * @param {string} id - The internal permissions request ID (not the RPC request ID).
   * @param {string} [origin] - The origin of the request, if necessary.
   * @returns {Object} The corresponding request object.
   */
  return (id, origin = 'defaultOrigin') => {
    return permController.permissions.requestUserApproval({
      metadata: { id, origin, type: 'NO_TYPE' },
    });
  };
}

/**
 * Returns a Promise that resolves once a pending user approval has been set.
 * Calls the underlying requestUserApproval function as normal, and restores it
 * once the Promise is resolved.
 *
 * This function must be called on the permissions controller for each request.
 *
 * @param {PermissionsController} permController - A permissions controller.
 * @returns {Promise<void>} A Promise that resolves once a pending approval
 * has been set.
 */
export function getUserApprovalPromise(permController) {
  const originalFunction = permController.permissions.requestUserApproval;
  return new Promise((resolveHelperPromise) => {
    permController.permissions.requestUserApproval = (req) => {
      const userApprovalPromise = originalFunction(req);
      permController.permissions.requestUserApproval = originalFunction;
      resolveHelperPromise();
      return userApprovalPromise;
    };
  });
}

/**
 * Validates an activity log entry with respect to a request, response, and
 * relevant metadata.
 *
 * @param {Object} entry - The activity log entry to validate.
 * @param {Object} req - The request that generated the entry.
 * @param {Object} [res] - The response for the request, if any.
 * @param {'restricted'|'internal'} methodType - The method log controller method type of the request.
 * @param {boolean} success - Whether the request succeeded or not.
 */
export function validateActivityEntry(entry, req, res, methodType, success) {
  assert.doesNotThrow(() => {
    _validateActivityEntry(entry, req, res, methodType, success);
  }, 'should have expected activity entry');
}

function _validateActivityEntry(entry, req, res, methodType, success) {
  assert.ok(entry, 'entry should exist');

  assert.equal(entry.id, req.id);
  assert.equal(entry.method, req.method);
  assert.equal(entry.origin, req.origin);
  assert.equal(entry.methodType, methodType);
  assert.equal(
    entry.request,
    stringify(req, null, 2),
    'entry.request should equal the request',
  );

  if (res) {
    assert.ok(
      Number.isInteger(entry.requestTime) &&
        Number.isInteger(entry.responseTime),
      'request and response times should be numbers',
    );
    assert.ok(
      entry.requestTime <= entry.responseTime,
      'request time should be less than response time',
    );

    assert.equal(entry.success, success);
    assert.deepEqual(
      entry.response,
      stringify(res, null, 2),
      'entry.response should equal the response',
    );
  } else {
    assert.ok(
      Number.isInteger(entry.requestTime) && entry.requestTime > 0,
      'entry should have non-zero request time',
    );
    assert.ok(
      entry.success === null &&
        entry.responseTime === null &&
        entry.response === null,
      'entry response values should be null',
    );
  }
}
