#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { Agent as HttpAgent, type IncomingMessage } from 'node:http';
import {
  Agent as HttpsAgent,
  request as httpRequest,
  request as httpsRequest,
} from 'node:https';
import { join } from 'node:path';
import { argv, arch as osArch, platform as osPlatform } from 'node:process';
import { Stream } from 'node:stream';
import { extract as extractTar } from 'tar';
import { Source, Open as Unzip } from 'unzipper';
import yargs from 'yargs/yargs';
import { toOrange } from './development/webpack/utils/helpers';

type BinFormat = 'zip' | 'tar.gz';

const BASE_DIR = join(__dirname, 'node_modules', '.bin');
const FOUNDRY_BIN_DIR = BASE_DIR || join(BASE_DIR, '.foundry', 'bin');

const BINS = ['anvil', 'forge', 'cast', 'chisel'] as const;
const {
  repo,
  version: { version, tag },
  arch,
  platform,
  binaries,
} = yargs()
  // Ensure unrecognized commands/options are reported as errors.
  .strict()
  // disable yargs's version, as it doesn't make sense here
  .version(false)
  // use the scriptName in `--help` output
  .scriptName('yarn foundryup')
  // wrap output at a maximum of 120 characters or `process.stdout.columns`
  .wrap(Math.min(120, process.stdout.columns))
  // enable the `--config` command, which allows the user to specify a custom
  // config file containing webpack options
  .config()
  .parserConfiguration({
    'strip-aliased': true,
    'strip-dashed': true,
  })
  // enable ENV parsing, which allows the user to specify fondryup options via
  // environment variables prefixed with `FOUNDRYUP_`
  .env('FOUNDRYUP')
  .updateStrings({
    'Options:': toOrange('Options:'),
    'Examples:': toOrange('Examples:'),
  })
  .option('binaries', {
    alias: 'b',
    type: 'string',
    array: true,
    multiple: true,
    description: 'Specify the binaries to install',
    default: ['anvil'] as (typeof BINS)[number][],
    choices: BINS,
  })
  .option('repo', {
    alias: 'r',
    type: 'string',
    description: 'Specify the repository',
    default: 'foundry-rs/foundry',
  })
  .option('version', {
    alias: 'v',
    type: 'string',
    description: 'Specify the version',
    default: 'nightly',
    coerce: (rawVersion) => {
      if (/^nightly/u.test(rawVersion)) {
        return { version: 'nightly', tag: rawVersion };
      } else if (/^\d/u.test(rawVersion)) {
        return { version: `v${rawVersion}`, tag: rawVersion };
      }
      return { version: rawVersion, tag: rawVersion };
    },
  })
  .option('arch', {
    description: 'Specify the architecture',
    default: osArch === 'arm' ? 'arm64' : 'amd64',
    choices: ['amd64', 'arm64'] as const,
    coerce: (rawArch: NodeJS.Architecture) => {
      return rawArch === 'arm' ? 'arm64' : 'amd64';
    },
  })
  .option('platform', {
    type: 'string',
    description: 'Specify the platform',
    default: osPlatform,
    choices: ['win32', 'linux', 'darwin'] as const,
  })
  .parseSync(argv.slice(2));

// Print the banner
banner();

(async function main() {
  say(`installing foundry (version ${version}, tag ${tag})`);

  const ext: BinFormat = platform === 'win32' ? 'zip' : 'tar.gz';
  const RELEASE_URL = `https://github.com/${repo}/releases/download/${tag}/`;
  const BIN_ARCHIVE_URL = `${RELEASE_URL}foundry_${version}_${platform}_${arch}.${ext}`;

  say(`downloading ${binaries.join(', ')}`);
  await downloadAndExtract(ext, new URL(BIN_ARCHIVE_URL), FOUNDRY_BIN_DIR);

  for (const bin of binaries) {
    const binPath = join(FOUNDRY_BIN_DIR, bin);
    say(`installed - ${getVersion(binPath)}`);
  }

  say('done!');
})();

