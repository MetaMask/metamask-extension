const os = require('os')
const path = require('path')

const { StaticPool } = require('node-worker-threads-pool');

module.exports = { createWorkerTransform }

function createWorkerTransform (transformModules) {
  const workerPool = new StaticPool({
    size: os.cpus().length - 1,
    // size: Math.min(os.cpus().length - 1, 8),
    task: path.resolve(__dirname, './worker-transform.js'),
    workerData: transformModules,
  })
  const workerTransform = async (moduleRecord) => {
    const transformedSource = await workerPool.exec(moduleRecord)
    moduleRecord.source = transformedSource
  }
  return { workerTransform, workerPool }
}