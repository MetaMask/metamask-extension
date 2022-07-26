import pify from 'pify';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';

let background = null;
let promisifiedBackground = null;

const actionRetryQueue = [];
const promisifiedActionRetryQueue = [];

// Function below is used to add action to queue
const addToActionQueue = (
  queue,
  actionId,
  request,
  resolveHandler,
  rejectHandler,
) => {
  if (queue.some((act) => act.actionId === actionId)) {
    return;
  }
  queue.push({
    actionId,
    request,
    resolveHandler,
    rejectHandler,
  });
};

// Function below is used to remove action from queue on successful completion
const removeFromActionQueue = (queue, actionId) => {
  const index = queue.find((act) => act.actionId === actionId);
  queue.splice(index, 1);
};

// Function below invokes promisifiedBackground method in MV2 content
// In MV3 context the execution is:
//   1. action is added to retry queue, along with resolve handler to be executed on completion of action
//   2. is streams are connected promisifiedBackground method is called
//   3. on completion of action either successfully or by throwing exception, action is removed from retry queue
export const submitRequestToBackground = (
  method,
  args = [],
  actionId = new Date().getTime(),
) => {
  if (isManifestV3()) {
    return new Promise((resolve, reject) => {
      addToActionQueue(
        promisifiedActionRetryQueue,
        actionId,
        { method, args },
        resolve,
        reject,
      );
      if (background.connectionStream.readable) {
        try {
          promisifiedBackground[method](...args)
            .then((result) => {
              resolve(result);
              removeFromActionQueue(promisifiedActionRetryQueue, actionId);
            })
            .catch((err) => {
              removeFromActionQueue(promisifiedActionRetryQueue, actionId);
              reject(err);
            });
        } catch (exp) {
          removeFromActionQueue(promisifiedActionRetryQueue, actionId);
          reject(exp);
        }
      }
    });
  }
  return promisifiedBackground[method](...args);
};

// Function is similar to submitRequestToBackground function above
// except that it invokes method on background and not promisifiedBackground
export const callBackgroundMethod = (
  method,
  args = [],
  onResolve,
  actionId = new Date().getTime(),
) => {
  if (isManifestV3()) {
    addToActionQueue(actionRetryQueue, actionId, { method, args }, onResolve);
    if (background.connectionStream.readable) {
      try {
        background[method](...args, (err, result) => {
          onResolve(err, result);
          removeFromActionQueue(actionRetryQueue, actionId);
        });
      } catch (exp) {
        removeFromActionQueue(actionRetryQueue, actionId);
        throw exp;
      }
    }
  } else {
    background[method](...args, onResolve);
  }
};

// Function below clears list of pending action in both
// 1. promisifiedActionRetryQueue
// 2. actionRetryQueue
const clearPendingActions = async () => {
  for (let i = 0; i < promisifiedActionRetryQueue.length; i++) {
    const item = promisifiedActionRetryQueue[i];
    submitRequestToBackground(
      item.request.method,
      item.request.args,
      item.actionId,
    )
      .then(item.resolveHandler)
      .catch(item.rejectHandler);
  }

  for (let i = 0; i < actionRetryQueue.length; i++) {
    const item = actionRetryQueue[i];
    callBackgroundMethod(
      item.request.method,
      item.request.args,
      item.resolveHandler,
      item.actionId,
    );
  }
};

export async function _setBackgroundConnection(backgroundConnection) {
  background = backgroundConnection;
  promisifiedBackground = pify(background);
  if (isManifestV3()) {
    // This function call here will clear the queue of actions
    // pending while connection stream is not available.
    clearPendingActions();
  }
}
