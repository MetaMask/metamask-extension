import { request as httpRequest, type IncomingMessage } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { Stream } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { DownloadOptions } from './types';

class DownloadStream extends Stream.PassThrough {
  async response(): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
      this.once('response', resolve);
      this.once('error', reject);
    });
  }
}

/**
 * Starts a download from the given URL.
 *
 * @param url - The URL to download from
 * @param options - The download options
 * @param redirects - The number of redirects that have occurred
 * @returns A stream of the download
 */

export function startDownload(
  url: URL,
  options: DownloadOptions = {},
  redirects: number = 0,
) {
  const MAX_REDIRECTS = options.maxRedirects ?? 5;
  const request = url.protocol === 'http:' ? httpRequest : httpsRequest;
  const stream = new DownloadStream();
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
