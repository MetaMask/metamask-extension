import { SECOND } from '../../../../../shared/constants/time';
import { createSegmentMock } from '..';

/** Dynamic re-import after `resetModules`/`doMock`. TS + ESLint disagree on `import('..')` / `../index`, so the path is built at runtime. */
function importSegmentIndexModule(): Promise<typeof import('..')> {
  const parentDir = '..';
  const entryName = 'index';
  return import(`${parentDir}/${entryName}`);
}

/** Large enough that a few track() calls do not trigger auto-flush */
const MANUAL_FLUSH_AT = 100;

describe('createSegmentMock', () => {
  it('starts with an empty queue', () => {
    const client = createSegmentMock(MANUAL_FLUSH_AT);
    expect(client.queue).toHaveLength(0);
  });

  it('appends track calls to the queue', () => {
    const client = createSegmentMock(MANUAL_FLUSH_AT);
    const cb = jest.fn();
    client.track({ event: 'one' }, cb);
    client.track({ event: 'two' }, cb);
    expect(client.queue).toHaveLength(2);
    expect(client.queue[0]?.[0]).toEqual({ event: 'one' });
    expect(client.queue[1]?.[0]).toEqual({ event: 'two' });
  });

  it('invokes every callback and clears the queue on flush', async () => {
    const client = createSegmentMock(MANUAL_FLUSH_AT);
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    client.track({ event: 'a' }, cb1);
    client.track({ event: 'b' }, cb2);
    await expect(client.flush()).resolves.toBeUndefined();
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(client.queue).toHaveLength(0);
  });

  it('uses a noop callback when track is called without one', async () => {
    const client = createSegmentMock(MANUAL_FLUSH_AT);
    client.track({ event: 'solo' });
    await client.flush();
    expect(client.queue).toHaveLength(0);
  });

  it('auto-flushes when the queue reaches flushAt', () => {
    const client = createSegmentMock(2);
    const cb = jest.fn();
    client.track({ event: 'first' }, cb);
    expect(client.queue).toHaveLength(1);
    client.track({ event: 'second' }, cb);
    expect(client.queue).toHaveLength(0);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('does not auto-flush until the queue reaches flushAt', () => {
    const client = createSegmentMock(MANUAL_FLUSH_AT);
    client.track({ event: 'only' });
    expect(client.queue).toHaveLength(1);
  });

  it('exposes noop page and identify for spying', () => {
    const client = createSegmentMock(MANUAL_FLUSH_AT);
    expect(() => client.page({ name: 'n' })).not.toThrow();
    expect(() => client.identify({ userId: 'u' })).not.toThrow();
  });
});

describe('segment module export', () => {
  const originalWriteKey = process.env.SEGMENT_WRITE_KEY;
  const originalHost = process.env.SEGMENT_HOST;
  const originalMetaMaskEnv = process.env.METAMASK_ENVIRONMENT;

  const analyticsConstructor = jest.fn();
  const analyticsInstance = {
    track: jest.fn(),
    identify: jest.fn(),
    page: jest.fn(),
    flush: jest.fn(() => Promise.resolve()),
  };

  afterEach(() => {
    jest.dontMock('@segment/analytics-node');
    jest.resetModules();
    process.env.SEGMENT_WRITE_KEY = originalWriteKey;
    process.env.SEGMENT_HOST = originalHost;
    process.env.METAMASK_ENVIRONMENT = originalMetaMaskEnv;
    analyticsConstructor.mockReset();
    analyticsConstructor.mockImplementation(() => analyticsInstance);
    analyticsInstance.track.mockReset();
    analyticsInstance.identify.mockReset();
    analyticsInstance.page.mockReset();
    analyticsInstance.flush.mockReset();
    analyticsInstance.flush.mockImplementation(() => Promise.resolve());
  });

  it('uses createSegmentMock when SEGMENT_WRITE_KEY is unset', async () => {
    jest.resetModules();
    delete process.env.SEGMENT_WRITE_KEY;
    const mod = await importSegmentIndexModule();
    expect('queue' in mod.segment).toBe(true);
  });

  it('constructs Analytics with dev defaults when write key is set', async () => {
    jest.resetModules();
    process.env.SEGMENT_WRITE_KEY = 'test-write-key';
    process.env.SEGMENT_HOST = 'https://segment.example/';
    process.env.METAMASK_ENVIRONMENT = 'development';
    jest.doMock('@segment/analytics-node', () => ({
      Analytics: analyticsConstructor,
    }));
    await importSegmentIndexModule();
    expect(analyticsConstructor).toHaveBeenCalledWith({
      writeKey: 'test-write-key',
      host: 'https://segment.example/',
      flushAt: 1,
      flushInterval: SECOND * 5,
    });
  });

  it('omits flushAt in production so the SDK default applies', async () => {
    jest.resetModules();
    process.env.SEGMENT_WRITE_KEY = 'prod-key';
    delete process.env.SEGMENT_HOST;
    process.env.METAMASK_ENVIRONMENT = 'production';
    jest.doMock('@segment/analytics-node', () => ({
      Analytics: analyticsConstructor,
    }));
    await importSegmentIndexModule();
    expect(analyticsConstructor).toHaveBeenCalledWith({
      writeKey: 'prod-key',
      host: undefined,
      flushAt: undefined,
      flushInterval: SECOND * 5,
    });
  });

  it('clones track payloads before forwarding so frozen context objects work', async () => {
    jest.resetModules();
    process.env.SEGMENT_WRITE_KEY = 'key';
    process.env.METAMASK_ENVIRONMENT = 'development';
    jest.doMock('@segment/analytics-node', () => ({
      Analytics: analyticsConstructor,
    }));
    const { segment: client } = await importSegmentIndexModule();
    const payload = {
      event: 'evt',
      context: Object.freeze({ app: Object.freeze({ name: 'x' }) }),
    };
    client.track(payload);
    const [forwarded] = analyticsInstance.track.mock.calls[0] ?? [];
    expect(forwarded).toBeDefined();
    expect(forwarded).not.toBe(payload);
    if (
      forwarded &&
      typeof forwarded === 'object' &&
      'context' in forwarded &&
      forwarded.context &&
      typeof forwarded.context === 'object'
    ) {
      Reflect.set(forwarded.context, 'library', { name: 'lib' });
    }
    expect(
      payload.context &&
        typeof payload.context === 'object' &&
        'library' in payload.context,
    ).toBe(false);
  });

  it('clones identify and page payloads before forwarding', async () => {
    jest.resetModules();
    process.env.SEGMENT_WRITE_KEY = 'key';
    process.env.METAMASK_ENVIRONMENT = 'development';
    jest.doMock('@segment/analytics-node', () => ({
      Analytics: analyticsConstructor,
    }));
    const { segment: client } = await importSegmentIndexModule();
    const identifyPayload = {
      userId: 'u',
      traits: Object.freeze({ plan: 'free' }),
    };
    client.identify(identifyPayload);
    const [idArg] = analyticsInstance.identify.mock.calls[0] ?? [];
    expect(idArg).not.toBe(identifyPayload);

    const pagePayload = {
      name: 'home',
      properties: Object.freeze({ path: '/' }),
    };
    client.page(pagePayload);
    const [pageArg] = analyticsInstance.page.mock.calls[0] ?? [];
    expect(pageArg).not.toBe(pagePayload);
  });

  it('delegates flush to the Analytics instance', async () => {
    jest.resetModules();
    process.env.SEGMENT_WRITE_KEY = 'key';
    process.env.METAMASK_ENVIRONMENT = 'development';
    jest.doMock('@segment/analytics-node', () => ({
      Analytics: analyticsConstructor,
    }));
    const { segment: client } = await importSegmentIndexModule();
    await client.flush();
    expect(analyticsInstance.flush).toHaveBeenCalledTimes(1);
  });

  it('forwards the optional callback to track, identify, and page', async () => {
    jest.resetModules();
    process.env.SEGMENT_WRITE_KEY = 'key';
    process.env.METAMASK_ENVIRONMENT = 'development';
    jest.doMock('@segment/analytics-node', () => ({
      Analytics: analyticsConstructor,
    }));
    const { segment: client } = await importSegmentIndexModule();
    const onTrack = jest.fn();
    const onIdentify = jest.fn();
    const onPage = jest.fn();
    client.track({ event: 'e' }, onTrack);
    client.identify({ userId: 'u' }, onIdentify);
    client.page({ name: 'n' }, onPage);
    expect(analyticsInstance.track).toHaveBeenCalledWith(
      expect.anything(),
      onTrack,
    );
    expect(analyticsInstance.identify).toHaveBeenCalledWith(
      expect.anything(),
      onIdentify,
    );
    expect(analyticsInstance.page).toHaveBeenCalledWith(
      expect.anything(),
      onPage,
    );
  });
});