// Helper Functions
function say(message: string) {
  console.log(`foundryup: ${message}`);
}

function banner() {
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

async function _download(
  url: URL,
  options: {
    method?: 'GET' | 'HEAD';
    headers?: Record<string, string>;
    agent?: HttpAgent;
  } = {},
  redirects: number = 0,
): Promise<IncomingMessage> {
  const MAX_REDIRECTS = 5;
  const request = url.protocol === 'https:' ? httpsRequest : httpRequest;
  return new Promise((resolve, reject) => {
    request(url, options, (res) => {
      const { statusCode, statusMessage, headers } = res;
      // Handle redirects
      if (
        statusCode &&
        statusCode >= 300 &&
        statusCode < 400 &&
        headers.location
      ) {
        if (redirects >= MAX_REDIRECTS) {
          reject(new Error('Too many redirects'));
          res.resume(); // Consume response data to free up memory
          return;
        }
        // Resolve relative redirects
        const redirectUrl = new URL(headers.location, url);
        res.resume(); // Consume response data to free up memory

        // Follow the redirect
        _download(redirectUrl, options, redirects + 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      // Check for HTTP errors
      if (!statusCode || statusCode < 200 || statusCode >= 300) {
        reject(
          new Error(
            `Request Failed. Status Code: ${statusCode} - ${statusMessage}`,
          ),
        );
        res.resume(); // Consume response data to free up memory
        return;
      }

      // Resolve with response stream
      resolve(res);
    })
      .on('error', (e: Error) => {
        reject(e);
      })
      .end();
  });
}

async function download(
  url: URL,
  options?: {
    method?: 'GET' | 'HEAD';
    headers?: Record<string, string>;
    agent?: HttpAgent;
  },
): Promise<IncomingMessage> {
  return _download(url, options);
}

async function downloadAndExtract(format: BinFormat, url: URL, cwd: string) {
  await mkdir(cwd, { recursive: true });

  // eslint-disable-next-line no-async-promise-executor
  return await new Promise(async (resolve, reject) => {
    if (format === 'zip') {
      const agent = new (url.protocol === 'http' ? HttpAgent : HttpsAgent)({
        keepAlive: true,
      });
      const source: Source = {
        stream(offset: number, length: number) {
          const passThrough = new Stream.PassThrough();
          const options = {
            agent,
            headers: {
              range: `bytes=${offset}-${length ? offset + length : ''}`,
            },
          };
          download(url, options).then(
            (response) => response.pipe(passThrough),
            (error: Error) => passThrough.emit('error', error),
          );
          return passThrough;
        },
        async size() {
          const response = await download(url, { agent, method: 'HEAD' });
          response.resume(); // Consume response data to free up memory
          const contentLength = response.headers['content-length'];
          return contentLength ? parseInt(contentLength, 10) : 0;
        },
      };
      const { files } = await Unzip.custom(source);
      for await (const file of files) {
        if (file.type !== 'File') {
          continue;
        }
        // remove `.exe` from the path to get the binary name
        const path = file.path.slice(0, -4) as (typeof BINS)[number];
        // ignore files that are not in the list of binaries
        if (!binaries.includes(path)) {
          continue;
        }
        // write the binary to the destination
        const dest = join(cwd, file.path);
        const stream = file.stream().pipe(createWriteStream(dest));
        stream.on('finish', resolve).on('error', reject);
      }
    } else {
      // write the binaries to the destination
      const stream = (await download(url)).pipe(extractTar({ cwd }, binaries));
      stream.on('finish', resolve).on('error', reject);
    }
  });
}

function getVersion(binPath: string): string {
  try {
    const result = execSync(`${binPath} --version`, {
      encoding: 'utf8',
    }).trim();
    return result;
  } catch {
    return 'unknown version';
  }
}
