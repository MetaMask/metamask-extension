import { obj as createThroughStream } from 'through2';
import createDupeReqFilterStream, {
  THREE_MINUTES,
} from './createDupeReqFilterStream';

function createTestStream(output) {
  const throughStream = createDupeReqFilterStream();
  const testOutStream = createThroughStream((chunk, _, cb) => {
    output.push(chunk);
    cb();
  });

  throughStream.pipe(testOutStream);

  return throughStream;
}

function runStreamTest(requests, advanceTimersTime = 10) {
  return new Promise((resolve, reject) => {
    const output = [];
    const testStream = createTestStream(output);

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
    ];

    const expectedOutput = [
      { id: 1, method: 'foo' },
      { id: 2, method: 'bar' },
    ];

    const output = await runStreamTest(requests);
    expect(output).toEqual(expectedOutput);
  });

  it('does not let through the request if the id has been seen before', async () => {
    const requests = [
      { id: 1, method: 'foo' },
      { id: 1, method: 'foo' }, // duplicate
    ];

    const expectedOutput = [{ id: 1, method: 'foo' }];

    const output = await runStreamTest(requests);
    expect(output).toEqual(expectedOutput);
  });

  it("lets through requests if they don't have an id", async () => {
    const requests = [{ method: 'notify1' }, { method: 'notify2' }];

    const expectedOutput = [{ method: 'notify1' }, { method: 'notify2' }];

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
    ];

    const expectedOutput = [
      { id: 1, method: 'foo' },
      { method: 'notify1' },
      { id: 2, method: 'bar' },
      { method: 'notify2' },
      { id: 3, method: 'baz' },
    ];

    const output = await runStreamTest(requests);
    expect(output).toEqual(expectedOutput);
  });

  it('expires single id after three minutes', () => {
    const output = [];
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
    const output = [];
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
    const output = [];
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
    const output = [];
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
    const output = [];
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
    const output = [];
    const testStream = createTestStream(output);

    const requests1 = [{ id: 1, method: 'foo' }];
    const expectedOutputBeforeExpiryTime = [{ id: 1, method: 'foo' }];

    requests1.forEach((request) => testStream.write(request));
    expect(output).toEqual(expectedOutputBeforeExpiryTime);

    jest.advanceTimersByTime(THREE_MINUTES + 1);

    expect(output).toEqual(expectedOutputBeforeExpiryTime);
  });
});
