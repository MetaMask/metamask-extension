import { cloneDeep } from 'lodash'

const version = 44

/**
 * Remove unused 'mkrMigrationReminderTimestamp' state from the `AppStateController`
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState(state) {
  if (
    typeof state?.AppStateController?.mkrMigrationReminderTimestamp !==
    'undefined'
  ) {
    delete state.AppStateController.mkrMigrationReminderTimestamp
  }
  return state
}
