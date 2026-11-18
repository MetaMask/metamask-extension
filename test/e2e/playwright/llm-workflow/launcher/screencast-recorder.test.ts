import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';
import type { BrowserContext, CDPSession, Page } from '@playwright/test';
import {
  ScreencastRecorder,
  isOnboardingUrl,
  isSensitiveUrl,
  resolveScreencastDir,
} from './screencast-recorder';

jest.mock('fs', () => {
  const actual = jest.requireActual<typeof import('fs')>('fs');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      mkdir: jest.fn(async () => undefined),
      writeFile: jest.fn(async () => undefined),
      appendFile: jest.fn(async () => undefined),
    },
  };
});

const HOME = 'chrome-extension://abc/home.html';
const INTERVAL_MS = 250;
const DIR = '/screencast';
const FRAMES_DIR = path.join(DIR, 'frames');
const FRAMES_JSONL = path.join(DIR, 'frames.jsonl');
const EVENTS_JSONL = path.join(DIR, 'events.jsonl');
const CAPTURE = {
  format: 'jpeg',
  quality: 60,
  clip: { x: 0, y: 0, width: 1280, height: 800, scale: 1 },
};

const fsMock = fs as unknown as {
  mkdir: jest.Mock;
  writeFile: jest.Mock;
  appendFile: jest.Mock;
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

function setup(pages: FakePage[] = [fakePage()], extensionPage?: FakePage) {
  const context = fakeContext(pages);
  const recorder = new ScreencastRecorder({
    dir: DIR,
    context: context as unknown as BrowserContext,
    extensionPage: extensionPage as Page | undefined,
  });
  return { page: pages[0], context, recorder };
}

/** JSON lines appended to a file, in call order. */
function appendedLines(file: string): Record<string, unknown>[] {
  return fsMock.appendFile.mock.calls
    .filter(([target]) => target === file)
    .map(([, line]) => JSON.parse(line as string));
}

function frameLines(): Record<string, unknown>[] {
  return appendedLines(FRAMES_JSONL);
}

function eventLines(): Record<string, unknown>[] {
  return appendedLines(EVENTS_JSONL);
}

/** Frame images written under `frames/`. */
function frameWrites(): { target: string; data: Buffer }[] {
  return fsMock.writeFile.mock.calls
    .filter(([target]) => path.dirname(target as string) === FRAMES_DIR)
    .map(([target, data]) => ({
      target: target as string,
      data: data as Buffer,
    }));
}

function eventsOf(events: Record<string, unknown>[], type: string) {
  return events.filter((event) => event.type === type);
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(1_700_000_000_000);
  fsMock.mkdir.mockReset().mockResolvedValue(undefined);
  fsMock.writeFile.mockReset().mockResolvedValue(undefined);
  fsMock.appendFile.mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
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

  it('matches screens that can show or take wallet secrets', () => {
    for (const route of [
      '/onboarding/review-recovery-phrase',
      '/seed',
      '/seed/01JABCDEF',
      '/settings/security-and-password/manage-wallet-recovery',
      '/multichain-account-private-key-list/abc',
      '/import-srp',
      '/restore-vault?from=unlock',
    ]) {
      expect(isSensitiveUrl(`${HOME}#${route}`)).toBe(true);
    }
    for (const url of [
      HOME,
      `${HOME}#/`,
      `${HOME}#/send/asset`,
      `${HOME}#/settings/security-and-password`,
      `${HOME}#/seedless`,
      'https://example.com/#/seed',
    ]) {
      expect(isSensitiveUrl(url)).toBe(url === 'https://example.com/#/seed');
    }
  });
});

