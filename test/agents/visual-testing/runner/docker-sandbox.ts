import {
  DEFAULT_DOCKER_SANDBOX_WORKSPACE_PATH,
  type DockerSandboxConfig,
} from '@metamask/agent-runner';

/**
 * Absolute path inside the sandbox container where the host workspace
 * (the MetaMask extension repo) is bind-mounted. Derived from the
 * runner package default so the two stay in sync.
 */
const CONTAINER_WORKSPACE_PATH = DEFAULT_DOCKER_SANDBOX_WORKSPACE_PATH;

/**
 * Path inside the container to the `.mm-server` state file written by the
 * host `mm launch` step (resolved relative to the workspace mount).
 */
const CONTAINER_MM_SERVER_PATH = `${CONTAINER_WORKSPACE_PATH}/.mm-server`;

/**
 * Path to the per-container proxy script that bridges the sandbox's
 * `127.0.0.1:<port>` to the host's daemon over `host.docker.internal`.
 */
const PROXY_SCRIPT_PATH = '/tmp/mm-daemon-proxy.js';

/**
 * Log file the in-container proxy writes to. Useful for post-mortem when
 * `mm` calls fail from inside the sandbox.
 */
const PROXY_LOG_PATH = '/tmp/mm-daemon-proxy.log';

/**
 * Hostname Docker exposes for the host machine. On macOS/Windows this is
 * resolved automatically; on Linux we add it explicitly via
 * `--add-host host.docker.internal:host-gateway`.
 */
const HOST_GATEWAY_HOSTNAME = 'host.docker.internal';

/**
 * Node.js source that runs inside the sandbox container. It reads the
 * daemon port from {@link CONTAINER_MM_SERVER_PATH} (written by the host
 * `mm launch` step before the agent starts) and starts a TCP forwarder on
 * `127.0.0.1:<port>` that proxies to `host.docker.internal:<port>` so the
 * sandboxed `mm` CLI (which hard-codes 127.0.0.1) reaches the host daemon.
 */
const PROXY_SCRIPT_SOURCE = `'use strict';
const fs = require('fs');
const net = require('net');

const STATE_PATH = ${JSON.stringify(CONTAINER_MM_SERVER_PATH)};
const UPSTREAM_HOST = ${JSON.stringify(HOST_GATEWAY_HOSTNAME)};

function readPort() {
  try {
    const raw = fs.readFileSync(STATE_PATH, 'utf-8');
    const data = JSON.parse(raw);
    if (typeof data.port === 'number' && Number.isInteger(data.port) && data.port > 0 && data.port <= 65535) {
      return data.port;
    }
  } catch (_err) {
    /* file may not exist yet */
  }
  return null;
}

function waitForPort(maxAttempts, intervalMs) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tick = () => {
      const port = readPort();
      if (port !== null) {
        resolve(port);
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        reject(new Error('no port found in ' + STATE_PATH));
        return;
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

waitForPort(50, 200).then((port) => {
  const server = net.createServer((client) => {
    const remote = net.connect({ host: UPSTREAM_HOST, port }, () => {
      client.pipe(remote);
      remote.pipe(client);
    });
    remote.on('error', (err) => {
      console.error('[mm-daemon-proxy] upstream error:', err.message);
      client.destroy();
    });
    remote.on('close', () => client.destroy());
    client.on('error', (err) => {
      console.error('[mm-daemon-proxy] client error:', err.message);
      remote.destroy();
    });
    client.on('close', () => remote.destroy());
  });
  server.on('error', (err) => {
    console.error('[mm-daemon-proxy] listen error:', err.message);
    process.exit(1);
  });
  server.listen(port, '127.0.0.1', () => {
    console.error(
      '[mm-daemon-proxy] listening on 127.0.0.1:' + port +
        ' -> ' + UPSTREAM_HOST + ':' + port,
    );
  });
}).catch((err) => {
  console.error('[mm-daemon-proxy] startup failed:', err.message);
  process.exit(1);
});
`;

/**
 * Shell command that installs a `yarn` shim in `$HOME/.local/bin/yarn`.
 * It fast-paths `yarn mm ...` to the project-local binary, then falls back
 * to `corepack yarn` for other invocations.
 */
