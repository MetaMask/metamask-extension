import type { ChildProcess } from 'node:child_process';
import { type Readable } from 'node:stream';
import { type Socket } from 'node:net';
import { type IPty } from 'node-pty';

/**
 * A more complete type for the `node-pty` module's `IPty` interface
 */
export type PTY = IPty & {
  master: Socket;
  slave: Socket;
};

/**
 * Node's ChildProcess type extended with `stderr` and `stdout`'s `unref`
 * method, which is missing from the standard Node.js types.
 */
export type Child = ChildProcess & {
  stderr: Readable & { unref: () => Readable };
  stdout: Readable & { unref: () => Readable };
};

export type StdName = 'stdout' | 'stderr';

/**
 * The control interface for a child process's stdio streams.
 */
export type Stdio = {
  destroy: () => void;
  listen: (child: Child) => void;
  pty: Socket | 'pipe';
  resize: () => void;
  unref: (child: Child) => void;
};
