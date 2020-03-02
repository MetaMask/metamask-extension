const pify = require('pify')
const isStream = require('isstream')
const endOfStream = pify(require('end-of-stream'))
const EventEmitter = require('events')

const tasks = {}
const taskEvents = new EventEmitter()

module.exports = { tasks, taskEvents, createTask, runTask, taskSeries, taskParallel, materializeTask, endOfTaskResult }

async function runTask (name) {
  await tasks[name]()
  taskEvents.emit('complete')
}

function createTask (name, taskFn) {
  const task = async (...args) => {
    const start = Date.now()
    taskEvents.emit('start', [name, start])
    // await task done
    const result = taskFn()
    await endOfTaskResult(result)
    // log stats
    const end = Date.now()
    taskEvents.emit('end', [name, start, end])
  }
  tasks[name] = task
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
    await Promise.all(realTasks.map(subtask => subtask()))
  }
}

function materializeTask (taskValue) {
  if (typeof taskValue !== 'string') {
    if (typeof taskValue !== 'function') throw new Error(`invalid task value: "${taskValue}" (${typeof taskValue})`)
    return taskValue
  }
  if (!(taskValue in tasks)) throw new Error(`no such task "${taskValue}"`)
  return tasks[taskValue]
}

async function endOfTaskResult (result) {
  if (isStream(result)) {
    await endOfStream(result)
  } else {
    await result
  }
}
