import { isStreamWritable } from './stream-utils';
import ReadableStream2 from 'readable-stream';

describe('Stream Utils', () => {
  describe('isStreamWritable', () => {
    ([
      ['readable-stream v2', ReadableStream2] as [string, typeof ReadableStream2],
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
