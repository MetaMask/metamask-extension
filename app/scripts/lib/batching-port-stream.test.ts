import { ExtensionPortStream } from 'extension-port-stream';
import { BatchingPortStream } from './batching-port-stream';

type Listener = (message: unknown, port: unknown) => void;

type FakePort = {
  posts: unknown[];
  postMessage: jest.Mock;
  onMessage: { addListener: (listener: Listener) => void };
  onDisconnect: { addListener: (listener: () => void) => void };
  deliver: (message: unknown) => void;
  connect: (peer: FakePort) => void;
};

/**
 * @param maxSize - Largest accepted post in JSON characters; larger throws.
 * @returns A fake port that JSON round-trips and delivers in a new task.
 */
function createFakePort(maxSize = Infinity): FakePort {
  const listeners: Listener[] = [];
  let peer: FakePort | undefined;
  const port: FakePort = {
    posts: [],
    postMessage: jest.fn((message: unknown) => {
      const json = JSON.stringify(message);
      if (json.length > maxSize) {
        throw new Error('Message exceeded maximum allowed size of 64MiB.');
      }
      port.posts.push(JSON.parse(json));
      const target = peer;
      setTimeout(() => target?.deliver(JSON.parse(json)), 0);
    }),
    onMessage: {
      addListener: (listener: Listener) => listeners.push(listener),
    },
    onDisconnect: { addListener: () => undefined },
    deliver: (message: unknown) => {
      listeners.forEach((listener) => listener(message, port));
    },
    connect: (other: FakePort) => {
      peer = other;
    },
  };
  return port;
}

type PairOptions = { maxSize?: number; chunkSize?: number };

/**
 * @param options - `maxSize` for both fake ports, `chunkSize` for both streams.
 * @returns Two wired ends, their inner streams and ports, and b's received.
 */
function createPair(options: PairOptions = {}) {
  const { maxSize, chunkSize } = options;
  const portA = createFakePort(maxSize);
  const portB = createFakePort(maxSize);
  portA.connect(portB);
  portB.connect(portA);
  const innerA = new ExtensionPortStream(portA as never, { chunkSize });
  const innerB = new ExtensionPortStream(portB as never, { chunkSize });
  const a = new BatchingPortStream(innerA);
  const b = new BatchingPortStream(innerB);
  const received: unknown[] = [];
  b.on('data', (message: unknown) => received.push(message));
  return { a, b, innerA, innerB, portA, portB, received };
}

const wait = async (ms = 20) =>
  await new Promise((resolve) => setTimeout(resolve, ms));

describe('BatchingPortStream', () => {
  it('sends writes from the same task as one postMessage', async () => {
    const { a, portA, received } = createPair();

    a.write({ n: 1 });
    a.write({ n: 2 });
    a.write({ n: 3 });
    expect(portA.postMessage).not.toHaveBeenCalled();
    await wait();

    expect(portA.postMessage).toHaveBeenCalledTimes(1);
    expect(portA.posts[0]).toStrictEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
    expect(received).toStrictEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
  });

  it('sends writes from separate tasks as separate postMessages', async () => {
    const { a, portA, received } = createPair();

    a.write({ n: 1 });
    await wait();
    a.write({ n: 2 });
    a.write({ n: 3 });
    await wait();

    expect(portA.postMessage).toHaveBeenCalledTimes(2);
    expect(portA.posts).toStrictEqual([{ n: 1 }, [{ n: 2 }, { n: 3 }]]);
    expect(received).toStrictEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
  });

  it('sends a batch of one unwrapped', async () => {
    const { a, portA } = createPair();

    a.write({ n: 1 });
    await wait();

    expect(portA.posts).toStrictEqual([{ n: 1 }]);
  });

  it('wraps a lone array message so it is not read as a batch', async () => {
    const { a, portA, received } = createPair();

    a.write([1, 2]);
    await wait();

    expect(portA.posts).toStrictEqual([[[1, 2]]]);
    expect(received).toStrictEqual([[1, 2]]);
  });

  it('keeps order across batches and with raw messages interleaved', async () => {
    const { a, portA, portB, received } = createPair();

    a.write({ n: 1 });
    a.write({ n: 2 });
    await wait();
    // Raw, unbatched messages arriving on the receiving end, like `ALIVE`,
    // between batches.
    portB.deliver({ raw: 1 });
    portB.deliver([{ n: 3 }, { n: 4 }]);
    portB.deliver({ raw: 2 });
    a.write({ n: 5 });
    await wait();

    expect(received).toStrictEqual([
      { n: 1 },
      { n: 2 },
      { raw: 1 },
      { n: 3 },
      { n: 4 },
      { raw: 2 },
      { n: 5 },
    ]);
    expect(portA.posts).toStrictEqual([[{ n: 1 }, { n: 2 }], { n: 5 }]);
  });

  it('passes non-array messages through the unbatcher unchanged', async () => {
    const { portB, received } = createPair();

    portB.deliver({ name: 'controller', data: { method: 'x' } });
    portB.deliver('text');
    portB.deliver(7);
    await wait();

    expect(received).toStrictEqual([
      { name: 'controller', data: { method: 'x' } },
      'text',
      7,
    ]);
  });

  it('calls each writer back after its batch was handed to the port', async () => {
    const { a, portA } = createPair();
    const order: string[] = [];

    a.write({ n: 1 }, () => order.push(`cb1 posts=${portA.posts.length}`));
    a.write({ n: 2 }, () => order.push(`cb2 posts=${portA.posts.length}`));
    await wait();

    expect(order).toStrictEqual(['cb1 posts=1', 'cb2 posts=1']);
  });

  it('round-trips an oversized batch through ExtensionPortStream chunking', async () => {
    const { a, innerA, portA, received } = createPair({
      maxSize: 5_000,
      chunkSize: 1_000,
    });
    const tooLarge = jest.fn();
    innerA.on('message-too-large', tooLarge);
    const messages = Array.from({ length: 30 }, (_, n) => ({
      n,
      pad: 'x'.repeat(400),
    }));

    messages.forEach((message) => a.write(message));
    await wait(300);

    expect(tooLarge).toHaveBeenCalledTimes(1);
    expect(tooLarge.mock.calls[0][0].message).toHaveLength(30);
    // The rejected whole-batch post is followed by string frames.
    expect(portA.posts.length).toBeGreaterThan(1);
    expect(portA.posts.every((post) => typeof post === 'string')).toBe(true);
    expect(received).toStrictEqual(messages);
  });
});
