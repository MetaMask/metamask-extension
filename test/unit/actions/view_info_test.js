import assert from 'assert'
import freeze from 'deep-freeze-strict'
import * as actions from '../../../ui/app/store/actions'
import reducers from '../../../ui/app/ducks'

describe('SHOW_INFO_PAGE', function () {
  it('sets the state.appState.currentView.name property to info', function () {
    const initialState = {
      appState: {
        activeAddress: 'foo',
      },
    }
    freeze(initialState)

    const action = actions.showInfoPage()
    const resultingState = reducers(initialState, action)
    assert.equal(resultingState.appState.currentView.name, 'info')
  })
})
