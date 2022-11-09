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
const { logError } = require('./utils');

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
    logError(err);
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
  { applyLavaMoat, buildType, isLavaMoat, policyOnly, shouldLintFenceFiles },
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
      // Use the same build type for subprocesses, and only run them in
      // LavaMoat if the parent process also ran in LavaMoat.
      isLavaMoat ? 'build' : 'build:dev',
      taskName,
      `--apply-lavamoat=${applyLavaMoat ? 'true' : 'false'}`,
      `--build-type=${buildType}`,
      `--lint-fence-files=${shouldLintFenceFiles ? 'true' : 'false'}`,
      `--policyOnly=${policyOnly ? 'true' : 'false'}`,
      '--skip-stats=true',
    ].join(' ');
    const command = {
      command: commandString,
      name: taskName,
      env: process.env,
      prefixColor: task.color,
    };
    const { result: resultPromise } = concurrently([command]);
    await resultPromise;
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
