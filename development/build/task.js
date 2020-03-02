const pify = require('pify')
const isStream = require('isstream')
const endOfStream = pify(require('end-of-stream'))
const EventEmitter = require('events')

const tasks = {}
const taskEvents = new EventEmitter()

module.exports = { tasks, taskEvents, createTask, runTask, taskSeries, taskParallel, materializeTask, endOfTaskResult }

async function runTask (taskName) {
  if (!(taskName in tasks)) {
    throw new Error(`MetaMask build: Unrecognized task name "${taskName}"`)
  }
  console.log(`running task "${taskName}"...`)
  try {
    await tasks[taskName]()
  } catch (err) {
    console.error(`MetaMask build: Encountered an error while running task "${taskName}".`)
    console.error(err)
    process.exit(1)
  }
  taskEvents.emit('complete')
}

function createTask (taskName, taskFn) {
  const task = async () => {
    const start = Date.now()
    taskEvents.emit('start', [taskName, start])
    // await task done
    const result = taskFn()
    await endOfTaskResult(result)
    // log stats
    const end = Date.now()
    taskEvents.emit('end', [taskName, start, end])
  }
  if (taskName in tasks) {
    throw new Error(`MetaMask build: task "${taskName}" already exists. Refusing to redefine`)
  }
  tasks[taskName] = task
  return task
}

function taskSeries (...subtasks) {
  return async () => {
    const realTasks = subtasks.map(materializeTask)
    for (const subtask of realTasks) {
      // console.log(`subtask: "${subtask}" (${typeof subtask})`)
      await subtask()
    }
  }
}

function taskParallel (...subtasks) {
  return async () => {
    const realTasks = subtasks.map(materializeTask)
    await Promise.all(realTasks.map((subtask) => subtask()))
  }
}

function materializeTask (taskValue) {
  if (typeof taskValue !== 'string') {
    if (typeof taskValue !== 'function') {
      throw new Error(`invalid task value: "${taskValue}" (${typeof taskValue})`)
    }
    return taskValue
  }
  if (!(taskValue in tasks)) {
    throw new Error(`no such task "${taskValue}"`)
  }
  return tasks[taskValue]
}

async function endOfTaskResult (result) {
  if (isStream(result)) {
    await endOfStream(result)
  } else {
    await result
  }
}
