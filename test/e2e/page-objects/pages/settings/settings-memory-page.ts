import assert from 'node:assert/strict';
import { Driver as ChromeDriver } from 'selenium-webdriver/chrome';
import { Driver } from '../../../webdriver/driver';

type MemoryProbe = {
  capture: (selector: string) => number;
  isPresent: (selector: string) => boolean;
  navigate: (route: string) => void;
  retained: () => { capturedRoots: number; roots: number; images: number };
  settle: (done: () => void) => void;
};

type ProbeWindow = Window & { settingsMemoryProbe: MemoryProbe };

/** Observes Settings DOM collection without retaining Selenium element handles. */
export default class SettingsMemoryPage {
  private readonly driver: Driver;

  private readonly root = '[data-testid="parent-selector-settings-page"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async captureElements(): Promise<void> {
    await this.driver.wait(async () =>
      this.driver.executeScript(
        ([selector]: string[]) =>
          (window as ProbeWindow).settingsMemoryProbe.isPresent(selector),
        `${this.root} img`,
      ),
    );
    const imageCount = await this.driver.executeScript(
      ([selector]: string[]) =>
        (window as ProbeWindow).settingsMemoryProbe.capture(selector),
      this.root,
    );
    assert.ok(
      imageCount > 0,
      'Settings must contain images with load listeners',
    );
  }

  async checkElementsAreCollected(expectedVisits: number): Promise<void> {
    await this.driver.executeAsyncScript(function (...args: unknown[]) {
      const done = args[args.length - 1] as () => void;
      (window as ProbeWindow).settingsMemoryProbe.settle(done);
    });
    // Separate protocol calls end the jobs that create/dereference WeakRefs.
    const chrome = this.driver.driver as ChromeDriver;
    await chrome.sendDevToolsCommand('HeapProfiler.collectGarbage', {});
    await chrome.sendDevToolsCommand('HeapProfiler.collectGarbage', {});
    const retained = await this.driver.executeScript(() =>
      (window as ProbeWindow).settingsMemoryProbe.retained(),
    );
    assert.deepEqual(
      retained,
      { capturedRoots: expectedVisits, roots: 0, images: 0 },
      'Detached Settings elements remain reachable after garbage collection',
    );
  }

  async closeSettings(): Promise<void> {
    await this.driver.executeScript(() =>
      (window as ProbeWindow).settingsMemoryProbe.navigate('/'),
    );
    await this.driver.wait(async () =>
      this.driver.executeScript(
        ([selector]: string[]) =>
          !(window as ProbeWindow).settingsMemoryProbe.isPresent(selector),
        this.root,
      ),
    );
  }

  async installProbe(): Promise<void> {
    const chrome = this.driver.driver as ChromeDriver;
    // Capture WeakRef before LavaMoat scuttles globals. Expose only the probe's
    // methods as a read-only property, without changing Snow or app listeners.
    await chrome.sendDevToolsCommand('Page.addScriptToEvaluateOnNewDocument', {
      source: `(() => {
        const NativeWeakRef = WeakRef;
        const NativeError = Error;
        const nativeAddEventListener = EventTarget.prototype.addEventListener;
        const documentRef = document;
        const locationRef = location;
        const nextFrame = requestAnimationFrame.bind(window);
        const roots = [];
        const images = [];
        Object.defineProperty(window, 'settingsMemoryProbe', {
          value: {
            capture(selector) {
              if (typeof window.SNOW !== 'function' ||
                  EventTarget.prototype.addEventListener === nativeAddEventListener) {
                throw new NativeError('This test requires a build with Snow enabled');
              }
              const root = documentRef.querySelector(selector);
              if (!root) throw new NativeError('Settings root is missing');
              roots.push(new NativeWeakRef(root));
              const elements = root.querySelectorAll('img');
              for (const image of elements) images.push(new NativeWeakRef(image));
              return elements.length;
            },
            isPresent(selector) {
              return documentRef.querySelector(selector) !== null;
            },
            navigate(route) {
              locationRef.hash = route;
            },
            retained() {
              return {
                capturedRoots: roots.length,
                roots: roots.filter(ref => ref.deref() !== undefined).length,
                images: images.filter(ref => ref.deref() !== undefined).length,
              };
            },
            settle(done) {
              nextFrame(() => nextFrame(() => done()));
            },
          },
        });
      })();`,
    });
    await this.driver.driver.navigate().refresh();
  }

  async openSettings(): Promise<void> {
    // Do not return WebElements: WebDriver's element cache can retain the
    // very nodes whose lifetime this test measures.
    await this.driver.executeScript(() =>
      (window as ProbeWindow).settingsMemoryProbe.navigate('/settings'),
    );
  }
}
