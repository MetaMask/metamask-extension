import { strict as assert } from 'assert'

import { noop } from './mocks'

export function grantPermissions (permController, origin, permissions) {
  permController.permissions.grantNewPermissions(
    origin, permissions, {}, noop
  )
}

/**
 * Sets the underlying rpc-cap requestUserApproval function such that we can
 * await it being called.
 * @returns {Promise<void>} A Promise that resolves once a pending approval
 * has been set.
 */
export function getUserApprovalPromise (permController) {
  return new Promise((resolveForCaller) => {
    permController.permissions.requestUserApproval = async (req) => {
      const { metadata: { id } } = req

      return new Promise((resolve, reject) => {
        permController.pendingApprovals[id] = { resolve, reject }
        resolveForCaller()
      })
    }
  })
}

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