describe('ScreencastRecorder', () => {
  it('attaches existing and newly opened pages and captures each on every tick', async () => {
    const { page, context, recorder } = setup();
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

    const events = eventLines();
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
    const { page, context, recorder } = setup();
    await recorder.start();
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await recorder.stop();

    expect(fsMock.mkdir).toHaveBeenCalledWith(FRAMES_DIR, { recursive: true });
    expect(frameLines()).toStrictEqual([
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
    const writes = frameWrites();
    expect(writes).toHaveLength(1);
    expect(writes[0].target).toBe(path.join(FRAMES_DIR, '0-1700000000250.jpg'));
    expect(writes[0].data.toString('utf-8')).toBe('hello');
    expect(page.viewportSize).toHaveBeenCalled();
    expect(context.session(page).calls('Page.captureScreenshot')).toStrictEqual(
      [CAPTURE],
    );
  });

  it('skips byte-identical consecutive frames of a page', async () => {
    const { page, context, recorder } = setup();
    await recorder.start();
    const session = context.session(page);

    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    session.send.mockResolvedValue({ data: 'd29ybGQ=' });
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await recorder.stop();

    expect(frameLines()).toHaveLength(2);
    expect(frameWrites()).toHaveLength(2);
  });

  it('skips a tick while that page has a capture in flight', async () => {
    let resolveCapture: (value: { data: string }) => void = () => undefined;
    const { page, context, recorder } = setup();
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
    const { page, context, recorder } = setup();
    await recorder.start();
    const session = context.session(page);
    session.send.mockRejectedValueOnce(new Error('target closed'));
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    fsMock.writeFile.mockRejectedValueOnce(new Error('disk full'));
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await expect(recorder.stop()).resolves.toBeUndefined();

    expect(
      eventsOf(eventLines(), 'error').map((event) => event.message),
    ).toStrictEqual([
      'Failed to capture frame: target closed',
      'Failed to write frame frames/0-1700000000500.jpg: disk full',
    ]);
  });

  it('logs repeated capture failures of a page once until a capture succeeds', async () => {
    const { page, context, recorder } = setup();
    await recorder.start();
    const session = context.session(page);
    session.send
      .mockRejectedValueOnce(new Error('Internal error'))
      .mockRejectedValueOnce(new Error('Internal error'))
      .mockRejectedValueOnce(new Error('Internal error'));
    await jest.advanceTimersByTimeAsync(INTERVAL_MS * 3);
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    session.send.mockRejectedValueOnce(new Error('Unable to capture'));
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await recorder.stop();

    expect(session.calls('Page.captureScreenshot')).toHaveLength(5);
    expect(
      eventsOf(eventLines(), 'error').map((event) => event.message),
    ).toStrictEqual([
      'Failed to capture frame: Internal error',
      'Failed to capture frame: Unable to capture',
    ]);
    expect(frameLines()).toHaveLength(1);
  });

  it('never captures a sensitive screen and resumes after it is left', async () => {
    const { page, context, recorder } = setup();
    await recorder.start();
    const session = context.session(page);

    page.url.mockReturnValue(`${HOME}#/seed/abc`);
    await jest.advanceTimersByTimeAsync(INTERVAL_MS * 3);
    expect(session.calls('Page.captureScreenshot')).toHaveLength(0);

    page.url.mockReturnValue(`${HOME}#/`);
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    page.url.mockReturnValue(`${HOME}#/import-srp`);
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await recorder.stop();

    expect(session.calls('Page.captureScreenshot')).toHaveLength(1);
    expect(frameLines().map((frame) => frame.url)).toStrictEqual([`${HOME}#/`]);
    expect(eventsOf(eventLines(), 'skip-sensitive')).toStrictEqual([
      { type: 'skip-sensitive', ts: expect.any(Number), page: 0 },
      { type: 'skip-sensitive', ts: expect.any(Number), page: 0 },
    ]);
  });

  it('records the url from when the frame was captured, not when it is written', async () => {
    let finishWrite: () => void = () => undefined;
    const { page, context, recorder } = setup();
    await recorder.start();
    const session = context.session(page);
    fsMock.writeFile.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        }),
    );

    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(session.calls('Page.captureScreenshot')).toHaveLength(1);
    expect(fsMock.writeFile).toHaveBeenCalledTimes(1);

    page.url.mockReturnValue(`${HOME}#/settings`);
    finishWrite();
    await recorder.stop();

    expect(frameLines().map((frame) => frame.url)).toStrictEqual([HOME]);
  });

  it('drops a frame when the page reaches a sensitive screen during the capture', async () => {
    const { page, context, recorder } = setup();
    await recorder.start();
    const session = context.session(page);
    session.send.mockImplementationOnce(async () => {
      page.url.mockReturnValue(`${HOME}#/multichain-account-private-key-list`);
      return { data: 'aGVsbG8=' };
    });

    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await recorder.stop();

    expect(session.calls('Page.captureScreenshot')).toHaveLength(1);
    expect(frameLines()).toStrictEqual([]);
    expect(frameWrites()).toStrictEqual([]);
  });

  it('stops capturing a closed page and writes a null url while closing', async () => {
    const { page, context, recorder } = setup();
    await recorder.start();
    const session = context.session(page);

    page.isClosed.mockReturnValue(true);
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    page.emitClose();
    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    await recorder.stop();

    const frames = frameLines();
    expect(frames).toHaveLength(1);
    expect(frames[0].url).toBeNull();
    expect(session.calls('Page.captureScreenshot')).toHaveLength(1);
    expect(eventsOf(eventLines(), 'page-close')).toStrictEqual([
      { type: 'page-close', ts: expect.any(Number), page: 0 },
    ]);
  });

  it('closes the leftover onboarding tab before attaching pages', async () => {
    const extensionPage = fakePage();
    const completionPage = fakePage(`${HOME}#/onboarding/completion`);
    const { context, recorder } = setup(
      [extensionPage, completionPage],
      extensionPage,
    );

    await recorder.start();
    await recorder.stop();

    expect(completionPage.close).toHaveBeenCalledTimes(1);
    expect(extensionPage.close).not.toHaveBeenCalled();
    expect(context.newCDPSession).toHaveBeenCalledTimes(1);
    expect(eventsOf(eventLines(), 'page-attach')).toHaveLength(1);
  });

  it('logs attach failures without throwing', async () => {
    const { context, recorder } = setup();
    context.newCDPSession.mockRejectedValueOnce(new Error('no target'));

    await expect(recorder.start()).resolves.toBeUndefined();
    await recorder.stop();

    expect(eventsOf(eventLines(), 'error')).toStrictEqual([
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
    const { page, context, recorder } = setup();
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
    expect(frameLines()).toHaveLength(1);
    const events = eventLines();
    expect(eventsOf(events, 'stop')).toHaveLength(1);
    expect(events[events.length - 1]).toStrictEqual({
      type: 'stop',
      ts: expect.any(Number),
    });

    await jest.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(session.calls('Page.captureScreenshot')).toHaveLength(1);
  });
});
