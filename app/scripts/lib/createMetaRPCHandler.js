import { ethErrors, serializeError } from 'eth-rpc-errors';
import { captureException } from '@sentry/browser';
import log from 'loglevel';
import LocalStore from './local-store';

let dataPersistenceFailing = false;

async function persistData(state, localStore) {
  if (!state) {
    throw new Error('MetaMask - updated state is missing');
  }
  if (!state.data) {
    throw new Error('MetaMask - updated state does not have data');
  }
  if (localStore.isSupported) {
    try {
      await localStore.set(state);
      console.log('persistData in metaRPC:', state);
      if (dataPersistenceFailing) {
        dataPersistenceFailing = false;
      }
    } catch (err) {
      // log error so we dont break the pipeline
      if (!dataPersistenceFailing) {
        dataPersistenceFailing = true;
        captureException(err);
      }
      log.error('error setting state in local store:', err);
    }
  }
}

const createMetaRPCHandler = (api, outStream, store) => {
  let isDirty = false;
  const localStore = new LocalStore();
  return async (data) => {
    const versionData = await localStore.get();
    store.subscribe((_) => {
      isDirty = true;
    });
    if (outStream._writableState.ended) {
      return;
    }
    if (!api[data.method]) {
      outStream.write({
        jsonrpc: '2.0',
        error: ethErrors.rpc.methodNotFound({
          message: `${data.method} not found`,
        }),
        id: data.id,
      });
      return;
    }

    let result;
    let error;
    try {
      result = await api[data.method](...data.params);
      // save state
      if (isDirty) {
        await persistData(
          { data: store.getState(), meta: versionData.meta },
          localStore,
        );
        isDirty = false;
      }
    } catch (err) {
      error = err;
    }

    if (outStream._writableState.ended) {
      if (error) {
        console.error(error);
      }
      return;
    }

    if (error) {
      outStream.write({
        jsonrpc: '2.0',
        error: serializeError(error, { shouldIncludeStack: true }),
        id: data.id,
      });
    } else {
      outStream.write({
        jsonrpc: '2.0',
        result,
        id: data.id,
      });
    }
  };
};

export default createMetaRPCHandler;
