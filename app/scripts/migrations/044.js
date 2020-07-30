const version = 44
import { cloneDeep } from 'lodash'

/**
 * Remove unused 'mkrMigrationReminderTimestamp' state from the `AppStateController`
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
  if (typeof state?.AppStateController?.mkrMigrationReminderTimestamp !== 'undefined') {
    delete state.AppStateController.mkrMigrationReminderTimestamp
  }
  return state
}
