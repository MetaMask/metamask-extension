import NodeStream from 'node:stream';
import OurReadableStream from 'readable-stream';
import ReadableStream2 from 'readable-stream-2';
import ReadableStream3 from 'readable-stream-3';

import type { JsonRpcNotification, JsonRpcRequest } from '@metamask/utils';
import createDupeReqFilterStream, {
  THREE_MINUTES,
} from './createDupeReqFilterStream';

const { Transform } = OurReadableStream;

function createTestStream(output: JsonRpcRequest[] = [], S = Transform) {
  const transformStream = createDupeReqFilterStream();
  const testOutStream = new S({
    transform: (chunk: JsonRpcRequest, _, cb) => {
      output.push(chunk);
      cb();
    },
    objectMode: true,
  });

  transformStream.pipe(testOutStream);

  return transformStream;
}

function runStreamTest(
  requests: (JsonRpcRequest | JsonRpcNotification)[] = [],
  advanceTimersTime = 10,
  S = Transform,
) {
  return new Promise((resolve, reject) => {
    const output: JsonRpcRequest[] = [];
    const testStream = createTestStream(output, S);

    testStream
      .on('finish', () => resolve(output))
      .on('error', (err) => reject(err));

    requests.forEach((request) => testStream.write(request));
    testStream.end();

    jest.advanceTimersByTime(advanceTimersTime);
  });
}

