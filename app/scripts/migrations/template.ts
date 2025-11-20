import { cloneDeep } from 'lodash';

export const version = 0;

/**
 * Explain the purpose of the migration here.
 *
 * @param versionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param versionedData.meta - State metadata.
 * @param versionedData.meta.version - The current state version.
 * @param versionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns void or a Promise that resolves to void; mutate the state in place.
 */
export function migrate(versionedData: {
  meta: { version: number };
  data: Record<string, unknown>;
}, changedKeys: Set<string>): void | Promise<void> {
  versionedData.meta.version = version;
  transformState(versionedData.data, changedKeys);
}

function transformState(state: Record<string, unknown>, changedKeys: Set<string>): Promise<void> | void {
  (state.ControllerKey as {newProperty: string}).newProperty = 'newValue';
  delete state.OldControllerKey;
  // if you add/remove/edit a new controller key, you need to track it in
  // changedKeys or your migration will not persist.
  changedKeys.add('ControllerKey');
  changedKeys.add('OldControllerKey');
}
