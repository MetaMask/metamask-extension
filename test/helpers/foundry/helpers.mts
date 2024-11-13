import { ok } from 'node:assert';
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
import {
  argv,
  arch as osArch,
  platform as osPlatform,
  stdout,
} from 'node:process';
import { Stream } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { extract as extractTar } from 'tar';
import { Source, Open as Unzip } from 'unzipper';
import yargs from 'yargs/yargs';

export function noop() {}

export enum BinFormat {
  Zip = 'zip',
  Tar = 'tar.gz',
}

export enum Platform {
  Windows = 'win32',
  Linux = 'linux',
  Mac = 'darwin',
}

export enum Binary {
  Anvil = 'anvil',
  Forge = 'forge',
  Cast = 'cast',
  Chisel = 'chisel',
}

type Options = ReturnType<typeof getOptions>;
type OptionsKeys = keyof Options;

export function parseArgs(args: string[] = argv.slice(2)) {
  const { $0, _, ...parsed } = yargs()
    // Ensure unrecognized commands/options are reported as errors.
    .strict()
    // disable yargs's version, as it doesn't make sense here
    .version(false)
    // use the scriptName in `--help` output
    .scriptName('yarn foundryup')
    // wrap output at a maximum of 120 characters or `process.stdout.columns`
    .wrap(Math.min(120, stdout.columns))
    // enable the `--config` command, which allows the user to specify a custom
    // config file containing webpack options
    .config()
    .parserConfiguration({
      'strip-aliased': true,
      'strip-dashed': true,
    })
    // enable ENV parsing, which allows the user to specify foundryup options
    // via environment variables prefixed with `FOUNDRYUP_`
    .env('FOUNDRYUP')
    .options(getOptions())
    .parseSync(args);
  return parsed as { [key in OptionsKeys]: (typeof parsed)[key] };
}

function getOptions() {
  return {
    binaries: {
      alias: 'b',
      type: 'array' as const,
      multiple: true,
      description: 'Specify the binaries to install',
      default: [Binary.Anvil],
      choices: Object.values(Binary) as Binary[],
    },
    repo: {
      alias: 'r',
      description: 'Specify the repository',
      default: 'foundry-rs/foundry',
    },
    version: {
      alias: 'v',
      description: 'Specify the version',
      default: 'nightly',
      coerce: (
        rawVersion: string,
      ): { version: 'nightly' | `v${string}`; tag: string } => {
        if (/^nightly/u.test(rawVersion)) {
          return { version: 'nightly', tag: rawVersion };
          // we don't validate the version here, we just trust the user
        } else if (/^\d/u.test(rawVersion)) {
          return { version: `v${rawVersion}`, tag: rawVersion };
        }
        throw new Error('Invalid version');
      },
    },
    arch: {
      alias: 'a',
      description: 'Specify the architecture',
      // foundry only handles `amd64` and `arm64` architectures
      default:
        osArch === 'arm' || osArch === 'arm64'
          ? ('arm64' as const)
          : ('amd64' as const),
      choices: ['amd64', 'arm64'] as const,
    },
    platform: {
      alias: 'p',
      description: 'Specify the platform',
      // if `osPlatform` is not a supported Platform yargs will throw an error
      default: osPlatform as Platform,
      choices: Object.values(Platform) as Platform[],
    },
  };
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
export async function extractFrom(url: URL, binaries: string[], dir: string) {
  const extract = url.pathname.toLowerCase().endsWith(BinFormat.Tar)
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
    const downloads = await extract(url, binaries, tempDir);
    ok(downloads.length === binaries.length, 'Failed to extract all binaries');

    // everything has been extracted; move the files to their final destination
    await rename(tempDir, dir);
    // return the list of extracted binaries
    return downloads.map((file) => join(dir, relative(tempDir, file)));
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
 * @returns The list of binaries extracted
 */
async function extractFromTar(url: URL, binaries: string[], dir: string) {
  const downloads: string[] = [];
  await pipeline(
    startDownload(url),
    extractTar({ cwd: dir }, binaries).on('entry', ({ absolute }) =>
      downloads.push(absolute),
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
 * @returns The list of binaries extracted
 */
async function extractFromZip(url: URL, binaries: string[], dir: string) {
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
    filtered.map(async ({ stream, path }) => {
      const dest = join(dir, path);
      await pipeline(stream(), createWriteStream(dest));
      return dest;
    }),
  );
}

type DownloadOptions = {
  method?: 'GET' | 'HEAD';
  headers?: Record<string, string>;
  agent?: HttpsAgent | HttpAgent;
  maxRedirects?: number;
};

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
): DownloadStream {
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
            // remit the response event to the stream
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
    const msg = `Failed to get version for ${binPath}`;
    if (error instanceof Error) {
      throw new Error(`${msg}: ${error.message}`);
    }
    throw new Error(msg);
  }
}

export function isCodedError(
  error: unknown,
): error is Error & { code: string } {
  return (
    error instanceof Error && 'code' in error && typeof error.code === 'string'
  );
}
