import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import type { BrowserContext, CDPSession, Page } from '@playwright/test';
import {
  ScreencastRecorder,
  isOnboardingUrl,
  resolveScreencastDir,
} from './screencast-recorder';

const HOME = 'chrome-extension://abc/home.html';
const INTERVAL_MS = 250;
const CAPTURE = {
  format: 'jpeg',
  quality: 60,
  clip: { x: 0, y: 0, width: 1280, height: 800, scale: 1 },
};

function fakeSession(data = 'aGVsbG8=') {
  const send = jest.fn(async (method: string, _params?: unknown) => {
    if (method === 'Page.captureScreenshot') {
      return { data };
    }
    return {};
  });
  return {
    send,
    detach: jest.fn(async () => undefined),
    calls: (method: string) =>
      send.mock.calls
        .filter(([name]) => name === method)
        .map(([, params]) => params),
  };
}

function fakePage(url = HOME) {
  const emitter = new EventEmitter();
  let closed = false;
  return {
    url: jest.fn(() => url),
    isClosed: jest.fn(() => closed),
    viewportSize: jest.fn(() => ({ width: 1280, height: 800 })),
    close: jest.fn(async () => {
      closed = true;
      emitter.emit('close');
    }),
    on: (event: string, handler: () => void) => emitter.on(event, handler),
    off: (event: string, handler: () => void) => emitter.off(event, handler),
    emitClose: () => {
      closed = true;
      emitter.emit('close');
    },
  };
}

function fakeContext(pages: FakePage[]) {
  const emitter = new EventEmitter();
  const sessions = new Map<FakePage, FakeSession>();
  const newCDPSession = jest.fn(async (page: FakePage) => {
    const session = fakeSession();
    sessions.set(page, session);
    return session as unknown as CDPSession;
  });
  return {
    newCDPSession,
    pages: jest.fn(() => pages.map((page) => page as unknown as Page)),
    on: (event: string, handler: (page: FakePage) => void) =>
      emitter.on(event, handler),
    off: (event: string, handler: (page: FakePage) => void) =>
      emitter.off(event, handler),
    openPage: (page: FakePage) => {
      pages.push(page);
      emitter.emit('page', page);
    },
    session: (page: FakePage) => sessions.get(page) as FakeSession,
  };
}

type FakePage = ReturnType<typeof fakePage>;
type FakeSession = ReturnType<typeof fakeSession>;

const tempDirs: string[] = [];

async function setup(
  pages: FakePage[] = [fakePage()],
  extensionPage?: FakePage,
) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mm-screencast-'));
  tempDirs.push(dir);
  const context = fakeContext(pages);
  const recorder = new ScreencastRecorder({
    dir,
    context: context as unknown as BrowserContext,
    extensionPage: extensionPage as Page | undefined,
  });
  return { dir, page: pages[0], context, recorder };
}

async function readLines(
  dir: string,
  file: string,
): Promise<Record<string, unknown>[]> {
  const text = await fs.readFile(path.join(dir, file), 'utf-8');
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function eventsOf(events: Record<string, unknown>[], type: string) {
  return events.filter((event) => event.type === type);
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(1_700_000_000_000);
});

