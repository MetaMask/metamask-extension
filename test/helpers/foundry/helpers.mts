import { ok } from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { rename, mkdir, rm } from 'node:fs/promises';
import {
  Agent as HttpAgent,
  request as httpRequest,
  type IncomingMessage,
} from 'node:http';
import { Agent as HttpsAgent, request as httpsRequest } from 'node:https';
import { join, basename, extname, relative } from 'node:path';
import { argv, stdout } from 'node:process';
import { arch, platform } from 'node:os';
import { Stream } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { extract as extractTar } from 'tar';
import { Open as Unzip, type Source, type Entry } from 'unzipper';
import yargs from 'yargs/yargs';
import { Minipass } from 'minipass';
import {
  type BinariesTuple,
  type Checksums,
  type PlatformArchChecksums,
  Architecture,
  Extension,
  Binary,
  Platform,
  ParsedOptions,
  ArchitecturesTuple,
  PlatformsTuple,
  DownloadOptions,
} from './types.mts';

export function noop() {}

const Binaries = Object.values(Binary) as BinariesTuple;

export function parseArgs(args: string[] = argv.slice(2)) {
  const { $0, _, ...parsed } = yargs()
    // Ensure unrecognized commands/options are reported as errors.
    .strict()
    // disable yargs's version, as it doesn't make sense here
    .version(false)
    // use the scriptName in `--help` output
    .scriptName('yarn foundryup')
    // wrap output at a maximum of 120 characters or `stdout.columns`
    .wrap(Math.min(120, stdout.columns))
    .parserConfiguration({
      'strip-aliased': true,
      'strip-dashed': true,
    })
    // enable ENV parsing, which allows the user to specify foundryup options
    // via environment variables prefixed with `FOUNDRYUP_`
    .env('FOUNDRYUP')
    .command(['$0', 'install'], 'Install foundry binaries', (yargs) => {
      yargs.options(getOptions()).pkgConf('foundryup');
    })
    .command('cache', '', (yargs) => {
      yargs.command('clean', 'Remove the shared cache files').demandCommand();
    })
    .parseSync(args);

  const command = _.join(' ');
  switch (command) {
    case 'cache clean':
      return {
        command,
      } as const;
    case '':
    case 'install':
      return {
        command: 'install',
        options: parsed as ParsedOptions<ReturnType<typeof getOptions>>,
      } as const;
  }
  throw new Error(`Unknown command: '${command}'`);
}

function getOptions(
  defaultPlatform = platform(),
  defaultArch = normalizeSystemArchitecture(),
) {
  return {
    binaries: {
      alias: 'b',
      type: 'array' as const,
      multiple: true,
      description: 'Specify the binaries to install',
      default: Binaries,
      choices: Binaries,
      coerce: (values: Binary[]): Binary[] => [...new Set(values)], // Remove duplicates
    },
    checksums: {
      alias: 'c',
      description: 'JSON object containing checksums for the binaries.',
      coerce: (rawChecksums: string | Checksums): Checksums => {
        try {
          return typeof rawChecksums === 'string'
            ? JSON.parse(rawChecksums)
            : rawChecksums;
        } catch {
          throw new Error('Invalid checksums');
        }
      },
    },
    repo: {
      alias: 'r',
      description: 'Specify the repository',
      default: 'foundry-rs/foundry',
    },
    version: {
      alias: 'v',
      description:
        'Specify the version (see: https://github.com/foundry-rs/foundry/tags)',
      default: 'nightly',
      coerce: (
        rawVersion: string,
      ): { version: 'nightly' | `v${string}`; tag: string } => {
        if (/^nightly/u.test(rawVersion)) {
          return { version: 'nightly', tag: rawVersion };
          // we don't validate the version much, we just trust the user
        } else if (/^\d/u.test(rawVersion)) {
          return { version: `v${rawVersion}`, tag: rawVersion };
        }
        throw new Error('Invalid version');
      },
    },
    arch: {
      alias: 'a',
      description: 'Specify the architecture',
      // if `defaultArch` is not a supported Architecture yargs will throw an error
      default: defaultArch as Architecture,
      choices: Object.values(Architecture) as ArchitecturesTuple,
    },
    platform: {
      alias: 'p',
      description: 'Specify the platform',
      // if `defaultPlatform` is not a supported Platform yargs will throw an error
      default: defaultPlatform as Platform,
      choices: Object.values(Platform) as PlatformsTuple,
    },
  };
}

/**
 * Returns the system architecture, normalized to one of the supported
 * {@link Architecture} values.
 * @param architecture
 * @returns
 */
function normalizeSystemArchitecture(
  architecture: string = arch(),
): Architecture {
  if (architecture.startsWith('arm')) {
    // if `arm*`, use `arm64`
    return Architecture.Arm64;
  } else if (architecture === 'x64') {
    // if `x64`, it _might_ be amd64 running via Rosetta on Apple Silicon
    // (arm64). we can check this by running `sysctl.proc_translated` and
    // checking the output; `1` === `arm64`. This can happen if the user is
    // running an amd64 version of Node on Apple Silicon. We want to use the
    // binaries native to the system for better performance.
    try {
      if (execSync('sysctl -n sysctl.proc_translated 2>/dev/null')[0] === 1) {
        return Architecture.Arm64;
      }
    } catch {} // if `sysctl` check fails, assume native `amd64`
  }

  return Architecture.Amd64; // Default for all other architectures
}

