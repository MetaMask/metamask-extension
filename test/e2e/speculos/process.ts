import { spawn, ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import net from 'node:net';
import { ensureSpeculosBinary } from './speculos-up';

// Speculos 0.26.x deliberately suppresses Flask's startup banner
// (`flask.cli.show_server_banner = lambda *a: None`) and disables the
// Werkzeug logger when not running with `--verbose`, so the historical
// stdout markers ("RESTful API available on", "Server started on") never
// appear. We instead consider Speculos ready once both the APDU TCP port
// and the REST API TCP port accept connections.
const READINESS_POLL_INTERVAL_MS = 250;
const READINESS_PROBE_TIMEOUT_MS = 1000;
const DEFAULT_APDU_PORT = 9999;
const DEFAULT_API_PORT = 5000;
const LOG_SPECULOS_STDIO =
  process.env.SPECULOS_LOG_STDIO === 'true' ||
  process.env.SPECULOS_VERBOSE === 'true';

export type SpeculosProcessOptions = {
  app: string;
  model?: string;
  seed?: string;
  apduPort?: number;
  apiPort?: number;
  display?: string;
  loadNvram?: boolean;
  cwd?: string;
  startTimeout?: number;
  stopTimeout?: number;
};

export type SpeculosProcess = {
  start(): Promise<void>;
  stop(): Promise<void>;
  readonly status: 'idle' | 'starting' | 'listening' | 'stopping';
  readonly pid: number | undefined;
};

function isTcpReachable(
  port: number,
  host = '127.0.0.1',
  timeoutMs = READINESS_PROBE_TIMEOUT_MS,
): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) {
        return;
      }
      settled = true;
      sock.destroy();
      resolve(ok);
    };
    sock.setTimeout(timeoutMs);
    sock.once('connect', () => finish(true));
    sock.once('timeout', () => finish(false));
    sock.once('error', () => finish(false));
    sock.connect(port, host);
  });
}

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
    if (options.loadNvram) {
      args.push('--load-nvram');
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
    const timeout = options.startTimeout ?? 60_000;
    const apduPort = options.apduPort ?? DEFAULT_APDU_PORT;
    const apiPort = options.apiPort ?? DEFAULT_API_PORT;

    console.log(`[Speculos] Starting: ${binaryPath} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      let lastLog: string | undefined;
      let settled = false;
      let pollHandle: NodeJS.Timeout | undefined;
      let startTimer: NodeJS.Timeout | undefined;

      const onExit = (code: number | null) => {
        if (settled) {
          return;
        }
        if (status === 'starting') {
          settled = true;
          status = 'idle';
          if (pollHandle) {
            clearTimeout(pollHandle);
            pollHandle = undefined;
          }
          if (startTimer) {
            clearTimeout(startTimer);
            startTimer = undefined;
          }
          reject(
            new Error(
              `Speculos exited during startup${lastLog ? `: ${lastLog.trim()}` : ''} (code ${code})`,
            ),
          );
        }
      };

      const cleanup = () => {
        if (pollHandle) {
          clearTimeout(pollHandle);
          pollHandle = undefined;
        }
        if (startTimer) {
          clearTimeout(startTimer);
          startTimer = undefined;
        }
        proc?.removeListener('exit', onExit);
      };

      const onStdout = (data: Buffer) => {
        const line = data.toString();
        emitter.emit('log', line);
        lastLog = line;
        if (LOG_SPECULOS_STDIO) {
          console.log(`[Speculos] ${line.trimEnd()}`);
        }
      };

      startTimer = setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        proc?.kill('SIGTERM');
        status = 'idle';
        reject(new Error('Speculos failed to start within timeout'));
      }, timeout);

      const pollReady = async () => {
        if (settled) {
          return;
        }
        try {
          const [apduOk, apiOk] = await Promise.all([
            isTcpReachable(apduPort),
            isTcpReachable(apiPort),
          ]);
          if (apduOk && apiOk) {
            if (settled) {
              return;
            }
            settled = true;
            status = 'listening';
            cleanup();
            console.log(
              `[Speculos] Ready (APDU :${apduPort}, API :${apiPort})`,
            );
            resolve();
            return;
          }
        } catch {
          // probe failure is non-fatal; just keep polling
        }
        if (!settled) {
          pollHandle = setTimeout(pollReady, READINESS_POLL_INTERVAL_MS);
        }
      };

      const spawnOpts: import('node:child_process').SpawnOptions = {
        stdio: ['pipe', 'pipe', 'pipe'],
      };
      if (options.cwd) {
        spawnOpts.cwd = options.cwd;
      }
      proc = spawn(binaryPath, args, spawnOpts);
      proc.stdout?.on('data', onStdout);
      proc.stderr?.on('data', onStdout);
      proc.on('exit', onExit);
      proc.on('error', (err) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        status = 'idle';
        reject(err);
      });

      pollHandle = setTimeout(pollReady, READINESS_POLL_INTERVAL_MS);
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
