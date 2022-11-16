// Access the workerData by requiring it.
const { parentPort, workerData } = require('worker_threads');

const transforms = workerData.map((transformPath) => require(transformPath));

// Main thread will pass the data you need
// through this event listener.
parentPort.on('message', async (moduleRecord) => {
  // perform transformations
  for (const transformFn of transforms) {
    await transformFn(moduleRecord)
  }
  // return the result to main thread.
  parentPort.postMessage(moduleRecord.source);
});