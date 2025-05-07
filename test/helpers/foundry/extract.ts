import { ok } from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { rename, mkdir, rm } from 'node:fs/promises';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { join, basename, extname, relative } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Minipass } from 'minipass';
import { extract as extractTar } from 'tar';
import { Open, type Source, type Entry } from 'unzipper';
import { say } from './utils';
import { startDownload } from './download';
import { Extension, Binary } from './types';

/**
 * Extracts the binaries from the given URL and writes them to the destination.
 *
 * @param url - The URL of the archive to extract the binaries from
 * @param binaries - The list of binaries to extract
 * @param dir - The destination directory
 * @param checksums - The checksums to verify the binaries against
 * @returns The list of binaries extracted
 */

export async function extractFrom(
  url: URL,
  binaries: Binary[],
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
  const tempDir = `${dir}.downloading`;
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
        say(`verifying checksum for ${binary}`);
        const expected = checksums.binaries[binary];
        if (checksum === expected) {
          say(`checksum verified for ${binary}`);
        } else {
          throw new Error(
            `checksum mismatch for ${binary}, expected ${expected}, got ${checksum}`,
          );
        }
      }
      // add the *final* path to the list of binaries
      paths.push(join(dir, relative(tempDir, path)));
    }

    // this directory shouldn't exist, but if two simultaneous `yarn foundryup`
    // processes are running, it might. Last process wins, so we remove other
    // `dir`s just in case.
    await rm(dir, rmOpts);
    // everything has been extracted; move the files to their final destination
    await rename(tempDir, dir);
    // return the list of extracted binaries
    return paths;
  } catch (error) {
    // if things fail for any reason try to clean up a bit. it is very important
    // to not leave `dir` behind, as its existence is a signal that the binaries
    // are installed.
    const rmErrors = (
      await Promise.allSettled([rm(tempDir, rmOpts), rm(dir, rmOpts)])
    )
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason);

    // if we failed to clean up, create an aggregate error message
    if (rmErrors.length) {
      throw new AggregateError(
        [error, ...rmErrors],
        'This is a bug; you should report it.',
      );
    }
    throw error;
  }
}
/**
 * Extracts the binaries from a tar archive.
 *
 * @param url - The URL of the archive to extract the binaries from
 * @param binaries - The list of binaries to extract
 * @param dir - The destination directory
 * @param checksumAlgorithm - The checksum algorithm to use
 * @returns The list of binaries extracted
 */

async function extractFromTar(
  url: URL,
  binaries: Binary[],
  dir: string,
  checksumAlgorithm?: string,
) {
  const downloads: {
    path: string;
    binary: Binary;
    checksum?: string;
  }[] = [];
  await pipeline(
    startDownload(url),
    extractTar(
      {
        cwd: dir,
        transform: (entry) => {
          const absolutePath = entry.absolute;
          if (!absolutePath) {
            throw new Error('Missing absolute path for entry');
          }

          if (checksumAlgorithm) {
            const hash = createHash(checksumAlgorithm);
            const passThrough = new Minipass({ async: true });
            passThrough.pipe(hash);
            passThrough.on('end', () => {
              downloads.push({
                path: absolutePath,
                binary: entry.path as Binary,
                checksum: hash.digest('hex'),
              });
            });
            return passThrough;
          }

          // When no checksum is needed, record the entry and return undefined
          // to use the original stream without transformation
          downloads.push({
            path: absolutePath,
            binary: entry.path as Binary,
          });
          return undefined;
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
 * @param url - The URL of the archive to extract the binaries from
 * @param binaries - The list of binaries to extract
 * @param dir - The destination directory
 * @param checksumAlgorithm - The checksum algorithm to use
 * @returns The list of binaries extracted
 */

async function extractFromZip(
  url: URL,
  binaries: Binary[],
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

  const { files } = await Open.custom(source, {});
  const filtered = files.filter(({ path }) =>
    binaries.includes(basename(path, extname(path)) as Binary),
  );
  return await Promise.all(
    filtered.map(async ({ path, stream }) => {
      const dest = join(dir, path);
      const entry = stream();
      const destStream = createWriteStream(dest);
      const binary = basename(path, extname(path)) as Binary;
      if (checksumAlgorithm) {
        const hash = createHash(checksumAlgorithm);
        const hashStream = async function* (entryStream: Entry) {
          for await (const chunk of entryStream) {
            hash.update(chunk);
            yield chunk;
          }
        };
        await pipeline(entry, hashStream, destStream);
        return {
          path: dest,
          binary,
          checksum: hash.digest('hex'),
        };
      }
      await pipeline(entry, destStream);
      return {
        path: dest,
        binary,
      };
    }),
  );
}
