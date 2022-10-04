import log from 'loglevel';
import { captureException } from '@sentry/browser';

let dataPersistenceFailing = false;

export default async function persistData(state, localStore) {
  if (!state) {
    throw new Error('MetaMask - updated state is missing');
  }
  if (!state.data) {
    throw new Error('MetaMask - updated state does not have data');
  }
  if (localStore.isSupported) {
    try {
      await localStore.set(state);
      if (dataPersistenceFailing) {
        dataPersistenceFailing = false;
      }
    } catch (err) {
      if (!dataPersistenceFailing) {
        dataPersistenceFailing = true;
        captureException(err);
      }
      log.error('error setting state in local store:', err);
    }
  }
}