export function printBanner() {
  console.log(`
.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx

 ╔═╗ ╔═╗ ╦ ╦ ╔╗╔ ╔╦╗ ╦═╗ ╦ ╦         Portable and modular toolkit
 ╠╣  ║ ║ ║ ║ ║║║  ║║ ╠╦╝ ╚╦╝    for Ethereum Application Development
 ╚   ╚═╝ ╚═╝ ╝╚╝ ═╩╝ ╩╚═  ╩                 written in Rust.

.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx

Repo       : https://github.com/foundry-rs/
Book       : https://book.getfoundry.sh/
Chat       : https://t.me/foundry_rs/
Support    : https://t.me/foundry_support/
Contribute : https://github.com/orgs/foundry-rs/projects/2/

.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx.xOx
`);
}

/**
 * Log a message to the console.
 *
 * @param message The message to log
 */
export function say(message: string) {
  console.log(`[foundryup] ${message}`);
}

/**
 * Extracts the binaries from the given URL and writes them to the destination.
 *
 * @param url The URL of the archive to extract the binaries from
 * @param binaries The list of binaries to extract
 * @param dir The destination directory
 * @returns The list of binaries extracted
 */
export async function extractFrom(
  url: URL,
  binaries: string[],
  dir: string,
  checksums: { algorithm: string; binaries: Record<Binary, string> } | null,
) {
  const extract = url.pathname.toLowerCase().endsWith(Extension.Tar)
    ? extractFromTar
    : extractFromZip;
  // write all files to a temporary directory first, then rename to the final
  // destination to avoid accidental partial extraction. We don't use
  // `os.tmpdir` for this because `rename` will fail if the directories are on
  // different file systems.
  const tempDir = dir + '.downloading';
  const rmOpts = { recursive: true, maxRetries: 3, force: true };
  try {
    // clean up any previous in-progress downloads
    await rm(tempDir, rmOpts);
    // make the temporary directory to extract the binaries to
    await mkdir(tempDir, { recursive: true });
    const downloads = await extract(
      url,
      binaries,
      tempDir,
      checksums?.algorithm,
    );
    ok(downloads.length === binaries.length, 'Failed to extract all binaries');

    const paths: string[] = [];
    for (const { path, binary, checksum } of downloads) {
      if (checksums) {
        // check the target's checksum matches the expected checksum
        say(`verifying checksum for ${binary}`);
        const expected = checksums.binaries[binary as Binary];
        if (checksum !== expected) {
          throw new Error(
            `checksum mismatch for ${binary}, expected ${expected}, got ${checksum}`,
          );
        } else {
          say(`checksum verified for ${binary}`);
        }
      }
      // add the *final* path to the list of binaries
      paths.push(join(dir, relative(tempDir, path)));
    }

    // everything has been extracted; move the files to their final destination
    await rename(tempDir, dir);
    // return the list of extracted binaries
    return paths;
  } catch (e) {
    // if things fail for any reason try to clean up a bit. it is very important
    // to not leave `dir` behind, as its existence is a signal that the binaries
    // are installed.
    await Promise.all([rm(tempDir, rmOpts), rm(dir, rmOpts)]).catch(noop);
    throw e;
  }
}

/**
 * Extracts the binaries from a tar archive.
 *
 * @param url The URL of the archive to extract the binaries from
 * @param binaries The list of binaries to extract
 * @param dir The destination directory
 * @param checksumAlgorithm The checksum algorithm to use
 * @returns The list of binaries extracted
 */
async function extractFromTar(
  url: URL,
  binaries: string[],
  dir: string,
  checksumAlgorithm?: string,
) {
  const downloads: {
    path: string;
    binary: string;
    checksum?: string;
  }[] = [];
  await pipeline(
    startDownload(url),
    extractTar(
      {
        cwd: dir,
        transform: (entry) => {
          if (checksumAlgorithm) {
            const hash = createHash(checksumAlgorithm);
            const passThrough = new Minipass({ async: true });
            passThrough.pipe(hash);
            passThrough.on('end', () => {
              downloads.push({
                path: entry.absolute!,
                binary: entry.path,
                checksum: hash.digest('hex'),
              });
            });
            return passThrough;
          } else {
            downloads.push({
              path: entry.absolute!,
              binary: entry.path,
            });
          }
        },
      },
      binaries,
    ),
  );
  return downloads;
}

/**
 * Extracts the binaries from a zip archive.
 *
 * @param url The URL of the archive to extract the binaries from
 * @param binaries The list of binaries to extract
 * @param dir  The destination directory
 * @param checksumAlgorithm The checksum algorithm to use
 * @returns The list of binaries extracted
 */