const YARN_SHIM_COMMAND = [
  'set -eu',
  'mkdir -p "$HOME/.local/bin"',
  "cat > \"$HOME/.local/bin/yarn\" <<'YARN_SHIM_EOF'",
  '#!/bin/sh',
  'if [ "$#" -gt 0 ] && [ "$1" = "mm" ]; then',
  '  shift',
  `  exec ${CONTAINER_WORKSPACE_PATH}/node_modules/.bin/mm "$@"`,
  'fi',
  'if [ "$#" -gt 1 ] && [ "$1" = "run" ] && [ "$2" = "mm" ]; then',
  '  shift 2',
  `  exec ${CONTAINER_WORKSPACE_PATH}/node_modules/.bin/mm "$@"`,
  'fi',
  'exec corepack yarn "$@"',
  'YARN_SHIM_EOF',
  'chmod +x "$HOME/.local/bin/yarn"',
].join('\n');

/**
 * Shell command that writes the proxy script to disk, launches it in the
 * background, and polls until the proxy is confirmed listening or has
 * exited. Fails the setup command with a clear message if the proxy
 * never becomes ready.
 */
const PROXY_LAUNCH_COMMAND = [
  'set -eu',
  `cat > ${PROXY_SCRIPT_PATH} <<'MM_PROXY_EOF'`,
  PROXY_SCRIPT_SOURCE,
  'MM_PROXY_EOF',
  `: > ${PROXY_LOG_PATH}`,
  `nohup node ${PROXY_SCRIPT_PATH} > ${PROXY_LOG_PATH} 2>&1 &`,
  'PROXY_PID=$!',
  'disown 2>/dev/null || true',
  // Poll up to 15 seconds for the proxy to report "listening" or exit.
  'ATTEMPTS=0',
  'while [ "$ATTEMPTS" -lt 30 ]; do',
  `  if grep -q "listening" ${PROXY_LOG_PATH} 2>/dev/null; then`,
  '    break',
  '  fi',
  '  if ! kill -0 "$PROXY_PID" 2>/dev/null; then',
  `    echo "mm-daemon-proxy exited before becoming ready:" >&2`,
  `    cat ${PROXY_LOG_PATH} >&2`,
  '    exit 1',
  '  fi',
  '  ATTEMPTS=$((ATTEMPTS + 1))',
  '  sleep 0.5',
  'done',
  'if [ "$ATTEMPTS" -ge 30 ]; then',
  `  echo "mm-daemon-proxy did not become ready within 15s:" >&2`,
  `  cat ${PROXY_LOG_PATH} >&2`,
  '  exit 1',
  'fi',
].join('\n');

/**
 * Builds the Docker sandbox configuration used for visual-testing eval
 * trials.
 *
 * The host runs deterministic setup (`mm launch`, fixture seeding, etc.)
 * and writes `.mm-server` into the workspace. The sandbox then:
 * - bind-mounts the workspace at `/workspace`,
 * - installs a `yarn` shim so `yarn mm ...` works,
 * - starts a TCP proxy from the sandbox daemon port to the host daemon.
 *
 * @param extensionHostPath - Absolute host path to the MetaMask extension repo.
 * @returns A Docker sandbox configuration suitable for `runner.runAgent`.
 */
export function buildDockerSandboxConfig(
  extensionHostPath: string,
): DockerSandboxConfig {
  return {
    type: 'docker',
    workspace: {
      hostPath: extensionHostPath,
      containerPath: CONTAINER_WORKSPACE_PATH,
    },
    workdir: CONTAINER_WORKSPACE_PATH,
    env: {
      MM_PROJECT: CONTAINER_WORKSPACE_PATH,
      FORCE_COLOR: '0',
      PATH: [
        '/home/agent/.local/bin',
        `${CONTAINER_WORKSPACE_PATH}/node_modules/.bin`,
        '/usr/local/share/npm-global/bin',
        '/usr/local/sbin',
        '/usr/local/bin',
        '/usr/sbin',
        '/usr/bin',
        '/sbin',
        '/bin',
      ].join(':'),
    },
    // Required so `host.docker.internal` resolves on Linux runners.
    // No-op on macOS/Windows Docker Desktop where the alias already exists.
    unsafeDockerArgs: ['--add-host', `${HOST_GATEWAY_HOSTNAME}:host-gateway`],
    setupCommands: [YARN_SHIM_COMMAND, PROXY_LAUNCH_COMMAND],
    cleanup: 'on-success',
  };
}