describe('createDupeReqFilterStream', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: 10 });
  });

  it('lets through requests with ids being seen for the first time', async () => {
    const requests = [
      { id: 1, method: 'foo' },
      { id: 2, method: 'bar' },
    ].map((request) => ({ ...request, jsonrpc: '2.0' as const }));

    const expectedOutput = [
      { id: 1, method: 'foo' },
      { id: 2, method: 'bar' },
    ].map((output) => ({ ...output, jsonrpc: '2.0' }));

    const output = await runStreamTest(requests);
    expect(output).toEqual(expectedOutput);
  });

  it('does not let through the request if the id has been seen before', async () => {
    const requests = [
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' }, // duplicate
    ].map((request) => ({ ...request, jsonrpc: '2.0' as const }));

    const expectedOutput = [{ id: 1, method: 'foo' }].map((output) => ({
      ...output,
      jsonrpc: '2.0',
    }));

    const output = await runStreamTest(requests);
    expect(output).toEqual(expectedOutput);
  });

  it("lets through requests if they don't have an id", async () => {
    const requests = [{ method: 'notify1' }, { method: 'notify2' }].map(
      (request) => ({ ...request, jsonrpc: '2.0' as const }),
    );

    const expectedOutput = [{ method: 'notify1' }, { method: 'notify2' }].map(
      (output) => ({ ...output, jsonrpc: '2.0' }),
    );

    const output = await runStreamTest(requests);
    expect(output).toEqual(expectedOutput);
  });

  it('handles a mix of request types', async () => {
    const requests = [
      { id: 1, method: 'foo' },
      { method: 'notify1' },
      { id: 1, method: 'foo' },
      { id: 2, method: 'bar' },
      { method: 'notify2' },
      { id: 2, method: 'bar' },
      { id: 3, method: 'baz' },
    ].map((request) => ({ ...request, jsonrpc: '2.0' as const }));

    const expectedOutput = [
      { id: 1, method: 'foo' },
      { method: 'notify1' },
      { id: 2, method: 'bar' },
      { method: 'notify2' },
      { id: 3, method: 'baz' },
    ].map((output) => ({ ...output, jsonrpc: '2.0' }));

    const output = await runStreamTest(requests);
    expect(output).toEqual(expectedOutput);
  });

  it('expires single id after three minutes', () => {
    const output: JsonRpcRequest[] = [];
    const testStream = createTestStream(output);

    const requests1 = [
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
    ];
    const expectedOutputBeforeExpiryTime = [{ id: 1, method: 'foo' }];

    requests1.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputBeforeExpiryTime);

    const requests2 = [
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
    ];
    const expectedOutputAfterExpiryTime = [
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
    ];

    jest.advanceTimersByTime(THREE_MINUTES);

    requests2.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputAfterExpiryTime);
  });

  it('does not expire single id after less than three', () => {
    const output: JsonRpcRequest[] = [];
    const testStream = createTestStream(output);

    const requests1 = [
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
    ];
    const expectedOutputBeforeTimeElapses = [{ id: 1, method: 'foo' }];

    requests1.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputBeforeTimeElapses);

    const requests2 = [
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
    ];
    const expectedOutputAfterTimeElapses = expectedOutputBeforeTimeElapses;

    jest.advanceTimersByTime(THREE_MINUTES - 1);

    requests2.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputAfterTimeElapses);
  });

  it('expires multiple ids after three minutes', () => {
    const output: JsonRpcRequest[] = [];
    const testStream = createTestStream(output);

    const requests1 = [
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
      { id: 2, method: 'bar' },
      { id: 2, method: 'bar' },
      { id: 3, method: 'baz' },
      { id: 3, method: 'baz' },
    ];
    const expectedOutputBeforeExpiryTime = [
      { id: 1, method: 'foo' },
      { id: 2, method: 'bar' },
      { id: 3, method: 'baz' },
    ];

    requests1.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputBeforeExpiryTime);

    const requests2 = [
      { id: 3, method: 'baz' },
      { id: 3, method: 'baz' },
      { id: 2, method: 'bar' },
      { id: 2, method: 'bar' },
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
    ];
    const expectedOutputAfterExpiryTime = [
      { id: 1, method: 'foo' },
      { id: 2, method: 'bar' },
      { id: 3, method: 'baz' },
      { id: 3, method: 'baz' },
      { id: 2, method: 'bar' },
      { id: 1, method: 'foo' },
    ];

    jest.advanceTimersByTime(THREE_MINUTES);

    requests2.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputAfterExpiryTime);
  });

  it('expires single id in three minute intervals', () => {
    const output: JsonRpcRequest[] = [];
    const testStream = createTestStream(output);

    const requests1 = [
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
    ];
    const expectedOutputBeforeExpiryTime = [{ id: 1, method: 'foo' }];

    requests1.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputBeforeExpiryTime);

    const requests2 = [
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
    ];
    const expectedOutputAfterFirstExpiryTime = [
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
    ];

    jest.advanceTimersByTime(THREE_MINUTES);

    requests2.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputAfterFirstExpiryTime);

    const requests3 = [
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
    ];
    const expectedOutputAfterSecondExpiryTime = [
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' },
    ];

    jest.advanceTimersByTime(THREE_MINUTES);

    requests3.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputAfterSecondExpiryTime);
  });

  it('expires somes ids at intervals while not expiring others', () => {
    const output: JsonRpcRequest[] = [];
    const testStream = createTestStream(output);

    const requests1 = [
      { id: 1, method: 'foo' },
      { id: 2, method: 'bar' },
    ];
    const expectedOutputBeforeExpiryTime = [
      { id: 1, method: 'foo' },
      { id: 2, method: 'bar' },
    ];

    requests1.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputBeforeExpiryTime);

    const requests2 = [{ id: 3, method: 'baz' }];
    const expectedOutputAfterFirstExpiryTime = [
      { id: 1, method: 'foo' },
      { id: 2, method: 'bar' },
      { id: 3, method: 'baz' },
    ];

    jest.advanceTimersByTime(THREE_MINUTES - 1);

    requests2.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputAfterFirstExpiryTime);

    const requests3 = [
      { id: 1, method: 'foo' },
      { id: 2, method: 'bar' },
      { id: 3, method: 'baz' },
      { id: 4, method: 'buzz' },
    ];
    const expectedOutputAfterSecondExpiryTime = [
      { id: 1, method: 'foo' },
      { id: 2, method: 'bar' },
      { id: 3, method: 'baz' },
      { id: 1, method: 'foo' },
      { id: 2, method: 'bar' },
      { id: 4, method: 'buzz' },
    ];

    jest.advanceTimersByTime(THREE_MINUTES - 1);

    requests3.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputAfterSecondExpiryTime);
  });

  it('handles running expiry job without seeing any ids', () => {
    const output: JsonRpcRequest[] = [];
    const testStream = createTestStream(output);

    const requests1 = [{ id: 1, method: 'foo' }];
    const expectedOutputBeforeExpiryTime = [{ id: 1, method: 'foo' }];

    requests1.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputBeforeExpiryTime);

    jest.advanceTimersByTime(THREE_MINUTES + 1);

    expect(output).toEqual(expectedOutputBeforeExpiryTime);
  });

  [
    ['node:stream', NodeStream] as [string, typeof NodeStream],
    // Redundantly include used version twice for regression-detection purposes
    ['readable-stream', OurReadableStream] as [
      string,
      typeof OurReadableStream,
    ],
    ['readable-stream v2', ReadableStream2] as [string, typeof ReadableStream2],
    ['readable-stream v3', ReadableStream3] as [string, typeof ReadableStream3],
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
        it(`handles a mix of request types coming through a ${className} stream`, async () => {
          const requests = [
            { id: 1, method: 'foo' },
            { method: 'notify1' },
            { id: 1, method: 'foo' },
            { id: 2, method: 'bar' },
            { method: 'notify2' },
            { id: 2, method: 'bar' },
            { id: 3, method: 'baz' },
          ];

          const expectedOutput = [
            { id: 1, method: 'foo' },
            { method: 'notify1' },
            { id: 2, method: 'bar' },
            { method: 'notify2' },
            { id: 3, method: 'baz' },
          ];

          const output: JsonRpcRequest[] = [];
          const testStream = createDupeReqFilterStream();
          const testOutStream = new S({
            transform: (chunk: JsonRpcRequest, _, cb) => {
              output.push(chunk);
              cb();
            },
            objectMode: true,
          });

          testOutStream._write = (
            chunk: JsonRpcRequest,
            _: BufferEncoding,
            callback: (error?: Error | null) => void,
          ) => {
            output.push(chunk);
            callback();
          };

          testStream.pipe(testOutStream);

          requests.forEach((request) => testStream.write(request));

          expect(output).toEqual(expectedOutput);
        });
      });
    });
  });
});
