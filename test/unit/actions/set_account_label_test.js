import assert from 'assert'
import freeze from 'deep-freeze-strict'
import reducers from '../../../ui/app/ducks'
import * as actionConstants from '../../../ui/app/store/actionConstants'

describe('SET_ACCOUNT_LABEL', function () {
  it('updates the state.metamask.identities[:i].name property of the state to the action.value.label', function () {
    const initialState = {
      metamask: {
        identities: {
          foo: {
            name: 'bar',
          },
        },
      },
    }
    freeze(initialState)

    const action = {
      type: actionConstants.SET_ACCOUNT_LABEL,
      value: {
        account: 'foo',
        label: 'baz',
      },
    }
    freeze(action)

    const resultingState = reducers(initialState, action)
    assert.equal(
      resultingState.metamask.identities.foo.name,
      action.value.label,
    )
  })
})
