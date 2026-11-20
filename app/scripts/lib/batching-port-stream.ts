import { Duplex } from 'readable-stream';
import {
  packPortMessages,
  unpackPortMessage,
} from '../../../shared/lib/port-message-batch';

type WriteChunk = { chunk: unknown; encoding?: string };

/**
 * One `postMessage` per task's writes. Sits above `ExtensionPortStream` so chunking covers a batch.
 */
export class BatchingPortStream extends Duplex {
  readonly #inner: Duplex;

  #flushScheduled = false;

  /**
   * @param inner - The stream to send batches through, normally an `ExtensionPortStream`.
   */
  constructor(inner: Duplex) {
    super({ objectMode: true, highWaterMark: 256 });
    this.#inner = inner;

    inner.on('data', (message: unknown) => {
      for (const unpacked of unpackPortMessage(message)) {
        if (!this.push(unpacked)) {
          inner.pause();
        }
      }
    });
    inner.on('end', () => this.push(null));
    inner.on('error', (error: Error) => this.destroy(error));
    inner.on('close', () => {
      if (!this.destroyed) {
        this.destroy();
      }
    });
  }

  /**
   * @param chunk - The message to write; corked until the end of the task.
   * @param args - The encoding and/or callback, as for `Duplex.write`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  write(chunk: any, ...args: any[]): boolean {
    if (!this.#flushScheduled) {
      this.#flushScheduled = true;
      this.cork();
      queueMicrotask(() => {
        this.#flushScheduled = false;
        if (this.writableCorked > 0) {
          this.uncork();
        }
      });
    }
    return super.write(chunk, ...args);
  }

  _write(
    chunk: unknown,
    encoding: string | undefined,
    callback: (error?: Error | null) => void,
  ): void {
    this._writev([{ chunk, encoding }], callback);
  }

  _writev(
    chunks: WriteChunk[],
    callback: (error?: Error | null) => void,
  ): void {
    this.#inner.write(
      packPortMessages(chunks.map(({ chunk }) => chunk)),
      (error?: Error | null) => callback(error),
    );
  }

  _read(): void {
    this.#inner.resume();
  }

  _final(callback: (error?: Error | null) => void): void {
    this.#inner.end();
    callback();
  }

  _destroy(error: Error | null, callback: (error: Error | null) => void): void {
    if (!this.#inner.destroyed) {
      this.#inner.destroy(error ?? undefined);
    }
    callback(error);
  }
}
