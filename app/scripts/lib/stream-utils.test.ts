import { isStreamWritable } from './stream-utils';
// Redundantly include used version twice for regression-detection purposes
import ReadableStream from 'readable-stream';
import ReadableStream2 from 'readable-stream-2';
import ReadableStream3 from 'readable-stream-3';

describe('Stream Utils', () => {
  describe('isStreamWritable', () => {
    ([
      ['readable-stream', ReadableStream] as [string, typeof ReadableStream],
      ['readable-stream v2', ReadableStream2] as [string, typeof ReadableStream2],
      ['readable-stream v3', ReadableStream3] as [string, typeof ReadableStream3],
    ]).forEach(([name, streamsImpl]) => {
      describe(`Using Streams implementation: ${name}`, () => {
        it('should something', () => {
          const stream = new streamsImpl.Duplex();
          const result = isStreamWritable(stream);
          expect(result).toBe(true);
        });
      });
    });
  });
});
