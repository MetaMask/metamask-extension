import { strict as assert } from 'assert'

import { noop } from './mocks'

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
export function grantPermissions (permController, origin, permissions) {
  permController.permissions.grantNewPermissions(
    origin, permissions, {}, noop
  )
}

/**
 * Sets the underlying rpc-cap requestUserApproval function, and returns
 * a promise that's resolved once it has been set.
 *
 * This function must be called on the given permissions controller every
 * time you want such a Promise. As of writing, it's only called once per test.
 *
 * @param {PermissionsController} - A permissions controller.
 * @returns {Promise<void>} A Promise that resolves once a pending approval
 * has been set.
 */
export function getUserApprovalPromise (permController) {
  return new Promise((resolveForCaller) => {
    permController.permissions.requestUserApproval = async (req) => {
      const { origin, metadata: { id } } = req

      return new Promise((resolve, reject) => {
        permController.pendingApprovals.set(id, { origin, resolve, reject })
        resolveForCaller()
      })
    }
  })
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
export function validateActivityEntry (
  entry, req, res, methodType, success
) {
  assert.doesNotThrow(
    () => {
      _validateActivityEntry(
        entry, req, res, methodType, success
      )
    },
    'should have expected activity entry'
  )
}

function _validateActivityEntry (
  entry, req, res, methodType, success
) {

  assert.ok(entry, 'entry should exist')

  assert.equal(entry.id, req.id)
  assert.equal(entry.method, req.method)
  assert.equal(entry.origin, req.origin)
  assert.equal(entry.methodType, methodType)
  assert.deepEqual(
    entry.request, req,
    'entry.request should equal the request'
  )

  if (res) {

    assert.ok(
      (
        Number.isInteger(entry.requestTime) &&
        Number.isInteger(entry.responseTime)
      ),
      'request and response times should be numbers'
    )
    assert.ok(
      (entry.requestTime <= entry.responseTime),
      'request time should be less than response time'
    )

    assert.equal(entry.success, success)
    assert.deepEqual(
      entry.response, res,
      'entry.response should equal the response'
    )
  } else {

    assert.ok(
      Number.isInteger(entry.requestTime) && entry.requestTime > 0,
      'entry should have non-zero request time'
    )
    assert.ok(
      (
        entry.success === null &&
        entry.responseTime === null &&
        entry.response === null
      ),
      'entry response values should be null'
    )
  }
}