async function extractFromZip(
  url: URL,
  binaries: string[],
  dir: string,
  checksumAlgorithm?: string,
) {
  const agent = new (url.protocol === 'http:' ? HttpAgent : HttpsAgent)({
    keepAlive: true,
  });
  const source: Source = {
    async size() {
      const download = startDownload(url, { agent, method: 'HEAD' });
      const response = await download.response();
      const contentLength = response.headers['content-length'];
      return contentLength ? parseInt(contentLength, 10) : 0;
    },
    stream(offset: number, bytes: number) {
      const options = {
        agent,
        headers: {
          range: `bytes=${offset}-${bytes ? offset + bytes : ''}`,
        },
      };
      return startDownload(url, options);
    },
  };

  const { files } = await Unzip.custom(source);
  const filtered = files.filter(({ path }) =>
    binaries.includes(basename(path, extname(path))),
  );
  return await Promise.all(
    filtered.map(async ({ path, stream }) => {
      const dest = join(dir, path);
      const entry = stream();
      const destStream = createWriteStream(dest);
      if (checksumAlgorithm) {
        const hash = createHash(checksumAlgorithm);
        const hashStream = async function* (source: Entry) {
          for await (const chunk of source) {
            hash.update(chunk);
            yield chunk;
          }
        };
        await pipeline(entry, hashStream, destStream);
        return {
          path: dest,
          binary: basename(path, extname(path)),
          checksum: hash.digest('hex'),
        };
      } else {
        await pipeline(entry, destStream);
        return {
          path: dest,
          binary: basename(path, extname(path)),
        };
      }
    }),
  );
}

/**
 * Starts a download from the given URL.
 *
 * @param url The URL to download from
 * @param options The download options
 * @param redirects The number of redirects that have occurred
 * @returns A stream of the download
 */
function startDownload(
  url: URL,
  options: DownloadOptions = {},
  redirects: number = 0,
) {
  const MAX_REDIRECTS = options.maxRedirects ?? 5;
  const request = url.protocol === 'http:' ? httpRequest : httpsRequest;
  const stream = new DownloadStream();
  request(url, options, async (response) => {
    stream.once('close', () => {
      response.destroy();
    });

    const { statusCode, statusMessage, headers } = response;
    // handle redirects
    if (
      statusCode &&
      statusCode >= 300 &&
      statusCode < 400 &&
      headers.location
    ) {
      if (redirects >= MAX_REDIRECTS) {
        stream.emit('error', new Error('Too many redirects'));
        response.destroy();
      } else {
        // note: we don't emit a response until we're done redirecting, because
        // handlers only expect it to be emitted once.
        await pipeline(
          startDownload(new URL(headers.location, url), options, redirects + 1)
            // emit the response event to the stream
            .once('response', stream.emit.bind(stream, 'response')),
          stream,
        ).catch(stream.emit.bind(stream, 'error'));
        response.destroy();
      }
    }
    // check for HTTP errors
    else if (!statusCode || statusCode < 200 || statusCode >= 300) {
      stream.emit(
        'error',
        new Error(
          `Request to ${url} failed. Status Code: ${statusCode} - ${statusMessage}`,
        ),
      );
      response.destroy();
    } else {
      // resolve with response stream
      stream.emit('response', response);

      response.once('error', stream.emit.bind(stream, 'error'));
      await pipeline(response, stream).catch(stream.emit.bind(stream, 'error'));
    }
  })
    .once('error', stream.emit.bind(stream, 'error'))
    .end();
  return stream;
}

export class DownloadStream extends Stream.PassThrough {
  async response(): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
      this.once('response', resolve);
      this.once('error', reject);
    });
  }
}

/**
 * Get the version of the binary at the given path.
 *
 * @param binPath
 * @returns The `--version` reported by the binary
 * @throws If the binary fails to report its version
 */
export function getVersion(binPath: string): Buffer {
  try {
    return execSync(`${binPath} --version`).subarray(0, -1); // ignore newline
  } catch (error: unknown) {
    const msg = `Failed to get version for ${binPath}

Your selected platform or architecture may be incorrect, or the binary may not
support your system. If you believe this is an error, please report it.`;
    if (error instanceof Error) {
      error.message = `${msg}\n\n${error.message}`;
      throw error;
    }
    throw new AggregateError([new Error(msg), error]);
  }
}

export function isCodedError(
  error: unknown,
): error is Error & { code: string } {
  return (
    error instanceof Error && 'code' in error && typeof error.code === 'string'
  );
}

/**
 * Transforms the CLI checksum object into a platform+arch-specific checksum
 * object.
 *
 * @param checksums The CLI checksum object
 * @param platform The build platform
 * @param arch The build architecture
 * @returns
 */
export function transformChecksums(
  checksums: Checksums | undefined,
  platform: Platform,
  arch: Architecture,
): PlatformArchChecksums | null {
  if (!checksums) return null;

  const key = `${platform}-${arch}` as const;
  return {
    algorithm: checksums.algorithm,
    binaries: Object.entries(checksums.binaries).reduce(
      (acc, [name, record]) => ((acc[name as Binary] = record[key]), acc),
      {} as Record<Binary, string>,
    ),
  };
}
