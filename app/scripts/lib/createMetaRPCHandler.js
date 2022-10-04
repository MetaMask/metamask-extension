import { ethErrors, serializeError } from 'eth-rpc-errors';
import ReadOnlyNetworkStore from './network-store';
import LocalStore from './local-store';
import persistData from './persist-data';

const inTest = process.env.IN_TEST;
const localStore = inTest ? new ReadOnlyNetworkStore() : new LocalStore();

const createMetaRPCHandler = (api, outStream, store) => {
  return async (data) => {
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
    } catch (err) {
      error = err;
    } finally {
      if (store && data.method !== 'getState') {
        // we retrieve the already persisted data from local store to provide the version metadata to this persist call
        const versionData = await localStore.get();
        await persistData(
          { data: store.getState(), meta: versionData?.meta },
          localStore,
        );
      }
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
