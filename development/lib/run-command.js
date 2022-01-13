const spawn = require('cross-spawn');

/**
 * Run a command to completion using the system shell.
 *
 * This will run a command with the specified arguments, and resolve when the
 * process has exited. The STDOUT stream is monitored for output, which is
 * returned after being split into lines. All output is expected to be UTF-8
 * encoded, and empty lines are removed from the output.
 *
 * Anything received on STDERR is assumed to indicate a problem, and is tracked
 * as an error.
 *
 * @param {string} command - The command to run
 * @param {Array<string>} [args] - The arguments to pass to the command
 * @returns {Array<string>} Lines of output received via STDOUT
 */
async function runCommand(command, args) {
  const output = [];
  let mostRecentError;
  let errorSignal;
  let errorCode;
  const internalError = new Error('Internal');
  try {
    await new Promise((resolve, reject) => {
      const childProcess = spawn(command, args, { encoding: 'utf8' });
      childProcess.stdout.setEncoding('utf8');
      childProcess.stderr.setEncoding('utf8');

      childProcess.on('error', (error) => {
        mostRecentError = error;
      });

      childProcess.stdout.on('data', (message) => {
        const nonEmptyLines = message.split('\n').filter((line) => line !== '');
        output.push(...nonEmptyLines);
      });

      childProcess.stderr.on('data', (message) => {
        mostRecentError = new Error(message.trim());
      });

      childProcess.once('exit', (code, signal) => {
        if (code === 0) {
          return resolve();
        }
        errorCode = code;
        errorSignal = signal;
        return reject(internalError);
      });
    });
  } catch (error) {
    /**
     * The error is re-thrown here in an `async` context to preserve the stack trace. If this was
     * was thrown inside the Promise constructor, the stack trace would show a few frames of
     * Node.js internals then end, without indicating where `runCommand` was called.
     */
    if (error === internalError) {
      let errorMessage;
      if (errorCode !== null && errorSignal !== null) {
        errorMessage = `Terminated by signal '${errorSignal}'; exited with code '${errorCode}'`;
      } else if (errorSignal !== null) {
        errorMessage = `Terminaled by signal '${errorSignal}'`;
      } else if (errorCode === null) {
        errorMessage = 'Exited with no code or signal';
      } else {
        errorMessage = `Exited with code '${errorCode}'`;
      }
      const improvedError = new Error(errorMessage);
      if (mostRecentError) {
        improvedError.cause = mostRecentError;
      }
      throw improvedError;
    }
  }
  return output;
}

/**
 * Run a command to using the system shell.
 *
 * This will run a command with the specified arguments, and resolve when the
 * process has exited. The STDIN, STDOUT and STDERR streams are inherited,
 * letting the command take over completely until it completes. The success or
 * failure of the process is determined entirely by the exit code; STDERR
 * output is not used to indicate failure.
 *
 * @param {string} command - The command to run
 * @param {Array<string>} [args] - The arguments to pass to the command
 */
async function runInShell(command, args) {
  let errorSignal;
  let errorCode;
  const internalError = new Error('Internal');
  try {
    await new Promise((resolve, reject) => {
      const childProcess = spawn(command, args, {
        encoding: 'utf8',
        stdio: 'inherit',
      });

      childProcess.once('exit', (code, signal) => {
        if (code === 0) {
          return resolve();
        }
        errorCode = code;
        errorSignal = signal;
        return reject(internalError);
      });
    });
  } catch (error) {
    /**
     * The error is re-thrown here in an `async` context to preserve the stack trace. If this was
     * was thrown inside the Promise constructor, the stack trace would show a few frames of
     * Node.js internals then end, without indicating where `runInShell` was called.
     */
    if (error === internalError) {
      let errorMessage;
      if (errorCode !== null && errorSignal !== null) {
        errorMessage = `Terminated by signal '${errorSignal}'; exited with code '${errorCode}'`;
      } else if (errorSignal !== null) {
        errorMessage = `Terminaled by signal '${errorSignal}'`;
      } else if (errorCode === null) {
        errorMessage = 'Exited with no code or signal';
      } else {
        errorMessage = `Exited with code '${errorCode}'`;
      }
      const improvedError = new Error(errorMessage);
      throw improvedError;
    }
  }
}

module.exports = { runCommand, runInShell };
