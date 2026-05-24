import { spawn, ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { ensureSpeculosBinary } from './speculos-up';
import { DEFAULT_DEVICE, type DeviceConfig } from './constants';

const READINESS_STRING = 'RESTful API available on';

export type SpeculosProcessOptions = {
  app: string;
  model?: string;
  seed?: string;
  apduPort?: number;
  apiPort?: number;
  display?: string;
  startTimeout?: number;
  stopTimeout?: number;
};

export type SpeculosProcess = {
  start(): Promise<void>;
  stop(): Promise<void>;
  readonly status: 'idle' | 'starting' | 'listening' | 'stopping';
  readonly pid: number | undefined;
};

export function createSpeculosProcess(
  options: SpeculosProcessOptions,
): SpeculosProcess {
  let proc: ChildProcess | undefined;
  let status: 'idle' | 'starting' | 'listening' | 'stopping' = 'idle';
  const emitter = new EventEmitter();

  function buildArgs(): string[] {
    const args: string[] = [];
    if (options.model) {
      args.push('--model', options.model);
    }
    if (options.seed) {
      args.push('--seed', options.seed);
    }
    if (options.apduPort !== undefined) {
      args.push('--apdu-port', String(options.apduPort));
    }
    if (options.apiPort !== undefined) {
      args.push('--api-port', String(options.apiPort));
    }
    if (options.display) {
      args.push('--display', options.display);
    }
    args.push(options.app);
    return args;
  }

  async function start(): Promise<void> {
    if (status !== 'idle') {
      throw new Error(`Speculos process not idle (current: ${status})`);
    }
    status = 'starting';

    const binaryPath = await ensureSpeculosBinary();
    const args = buildArgs();
    const timeout = options.startTimeout ?? 30_000;

    return new Promise((resolve, reject) => {
      let lastLog: string | undefined;
      let exited = false;

      const onExit = (code: number | null) => {
        exited = true;
        if (status === 'starting') {
          status = 'idle';
          reject(
            new Error(
              `Speculos exited during startup${lastLog ? `: ${lastLog}` : ''} (code ${code})`,
            ),
          );
        }
      };

      const onStdout = (data: Buffer) => {
        const line = data.toString();
        emitter.emit('log', line);
        lastLog = line;

        if (status === 'starting' && line.includes(READINESS_STRING)) {
          status = 'listening';
          proc?.removeListener('exit', onExit);
          resolve();
        }
      };

      const startTimer = setTimeout(() => {
        proc?.kill('SIGTERM');
        status = 'idle';
        reject(new Error('Speculos failed to start within timeout'));
      }, timeout);

      proc = spawn(binaryPath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
      proc.stdout?.on('data', onStdout);
      proc.stderr?.on('data', onStdout);
      proc.on('exit', onExit);
      proc.on('error', (err) => {
        clearTimeout(startTimer);
        status = 'idle';
        reject(err);
      });
    });
  }

  async function stop(): Promise<void> {
    if (!proc || status === 'idle') {
      return;
    }
    status = 'stopping';
    const timeout = options.stopTimeout ?? 10_000;

    return new Promise((resolve) => {
      const stopTimer = setTimeout(() => {
        proc?.kill('SIGKILL');
        status = 'idle';
        resolve();
      }, timeout);

      if (proc) {
        proc.on('exit', () => {
          clearTimeout(stopTimer);
          status = 'idle';
          proc = undefined;
          resolve();
        });
        proc.kill('SIGTERM');
      } else {
        clearTimeout(stopTimer);
        status = 'idle';
        resolve();
      }
    });
  }

  return {
    start,
    stop,
    get status() {
      return status;
    },
    get pid() {
      return proc?.pid;
    },
  };
}
