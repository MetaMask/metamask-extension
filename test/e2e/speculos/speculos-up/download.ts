import { createHash } from 'node:crypto';
import { readFileSync, createWriteStream } from 'node:fs';
import {
  mkdir,
  opendir,
  rm,
} from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { pipeline } from 'node:stream/promises';
import { Minipass } from 'minipass'; // eslint-disable-line import-x/no-extraneous-dependencies
import { extract as extractTar } from 'tar'; // eslint-disable-line import-x/no-extraneous-dependencies
import { Open } from 'unzipper';
import { getPlatformArch } from './platform';

function say(msg: string) {
  console.log(`[speculos-up] ${msg}`);
}

function noop() {
  return undefined;
}

const REPO = 'MetaMask/speculos-up';
const VERSION = '1.7.1';
const BINARY = 'speculos';

type ChecksumMap = Record<string, string>;

const CHECKSUMS: Record<string, ChecksumMap> = {
  'linux-amd64': {
    speculos: 'PLACEHOLDER_RUN_BUILD_PIPELINE_FIRST',
  },
  'darwin-arm64': {
    speculos: 'PLACEHOLDER_RUN_BUILD_PIPELINE_FIRST',
  },
};

function getCacheDir(): string {
  try {
    const yml = readFileSync('.yarnrc.yml', 'utf8');
    return join(cwd(), '.metamask', 'cache');
  } catch {
    return join(cwd(), '.metamask', 'cache');
  }
}

function getArchiveUrl(platformArch: string): string {
  const ext = platformArch.startsWith('linux') ? 'tar.gz' : 'zip';
  return `https://github.com/${REPO}/releases/download/v${VERSION}/speculos-${VERSION}-${platformArch}.${ext}`;
}

async function startDownload(url: URL) {
  const { request } = await import(url.protocol === 'http:' ? 'node:http' : 'node:https');
  return new Promise<NodeJS.ReadableStream>((resolve, reject) => {
    request(url, (res) => {
      if ((res.statusCode ?? 0) >= 300 && (res.statusCode ?? 0) < 400 && res.headers.location) {
        startDownload(new URL(res.headers.location, url)).then(resolve, reject);
        res.destroy();
        return;
      }
      if ((res.statusCode ?? 0) < 200 || (res.statusCode ?? 0) >= 300) {
        reject(new Error(`Download failed: ${res.statusCode}`));
        res.destroy();
        return;
      }
      resolve(res);
    }).on('error', reject).end();
  });
}

async function extractArchive(
  url: URL,
  destDir: string,
  expectedChecksum: string | undefined,
): Promise<string> {
  const isTar = url.pathname.endsWith('.tar.gz');
  await mkdir(destDir, { recursive: true });
  const stream = await startDownload(url);

  if (isTar) {
    const hash = expectedChecksum ? createHash('sha256') : null;
    await pipeline(
      stream,
      extractTar({
        cwd: destDir,
        transform: hash
          ? (entry) => {
              const pass = new Minipass({ async: true });
              pass.pipe(hash);
              return pass;
            }
          : undefined,
      }),
    );
    if (hash) {
      const actual = hash.digest('hex');
      if (actual !== expectedChecksum) {
        await rm(destDir, { recursive: true, force: true });
        throw new Error(
          `Checksum mismatch: expected ${expectedChecksum}, got ${actual}`,
        );
      }
      say(`checksum verified`);
    }
  } else {
    const agent = url.protocol === 'http:' ? new HttpAgent() : new HttpsAgent();
    (agent as { keepAlive?: boolean }).keepAlive = true;
    const source = {
      async size() {
        const dl = await startDownload(new URL(url.href));
        return 0;
      },
      stream(offset: number, bytes: number | undefined) {
        return startDownload(url);
      },
    };
    const { files } = await (Open as unknown as { custom: typeof Open.custom })(source, {});
    for (const f of files) {
      if (f.path.includes('speculos')) {
        const dest = join(destDir, f.path);
        const hash = expectedChecksum ? createHash('sha256') : null;
        const ws = createWriteStream(dest);
        const entry = f.stream();
        if (hash) {
          for await (const chunk of entry) {
            hash.update(chunk);
            ws.write(chunk);
          }
          ws.end();
          const actual = hash.digest('hex');
          if (actual !== expectedChecksum) {
            await rm(destDir, { recursive: true, force: true });
            throw new Error(
              `Checksum mismatch: expected ${expectedChecksum}, got ${actual}`,
            );
          }
          say(`checksum verified`);
        } else {
          for await (const chunk of entry) {
            ws.write(chunk);
          }
          ws.end();
        }
      }
    }
  }

  return join(destDir, BINARY);
}

export async function ensureSpeculosBinary(): Promise<string> {
  const platformArch = getPlatformArch();

  const localBinary = join(cwd(), 'test', 'e2e', 'speculos', 'apps', 'speculos');
  const { access } = await import('node:fs/promises');
  try {
    await access(localBinary);
    say(`using local binary at ${localBinary}`);
    return localBinary;
  } catch {
    // not found locally
  }

  const { execSync: which } = await import('node:child_process');
  try {
    const systemPath = which('which speculos || true', { encoding: 'utf-8' }).trim();
    if (systemPath) {
      say(`using system binary at ${systemPath}`);
      return 'speculos';
    }
  } catch {
    // not on system PATH
  }

  if (CHECKSUMS[platformArch]?.[BINARY] === 'PLACEHOLDER_RUN_BUILD_PIPELINE_FIRST') {
    throw new Error(
      `Speculos binary not available for ${platformArch}. ` +
      `Either install speculos (pip install speculos), ` +
      `place a binary at test/e2e/speculos/apps/speculos, ` +
      `or update checksums after running the build pipeline.`,
    );
  }

  const cacheDir = getCacheDir();
  const url = new URL(getArchiveUrl(platformArch));
  const cacheKey = createHash('sha256').update(url.href).digest('hex');
  const cachePath = join(cacheDir, cacheKey);

  try {
    await opendir(cachePath);
    say(`found binary in cache`);
    return join(cachePath, BINARY);
  } catch {
    // not cached yet
  }

  say(`downloading speculos ${VERSION} for ${platformArch}...`);
  const tempDir = `${cachePath}.downloading`;
  await rm(tempDir, { recursive: true, force: true }).catch(noop);
  await mkdir(tempDir, { recursive: true });

  const checksum = CHECKSUMS[platformArch]?.[BINARY];
  await extractArchive(url, tempDir, checksum);

  await rm(cachePath, { recursive: true, force: true }).catch(noop);
  const { rename } = await import('node:fs/promises');
  await rename(tempDir, cachePath);

  say(`installed speculos ${VERSION}`);
  return join(cachePath, BINARY);
}