afterEach(async () => {
  jest.clearAllTimers();
  jest.useRealTimers();
  for (const dir of tempDirs.splice(0)) {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

describe('screencast helpers', () => {
  it('prefers the launch option, falls back to the environment, and is off when unset', () => {
    expect(resolveScreencastDir('/option', { MM_SCREENCAST_DIR: '/env' })).toBe(
      '/option',
    );
    expect(resolveScreencastDir(undefined, { MM_SCREENCAST_DIR: '/env' })).toBe(
      '/env',
    );
    expect(resolveScreencastDir(undefined, {})).toBeUndefined();
  });

  it('matches onboarding routes only', () => {
    expect(isOnboardingUrl(`${HOME}#/onboarding/completion`)).toBe(true);
    expect(isOnboardingUrl(HOME)).toBe(false);
    expect(isOnboardingUrl('sidepanel.html')).toBe(false);
  });
});

describe('ScreencastRecorder', () => {
  it('attaches existing and newly opened pages and captures each on every tick', async () => {
    const { dir, page, context, recorder } = await setup();
    await recorder.start();

    const newPage = fakePage('chrome-extension://abc/notification.html');
    context.openPage(newPage);
    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await recorder.stop();

    expect(context.newCDPSession).toHaveBeenCalledTimes(2);
    expect(context.session(page).calls('Page.captureScreenshot')).toStrictEqual(
      [CAPTURE],
    );
    expect(
      context.session(newPage).calls('Page.captureScreenshot'),
    ).toStrictEqual([CAPTURE]);

    const events = await readLines(dir, 'events.jsonl');
    expect(events[0]).toStrictEqual({
      type: 'start',
      ts: expect.any(Number),
      intervalMs: INTERVAL_MS,
      quality: 60,
      pages: [HOME],
    });
    expect(eventsOf(events, 'page-attach')).toStrictEqual([
      { type: 'page-attach', ts: expect.any(Number), page: 0, url: HOME },
      {
        type: 'page-attach',
        ts: expect.any(Number),
        page: 1,
        url: 'chrome-extension://abc/notification.html',
      },
    ]);
  });

  it('writes frames and frames.jsonl in the contract shape', async () => {
    const { dir, page, context, recorder } = await setup();
    await recorder.start();
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await recorder.stop();

    expect(await readLines(dir, 'frames.jsonl')).toStrictEqual([
      {
        page: 0,
        url: HOME,
        ts: 1_700_000_000_250,
        deviceWidth: 1280,
        deviceHeight: 800,
        file: 'frames/0-1700000000250.jpg',
        bytes: 5,
      },
    ]);
    const files = await fs.readdir(path.join(dir, 'frames'));
    expect(files).toStrictEqual(['0-1700000000250.jpg']);
    expect(await fs.readFile(path.join(dir, 'frames', files[0]), 'utf-8')).toBe(
      'hello',
    );
    expect(page.viewportSize).toHaveBeenCalled();
  });

  it('skips byte-identical consecutive frames of a page', async () => {
    const { dir, page, context, recorder } = await setup();
    await recorder.start();
    const session = context.session(page);

    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    session.send.mockResolvedValue({ data: 'd29ybGQ=' });
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await recorder.stop();

    expect(await readLines(dir, 'frames.jsonl')).toHaveLength(2);
    expect(await fs.readdir(path.join(dir, 'frames'))).toHaveLength(2);
  });

  it('skips a tick while that page has a capture in flight', async () => {
    let resolveCapture: (value: { data: string }) => void = () => undefined;
    const { page, context, recorder } = await setup();
    await recorder.start();
    const session = context.session(page);
    session.send.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveCapture = resolve;
        }),
    );

    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(session.calls('Page.captureScreenshot')).toHaveLength(1);

    resolveCapture({ data: 'YQ==' });
    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(session.calls('Page.captureScreenshot')).toHaveLength(2);
    await recorder.stop();
  });

  it('logs capture and write failures without throwing', async () => {
    const { dir, page, context, recorder } = await setup();
    await recorder.start();
    const session = context.session(page);
    session.send.mockRejectedValueOnce(new Error('target closed'));
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(new Error('disk full'));
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await expect(recorder.stop()).resolves.toBeUndefined();

    expect(
      eventsOf(await readLines(dir, 'events.jsonl'), 'error').map(
        (event) => event.message,
      ),
    ).toStrictEqual([
      'Failed to capture frame: target closed',
      'Failed to write frame frames/0-1700000000500.jpg: disk full',
    ]);
  });

  it('stops capturing a closed page and writes a null url while closing', async () => {
    const { dir, page, context, recorder } = await setup();
    await recorder.start();
    const session = context.session(page);

    page.isClosed.mockReturnValue(true);
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    page.emitClose();
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await recorder.stop();

    const frames = await readLines(dir, 'frames.jsonl');
    expect(frames).toHaveLength(1);
    expect(frames[0].url).toBeNull();
    expect(session.calls('Page.captureScreenshot')).toHaveLength(1);
    expect(
      eventsOf(await readLines(dir, 'events.jsonl'), 'page-close'),
    ).toStrictEqual([{ type: 'page-close', ts: expect.any(Number), page: 0 }]);
  });

  it('closes the leftover onboarding tab before attaching pages', async () => {
    const extensionPage = fakePage();
    const completionPage = fakePage(`${HOME}#/onboarding/completion`);
    const { dir, context, recorder } = await setup(
      [extensionPage, completionPage],
      extensionPage,
    );

    await recorder.start();
    await recorder.stop();

    expect(completionPage.close).toHaveBeenCalledTimes(1);
    expect(extensionPage.close).not.toHaveBeenCalled();
    expect(context.newCDPSession).toHaveBeenCalledTimes(1);
    expect(
      eventsOf(await readLines(dir, 'events.jsonl'), 'page-attach'),
    ).toHaveLength(1);
  });

  it('logs attach failures without throwing', async () => {
    const { dir, context, recorder } = await setup();
    context.newCDPSession.mockRejectedValueOnce(new Error('no target'));

    await expect(recorder.start()).resolves.toBeUndefined();
    await recorder.stop();

    expect(
      eventsOf(await readLines(dir, 'events.jsonl'), 'error'),
    ).toStrictEqual([
      {
        type: 'error',
        ts: expect.any(Number),
        page: 0,
        message: 'no target',
      },
    ]);
  });

  it('stops the timer, waits for an in-flight capture, and is idempotent', async () => {
    let resolveCapture: (value: { data: string }) => void = () => undefined;
    const { dir, page, context, recorder } = await setup();
    await recorder.start();
    const session = context.session(page);
    session.send.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveCapture = resolve;
        }),
    );
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);

    let stopped = false;
    const stopPromise = recorder.stop().then(() => {
      stopped = true;
    });
    await jest.advanceTimersByTimeAsync(0);
    expect(stopped).toBe(false);

    resolveCapture({ data: 'YQ==' });
    await stopPromise;
    await recorder.stop();

    expect(stopped).toBe(true);
    expect(await readLines(dir, 'frames.jsonl')).toHaveLength(1);
    const events = await readLines(dir, 'events.jsonl');
    expect(eventsOf(events, 'stop')).toHaveLength(1);
    expect(events[events.length - 1]).toStrictEqual({
      type: 'stop',
      ts: expect.any(Number),
    });

    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(session.calls('Page.captureScreenshot')).toHaveLength(1);
  });
});
