import path from 'path';
import { promises as fs } from 'fs';
import type { BrowserContext, CDPSession, Page } from '@playwright/test';
import { ONBOARDING_ROUTE } from '../../../../../ui/helpers/constants/routes';

const INTERVAL_MS = 250;
const QUALITY = 60;
const CAPTURE = { format: 'jpeg', quality: QUALITY } as const;

type PageEntry = {
  page: Page;
  index: number;
  session: CDPSession;
  lastBuffer?: Buffer;
  lastTs: number;
  capturing: boolean;
  closed: boolean;
  onClose: () => void;
};

type ScreencastEventType =
  | 'start'
  | 'page-attach'
  | 'page-close'
  | 'error'
  | 'stop';

export type ScreencastRecorderOptions = {
  /** Directory that receives `frames/`, `frames.jsonl` and `events.jsonl`. */
  dir: string;
  context: BrowserContext;
  /** The main extension page. It is never closed as an onboarding leftover. */
  extensionPage?: Page;
};

/** The launch option wins over the `MM_SCREENCAST_DIR` environment variable. */
export function resolveScreencastDir(
  optionDir: string | undefined,
  env: Record<string, string | undefined>,
): string | undefined {
  const dir = optionDir ?? env.MM_SCREENCAST_DIR;
  return dir?.trim() ? dir : undefined;
}

/** Onboarding screens may show the recovery phrase and password. */
export function isOnboardingUrl(url: string): boolean {
  return url.includes(ONBOARDING_ROUTE);
}

/**
 * Records every page of a Playwright browser context by taking a CDP
 * screenshot of its emulated viewport every 250 ms. Output: `frames/`,
 * `frames.jsonl` and `events.jsonl`; runtime errors are logged and never
 * thrown.
 *
 * A timer polls each page, so pages without changes still get a capture but
 * byte-identical frames are not written. A page with a capture in flight is
 * skipped until it finishes, so a slow capture cannot build a queue.
 */
export class ScreencastRecorder {
  private readonly options: ScreencastRecorderOptions;

  private readonly entries = new Map<Page, PageEntry>();

  private readonly attaching = new Set<Page>();

  private readonly pending = new Set<Promise<void>>();

  private nextIndex = 0;

  private timer?: ReturnType<typeof setInterval>;

  private started = false;

  private stopped = false;

  constructor(options: ScreencastRecorderOptions) {
    this.options = options;
  }

  private readonly onPage = (page: Page): void => {
    this.attach(page).catch(() => undefined);
  };

  /**
   * Starts recording. Only call this after onboarding, so secrets are never
   * captured. Throws only when the output directory cannot be created.
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;

    await fs.mkdir(path.join(this.options.dir, 'frames'), { recursive: true });
    await this.closeCompletionTabs();
    await this.logEvent('start', {
      intervalMs: INTERVAL_MS,
      quality: QUALITY,
      pages: this.options.context.pages().map((page) => page.url()),
    });

    this.options.context.on('page', this.onPage);
    await Promise.all(
      this.options.context.pages().map((page) => this.attach(page)),
    );
    if (!this.stopped) {
      this.timer = setInterval(() => {
        this.captureAll().catch(() => undefined);
      }, INTERVAL_MS);
    }
  }

  /** Stops the timer, waits for in-flight captures and writes, then logs `stop`. */
  async stop(): Promise<void> {
    if (!this.started || this.stopped) {
      return;
    }
    this.stopped = true;
    this.options.context.off('page', this.onPage);
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    for (const entry of this.entries.values()) {
      entry.page.off('close', entry.onClose);
    }

    await this.flush();
    this.entries.clear();
    await this.logEvent('stop');
  }

  /** Closes the leftover onboarding-completion tab, which animates forever. */
  private async closeCompletionTabs(): Promise<void> {
    for (const page of this.options.context.pages()) {
      const url = page.url();
      if (
        page === this.options.extensionPage ||
        page.isClosed() ||
        !url.startsWith('chrome-extension://') ||
        !isOnboardingUrl(url)
      ) {
        continue;
      }
      await page
        .close()
        .catch((error) =>
          this.logError(
            `Failed to close onboarding tab: ${errorMessage(error)}`,
          ),
        );
    }
  }

