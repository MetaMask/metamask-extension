const version = 38
import { cloneDeep } from 'lodash'

/**
 * The purpose of this migration is to assign all users to a test group for the fullScreenVsPopup a/b test
 */
export default {
  version,
  migrate: async function (originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState (state) {
  const { ABTestController: ABTestControllerState = {} } = state
  const { abTests = {} } = ABTestControllerState

  if (abTests.fullScreenVsPopup) {
    return state
  }

  return {
    ...state,
    ABTestController: {
      ...ABTestControllerState,
      abTests: {
        ...abTests,
        fullScreenVsPopup: 'control',
      },
    },
  }
}
