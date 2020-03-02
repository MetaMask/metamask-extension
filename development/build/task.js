const pify = require('pify')
const EventEmitter = require('events')
const isStream = require('isstream')
const endOfStream = pify(require('end-of-stream'))
const { spawn } = require('child_process')

const tasks = {}
const taskEvents = new EventEmitter()

module.exports = { tasks, taskEvents, createTask, runTask, taskSeries, taskParallel, materializeTask, endOfTaskResult, childThread }

const { setupTaskDisplay } = require('./display')


async function runTask (taskName, { skipStats } = {}) {
  if (!(taskName in tasks)) {
    throw new Error(`MetaMask build: Unrecognized task name "${taskName}"`)
  }
  if (!skipStats) {
    setupTaskDisplay(taskEvents)
    console.log(`running task "${taskName}"...`)
  }
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
  if (taskName in tasks) {
    throw new Error(`MetaMask build: task "${taskName}" already exists. Refusing to redefine`)
  }
  const task = instrumentForTaskStats(taskName, async () => {
    // await task done
    const result = taskFn()
    await endOfTaskResult(result)
  })
  task.taskName = taskName
  tasks[taskName] = task
  return task
}

function childThread (task) {
  const taskName = typeof task === 'string' ? task : task.taskName
  if (!taskName) {
    throw new Error(`MetaMask build: childThread unable to identify task name`)
  }
  return instrumentForTaskStats(taskName, async () => {
    const childProcess = spawn('yarn', ['build', taskName, '--skip-stats'])
    // forward logs to main process
    // skip the first stdout event (announcing the process command)
    childProcess.stdout.once('data', () => {
      childProcess.stdout.on('data', (data) => process.stdout.write(`${taskName}: ${data}`))
    })
    childProcess.stderr.on('data', (data) => process.stderr.write(`${taskName}: ${data}`))
    // await end of process
    await new Promise((resolve, reject) => {
      childProcess.once('close', (errCode) => {
        if (errCode !== 0) {
          reject(new Error(`MetaMask build: childThread for task "${taskName}" encountered an error`))
        }
        resolve()
      })
    })
  })
}

function instrumentForTaskStats (taskName, asyncFn) {
  return async () => {
    const start = Date.now()
    taskEvents.emit('start', [taskName, start])
    await asyncFn()
    const end = Date.now()
    taskEvents.emit('end', [taskName, start, end])
  }
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
