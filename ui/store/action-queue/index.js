import pify from 'pify';
import { isManifestV3 } from '../../../shared/modules/mv3.utils';

// // A simplified pify maybe?
// function pify(apiObject) {
//   return Object.keys(apiObject).reduce((promisifiedAPI, key) => {
//     if (apiObject[key].apply) { // depending on our browser support we might use a nicer check for functions here
//       promisifiedAPI[key] = function (...args) {
//         return new Promise((resolve, reject) => {
//           return apiObject[key](
//             ...args,
//             (err, result) => {
//               if (err) {
//                 reject(err);
//               } else {
//                 resolve(result);
//               }
//             },
//           );
//         });
//       };
//     }
//     return promisifiedAPI;
//   }, {});
// }

let background = null;
let promisifiedBackground = null;

const actionRetryQueue = [];

export const generateActionId = () => Date.now() + Math.random();

function failQueue() {
  actionRetryQueue.forEach(({ reject }) =>
    reject(
      Error('Background operation cancelled while waiting for connection.'),
    ),
  );
}

/**
 * Drops the entire actions queue. Rejects all actions in the queue unless silently==true
 * Does not affect the single action that is currently being processed.
 *
 * @param {boolean} [silently]
 */
export function dropQueue(silently) {
  if (!silently) {
    failQueue();
  }
  actionRetryQueue.length = 0;
}

// add action to queue
const executeActionOrAddToRetryQueue = (item) => {
  if (actionRetryQueue.some((act) => act.actionId === item.actionId)) {
    return;
  }

  if (background.connectionStream.readable) {
    executeAction({
      action: item,
      disconnectSideeffect: () => actionRetryQueue.push(item),
    });
  } else {
    actionRetryQueue.push(item);
  }
};

/**
 * Promise-style call to background method
 * In MV2: invokes promisifiedBackground method directly.
 * In MV3: action is added to retry queue, along with resolve handler to be executed on completion,
 *  the queue is then immediately processed if background connection is available.
 *  On completion (successful or error) the action is removed from the retry queue.
 *
 * @param {string} method - name of the background method
 * @param {Array} [args] - arguments to that method, if any
 * @param {any} [actionId] - if an action with the === same id is submitted, it'll be ignored if already in queue waiting for a retry.
 * @returns {Promise}
 */
export function submitRequestToBackground(
  method,
  args = [],
  actionId = generateActionId(), // current date is not guaranteed to be unique
) {
  if (isManifestV3) {
    return new Promise((resolve, reject) => {
      executeActionOrAddToRetryQueue({
        actionId,
        request: { method, args },
        resolve,
        reject,
      });
    });
  }
  return promisifiedBackground[method](...args);
}

/**
 * [Deprecated] Callback-style call to background method
 * In MV2: invokes promisifiedBackground method directly.
 * In MV3: action is added to retry queue, along with resolve handler to be executed on completion,
 *  the queue is then immediately processed if background connection is available.
 *  On completion (successful or error) the action is removed from the retry queue.
 *
 * @deprecated Use async `submitRequestToBackground` function instead.
 * @param {string} method - name of the background method
 * @param {Array} [args] - arguments to that method, if any
 * @param callback - Node style (error, result) callback for finishing the operation
 * @param {any} [actionId] - if an action with the === same id is submitted, it'll be ignored if already in queue.
 */
export const callBackgroundMethod = (
  method,
  args = [],
  callback,
  actionId = generateActionId(), // current date is not guaranteed to be unique
) => {
  if (isManifestV3) {
    const resolve = (value) => callback(null, value);
    const reject = (err) => callback(err);
    executeActionOrAddToRetryQueue({
      actionId,
      request: { method, args },
      resolve,
      reject,
    });
  } else {
    background[method](...args, callback);
  }
};

async function executeAction({ action, disconnectSideeffect }) {
  const {
    request: { method, args },
    resolve,
    reject,
  } = action;
  try {
    resolve(await promisifiedBackground[method](...args));
  } catch (err) {
    if (
      background.DisconnectError && // necessary to not break compatibility with background stubs or non-default implementations
      err instanceof background.DisconnectError
    ) {
      disconnectSideeffect(action);
    } else {
      reject(err);
    }
  }
}

let processingQueue = false;

// Clears list of pending action in actionRetryQueue
// The results of background calls are wired up to the original promises that's been returned
// The first method on the queue gets called synchronously to make testing and reasoning about
//  a single request to an open connection easier.
async function processActionRetryQueue() {
  if (processingQueue) {
    return;
  }
  processingQueue = true;
  try {
    while (
      background.connectionStream.readable &&
      actionRetryQueue.length > 0
    ) {
      // If background disconnects and fails the action, the next one will not be taken off the queue.
      // Retrying an action that failed because of connection loss while it was processing is not supported.
      const item = actionRetryQueue.shift();
      await executeAction({
        action: item,
        disconnectSideeffect: () => actionRetryQueue.unshift(item),
      });
    }
  } catch (e) {
    // error in the queue mechanism itself, the action was malformed
    console.error(e);
  }
  processingQueue = false;
}

/**
 * Sets/replaces the background connection reference
 * Under MV3 it also triggers queue processing if the new background is connected
 *
 * @param {*} backgroundConnection
 */
export async function _setBackgroundConnection(backgroundConnection) {
  background = backgroundConnection;
  promisifiedBackground = pify(background);
  if (isManifestV3) {
    if (processingQueue) {
      console.warn(
        '_setBackgroundConnection called while a queue was processing and not disconnected yet',
      );
    }
    // Process all actions collected while connection stream was not available.
    processActionRetryQueue();
  }
}
