import { platform } from 'node:os';
import { argv, stdout } from 'node:process';
import yargs from 'yargs/yargs';
import { normalizeSystemArchitecture } from './utils';
import {
  type Checksums,
  type ParsedOptions,
  type ArchitecturesTuple,
  type BinariesTuple,
  type PlatformsTuple,
  Architecture,
  Binary,
  Platform,
} from './types';

function isVersionString(value: string): value is `v${string}` {
  return /^v\d/u.test(value);
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
    .command(['$0', 'install'], 'Install foundry binaries', (builder) => {
      builder.options(getOptions()).pkgConf('foundryup');
    })
    .command('cache', '', (builder) => {
      builder.command('clean', 'Remove the shared cache files').demandCommand();
    })
    .parseSync(args);

  const command = _.join(' ');
  if (command === 'cache clean') {
    return {
      command,
    } as const;
  }

  // if we get here `command` is always 'install' or '' (yargs checks it)
  return {
    command: 'install',
    options: parsed as ParsedOptions<ReturnType<typeof getOptions>>,
  } as const;
}

const Binaries = Object.values(Binary) as BinariesTuple;

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
      optional: true,
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
        } else if (isVersionString(rawVersion)) {
          return { version: rawVersion, tag: rawVersion };
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
