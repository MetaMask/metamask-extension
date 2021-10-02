const EventEmitter = require('events');
const randomColor = require('randomcolor');
const concurrently = require('concurrently');

const tasks = {};
const taskEvents = new EventEmitter();
const colors = randomColor({ count: 16 });

module.exports = {
  tasks,
  taskEvents,
  createTask,
  runTask,
  composeSeries,
  composeParallel,
  runInChildProcess,
};

const { setupTaskDisplay } = require('./display');

async function runTask(taskName, { skipStats } = {}) {
  if (!(taskName in tasks)) {
    throw new Error(`MetaMask build: Unrecognized task name "${taskName}"`);
  }
  if (!skipStats) {
    setupTaskDisplay(taskEvents);
    console.log(`Running task "${taskName}"...`);
  }
  try {
    await tasks[taskName]();
  } catch (err) {
    console.error(
      `MetaMask build: Encountered an error while running task "${taskName}".`,
    );
    console.error(err);
    process.exit(1);
  }
  taskEvents.emit('complete');
}

function createTask(taskName, taskFn) {
  if (taskName in tasks) {
    throw new Error(
      `MetaMask build: task "${taskName}" already exists. Refusing to redefine`,
    );
  }
  const index = Object.keys(tasks).length;
  const color = colors[index % colors.length];
  const task = instrumentForTaskStats(taskName, color, taskFn);
  task.color = color;
  task.taskName = taskName;
  tasks[taskName] = task;
  return task;
}

function runInChildProcess(
  task,
  { buildType, isLavaMoat, shouldLintFenceFiles },
) {
  const taskName = typeof task === 'string' ? task : task.taskName;
  if (!taskName) {
    throw new Error(
      `MetaMask build: runInChildProcess unable to identify task name`,
    );
  }

  return instrumentForTaskStats(taskName, task.color, async () => {
    const commandString = [
      'yarn',
      isLavaMoat ? 'build' : 'build:dev',
      taskName,
      '--build-type',
      buildType,
      '--lint-fence-files',
      shouldLintFenceFiles,
      '--skip-stats',
    ].join(' ');
    const command = {
      command: commandString,
      name: taskName,
      env: process.env,
      prefixColor: task.color,
    };
    await concurrently([command]);
  });
}

function instrumentForTaskStats(taskName, color, asyncFn) {
  return async () => {
    const start = Date.now();
    taskEvents.emit('start', [taskName, start, color]);
    await asyncFn();
    const end = Date.now();
    taskEvents.emit('end', [taskName, start, end, color]);
  };
}

function composeSeries(...subtasks) {
  return async () => {
    const realTasks = subtasks;
    for (const subtask of realTasks) {
      await subtask();
    }
  };
}

function composeParallel(...subtasks) {
  return async () => {
    const realTasks = subtasks;
    await Promise.all(realTasks.map((subtask) => subtask()));
  };
}