  private async attach(page: Page): Promise<void> {
    if (
      this.stopped ||
      this.entries.has(page) ||
      this.attaching.has(page) ||
      page.isClosed()
    ) {
      return;
    }
    this.attaching.add(page);
    const index = this.nextIndex;
    this.nextIndex += 1;
    let session: CDPSession | undefined;
    try {
      session = await this.options.context.newCDPSession(page);
      if (this.stopped) {
        await session.detach().catch(() => undefined);
        return;
      }
      const entry: PageEntry = {
        page,
        index,
        session,
        lastTs: 0,
        capturing: false,
        closed: false,
        onClose: () => {
          entry.closed = true;
          if (!this.stopped) {
            this.entries.delete(page);
            this.logEvent('page-close', { page: index });
          }
        },
      };
      this.entries.set(page, entry);
      page.on('close', entry.onClose);
      this.logEvent('page-attach', { page: index, url: page.url() });
    } catch (error) {
      if (session) {
        this.entries.delete(page);
        await session.detach().catch(() => undefined);
      }
      await this.logError(errorMessage(error), index);
    } finally {
      this.attaching.delete(page);
    }
  }

  private async captureAll(): Promise<void> {
    const captures: Promise<void>[] = [];
    for (const entry of this.entries.values()) {
      if (!entry.closed && !entry.capturing) {
        const capture = this.capture(entry);
        this.track(capture);
        captures.push(capture);
      }
    }
    await Promise.all(captures);
  }

  private async capture(entry: PageEntry): Promise<void> {
    entry.capturing = true;
    try {
      const viewport = entry.page.viewportSize() ?? { width: 0, height: 0 };
      const { data } = await entry.session.send('Page.captureScreenshot', {
        ...CAPTURE,
        // Always the viewport size; area outside a smaller window is white.
        clip: {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
          scale: 1,
        },
      });
      const buffer = Buffer.from(data, 'base64');
      if (entry.lastBuffer?.equals(buffer)) {
        return;
      }
      entry.lastBuffer = buffer;

      // Response time, closest to what is on screen. Monotonic for unique names.
      const ts = Math.max(Date.now(), entry.lastTs + 1);
      entry.lastTs = ts;
      const file = `frames/${entry.index}-${ts}.jpg`;

      try {
        await fs.writeFile(path.join(this.options.dir, file), buffer);
        await fs.appendFile(
          path.join(this.options.dir, 'frames.jsonl'),
          `${JSON.stringify({
            page: entry.index,
            url: entry.page.isClosed() ? null : entry.page.url(),
            ts,
            deviceWidth: viewport.width,
            deviceHeight: viewport.height,
            file,
            bytes: buffer.length,
          })}\n`,
        );
      } catch (error) {
        await this.logError(
          `Failed to write frame ${file}: ${errorMessage(error)}`,
          entry.index,
        );
      }
    } catch (error) {
      await this.logError(
        `Failed to capture frame: ${errorMessage(error)}`,
        entry.index,
      );
    } finally {
      entry.capturing = false;
    }
  }

  /** Appends one `events.jsonl` line. Never rejects. */
  private logEvent(
    type: ScreencastEventType,
    extra: Record<string, unknown> = {},
  ): Promise<void> {
    const write = fs
      .appendFile(
        path.join(this.options.dir, 'events.jsonl'),
        `${JSON.stringify({ type, ts: Date.now(), ...extra })}\n`,
      )
      .catch(() => undefined);
    this.track(write);
    return write;
  }

  private logError(message: string, page?: number): Promise<void> {
    return this.logEvent('error', {
      ...(page === undefined ? {} : { page }),
      message,
    });
  }

  /** Tracks a write so `stop()` can flush it. */
  private track(promise: Promise<void>): void {
    const tracked = promise.catch(() => undefined);
    this.pending.add(tracked);
    tracked.then(() => this.pending.delete(tracked));
  }

  private async flush(): Promise<void> {
    while (this.pending.size > 0) {
      await Promise.all([...this.pending]);
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
