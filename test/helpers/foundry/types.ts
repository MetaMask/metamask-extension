import type { Agent as HttpsAgent } from 'node:https';
import type { Agent as HttpAgent } from 'node:http';
import type { InferredOptionTypes, Options } from 'yargs';

// #region utils

type UnionToIntersection<U> = ((k: U) => void) extends (k: infer I) => void
  ? I
  : never;

type LastInUnion<U extends PropertyKey> = UnionToIntersection<
  U extends string | number | symbol ? () => U : never
> extends () => infer Last
  ? Last
  : never;

type UnionToTuple<U extends PropertyKey, Last = LastInUnion<U>> = [U] extends [
  never,
]
  ? []
  : [...UnionToTuple<Exclude<U, Last>>, Last];

// #endregion utils

// #region enums

export enum Architecture {
  Amd64 = 'amd64',
  Arm64 = 'arm64',
}

export enum Extension {
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

// #endregion enums

// #region helpers

/**
 * Tuple representing all members of the {@link Binary} enum.
 */
export type BinariesTuple = UnionToTuple<Binary>;

/**
 * Tuple representing all members of the {@link Architecture} enum.
 */
export type ArchitecturesTuple = UnionToTuple<Architecture>;

/**
 * Tuple representing all members of the {@link Platform} enum.
 */
export type PlatformsTuple = UnionToTuple<Platform>;

/**
 * Checksum types expected by the CLI.
 */
export type Checksums = {
  algorithm: string;
  binaries: Record<Binary, Record<`${Platform}-${Architecture}`, string>>;
};

/**
 * Checksum type expected by application code, specific to the selected
 * {@link Platform} and {@link Architecture}. See also: {@link Checksums}.
 */
export type PlatformArchChecksums = {
  algorithm: string;
  binaries: Record<Binary, string>;
};

/**
 * Given a map of raw yargs options config, returns a map of inferred types.
 */
export type ParsedOptions<O extends { [key: string]: Options }> = {
  [key in keyof O]: InferredOptionTypes<O>[key];
};

export type DownloadOptions = {
  method?: 'GET' | 'HEAD';
  headers?: Record<string, string>;
  agent?: HttpsAgent | HttpAgent;
  maxRedirects?: number;
};

// #endregion helpers
