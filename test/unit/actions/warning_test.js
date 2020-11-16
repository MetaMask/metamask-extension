import assert from 'assert'
import freeze from 'deep-freeze-strict'
import * as actions from '../../../ui/app/store/actions'
import reducers from '../../../ui/app/ducks'

describe('action DISPLAY_WARNING', function () {
  it('sets appState.warning to provided value', function () {
    const initialState = {
      appState: {},
    }
    freeze(initialState)

    const warningText = 'This is a sample warning message'

    const action = actions.displayWarning(warningText)
    const resultingState = reducers(initialState, action)

    assert.equal(
      resultingState.appState.warning,
      warningText,
      'warning text set',
    )
  })
})
