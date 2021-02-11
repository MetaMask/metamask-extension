import assert from 'assert'
import freeze from 'deep-freeze-strict'
import reducers from '../../../ui/app/ducks'
import * as actionConstants from '../../../ui/app/store/actionConstants'

describe('SHOW_ACCOUNT_DETAIL', function () {
  it('updates metamask state', function () {
    const initialState = {
      metamask: {
        selectedAddress: 'foo',
      },
    }
    freeze(initialState)

    const action = {
      type: actionConstants.SHOW_ACCOUNT_DETAIL,
      value: 'bar',
    }
    freeze(action)

    const resultingState = reducers(initialState, action)
    assert.equal(resultingState.metamask.selectedAddress, action.value)
  })
})
