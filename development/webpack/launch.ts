#!/usr/bin/env -S node --require "./node_modules/tsx/dist/preflight.cjs" --import "./node_modules/tsx/dist/loader.mjs"

/**
 * @file This script optimizes build processes by conditionally forking child
 * processes based on command-line arguments. It handles memory management,
 * stdio stream creation, and process lifecycle to improve performance and
 * maintainability. Supports cross-platform execution with specific
 * considerations for Windows environments.
 *
 * On Linux-like systems you can skip the overhead of running `yarn` by
 * executing this file directly, e.g., `./development/webpack/launch.ts`, or via
 * bun or tsx.
 */

// Note: minimize non-`type` imports to decrease load time.
import { join } from 'node:path';
import { spawn, type StdioOptions } from 'node:child_process';
import parser from 'yargs-parser';
import type { Child, PTY, Stdio, StdName } from './types';

const rawArgv = process.argv.slice(2);

const alias = { cache: 'c', help: 'h', watch: 'h' };
type Args = { [x in keyof typeof alias]?: boolean };
const args = parser(rawArgv, { alias, boolean: Object.keys(alias) }) as Args;

if (args.cache === false || args.help === true || args.watch === true) {
  // there are no time savings to running the build in a child process if the
  // cache is disabled, we need to output "help", or we're in watch mode.
  import(join(__dirname, 'build.ts')).then(({ build }) => build());
} else {
  fork(process, join(__dirname, 'fork.mts'), rawArgv);
}

/**
 * Runs the `file` in a child process. This allows the parent process to
 * exit as soon as the build completes, but lets the child process continue to
 * serialize and persist the cache in the background.
 *
 * @param process - The parent process, like `globalThis.process`
 * @param file - Path to the file to run, given as an argument to the command
 * @param argv - Arguments to pass to the executable
 */
function fork(process: NodeJS.Process, file: string, argv: string[]) {
  const env = { NODE_OPTIONS: '', ...process.env, PPID: `${process.pid}` };
  // node recommends using 75% of the available memory for `max-old-space-size`
  // https://github.com/nodejs/node/blob/dd67bf08cb1ab039b4060d381cc68179ee78701a/doc/api/cli.md#--max-old-space-sizesize-in-megabytes
  const maxOldSpaceMB = ~~((require('node:os').totalmem() * 0.75) / (1 << 20));
  // `--huge-max-old-generation-size` and `--max-semi-space-size=128` reduce
  // garbage collection pauses; 128MB provided max benefit in perf testing.
  const nodeOptions = [
    `--max-old-space-size=${maxOldSpaceMB}`,
    '--max-semi-space-size=128',
    '--huge-max-old-generation-size',
  ];

  // run the build in a child process so that we can exit the parent process as
  // soon as the build completes, but let the cache serialization finish in the
  // background (the cache can take 30% of build-time to serialize and persist).
  const { connectToChild, destroy, stdio } = createOutputStreams(process);

  const node = process.execPath;
  const options = { detached: true, env, stdio };
  spawn(node, [...nodeOptions, ...process.execArgv, file, ...argv], options)
    .once('close', destroy) // clean up if the child crashes
    .once('spawn', connectToChild);
}

/**
 * Create the stdio streams (stderr and stdout) for the child process to use and
 * for the parent to control and listen to.
 *
 * @param process - The parent process, like `globalThis.process`
 * @returns The stdio streams for the child process to use
 */
function createOutputStreams(process: NodeJS.Process) {
  const { isatty } = require('node:tty');
  const isWindows = process.platform === 'win32';
  // use IPC for communication on Windows, as it doesn't support POSIX signals
  const ipc = isWindows ? 'ipc' : 'ignore';
  const outs = (['stdout', 'stderr'] as const).map(function createStream(name) {
    const parentStream = process[name];
    // TODO: get Windows PTY working
    return !isWindows && isatty(parentStream.fd)
      ? createTTYStream(parentStream)
      : createNonTTYStream(parentStream, name);
  }) as [Stdio, Stdio];

  return {
    /**
     *
     * @param this
     * @param child
     */
    connectToChild(this: Child, child = this) {
      // hook up the child's stdio to the parent's & unref so we can exit later
      outs.forEach((stream) => {
        stream.listen(child);
        stream.unref(child);
      });

      listenForShutdownSignal(process, child);

      process
        // kill the child process if we didn't exit cleanly
        .on('exit', (code) => code > 128 && child.kill(code - 128))
        // `SIGWINCH` means the terminal was resized
        .on('SIGWINCH', function handleSigwinch(signal) {
          // resize the tty's
          outs.forEach((out) => out.resize());
          // then tell the child process to update its dimensions
          child.kill(signal);
        });
    },
    destroy: () => outs.forEach((out) => out.destroy()),
    stdio: ['ignore', outs[0].pty, outs[1].pty, ipc] as StdioOptions,
  };
}

/**
 * Create a non-TTY (pipe) stream for the child process to use as its stdio.
 *
 * @param stream - The parent process's stdio stream
 * @param name - Either `stdout` or `stderr`
 * @returns The stream for the child process to use
 */
function createNonTTYStream(stream: NodeJS.WriteStream, name: StdName): Stdio {
  return {
    destroy: () => undefined,
    listen: (child: Child) => void child[name].pipe(stream),
    pty: 'pipe', // let Node create the Pipes
    resize: () => undefined,
    unref: (child: Child) => void child[name].unref(),
  };
}

/**
 * Create a PTY stream for the child process to use as its stdio.
 *
 * @param stream - The parent process's stdio stream
 * @returns The PTY stream for the child process to use
 */
function createTTYStream(stream: NodeJS.WriteStream): Stdio {
  // create a PTY (Pseudo TTY) so the child stream behaves like a TTY
  const options = { cols: stream.columns, encoding: null, rows: stream.rows };
  const pty: PTY = require('node-pty').open(options);

  return {
    destroy: () => {
      pty.master.destroy();
      pty.slave.destroy();
    },
    listen: (_child: Child) => void pty.master.pipe(stream),
    pty: pty.slave,
    resize: () => pty.resize(stream.columns, stream.rows),
    unref: (_child: Child) => {
      pty.master.unref();
      pty.slave.unref();
    },
  };
}

/**
 * Listens for a shutdown signal either on the child's IPC channel or via the
 * parent process's `SIGUSR2` event. When the signal is received, the child
 * process is unref'd so that it can continue running in the background.
 *
 * Once the child process is unref'd, the parent process may exit on its own.
 *
 * @param process - The parent process, like `globalThis.process`
 * @param child - The child process to listen to
 */
function listenForShutdownSignal(process: NodeJS.Process, child: Child) {
  // exit gracefully when the child signals the parent via `SIGUSR2`
  if (child.channel === null || child.channel === undefined) {
    process.on('SIGUSR2', () => child.unref());
  } else {
    child.channel.unref();
    child.on('message', (signal) => signal === 'SIGUSR2' && child.unref());
  }
}
