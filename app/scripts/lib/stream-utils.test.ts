import OurReadableStream from 'readable-stream';
import ReadableStream2 from 'readable-stream-2';
import ReadableStream3 from 'readable-stream-3';
import { isStreamWritable } from './stream-utils';

describe('Stream Utils', () => {
  describe('isStreamWritable', () => {
    [
      // Redundantly include used version twice for regression-detection purposes
      ['readable-stream', OurReadableStream] as [
        string,
        typeof OurReadableStream,
      ],
      ['readable-stream v2', ReadableStream2] as [
        string,
        typeof ReadableStream2,
      ],
      ['readable-stream v3', ReadableStream3] as [
        string,
        typeof ReadableStream3,
      ],
    ].forEach(([name, streamsImpl]) => {
      describe(`Using Streams implementation: ${name}`, () => {
        [
          ['Duplex', streamsImpl.Duplex] as [string, typeof streamsImpl.Duplex],
          ['Transform', streamsImpl.Transform] as [
            string,
            typeof streamsImpl.Transform,
          ],
          ['Writable', streamsImpl.Writable] as [
            string,
            typeof streamsImpl.Writable,
          ],
        ].forEach(([className, S]) => {
          it(`should return true for fresh ${className}`, () => {
            const stream = new S();
            const result = isStreamWritable(stream);
            expect(result).toBe(true);
          });
        });
        [
          ['Readable', streamsImpl.Readable] as [
            string,
            typeof streamsImpl.Readable,
          ],
        ].forEach(([className, S]) => {
          it(`should return false for fresh ${className}`, () => {
            const stream = new S();
            const result = isStreamWritable(stream);
            expect(result).toBe(false);
          });
        });
      });
    });
  });
});
