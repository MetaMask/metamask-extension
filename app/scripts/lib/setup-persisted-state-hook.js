import LocalStore from './local-store';
import ReadOnlyNetworkStore from './network-store';

const localStore = process.env.IN_TEST
  ? new ReadOnlyNetworkStore()
  : new LocalStore();

globalThis.stateHooks.getPersistedState = async function () {
  return await localStore.get();
};
