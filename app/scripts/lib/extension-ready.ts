import browser from 'webextension-polyfill';

export type Reason = 'install' | 'startup';

export class ExtensionReady {
  public ready: Promise<Reason>;

  public installed: Promise<void>;

  private onReadyListener: PromiseWithResolvers<Reason> | undefined;

  private startupTimer: number | undefined;

  /**
   * Important: this must be constructed in a synchronous context (like at the
   * top level of a file immediately after the `import` statements).
   *
   * ---
   *
   * Listens for browser extension events and resolves `ready` and `installed`
   * promises when appropriate.
   *
   * Optionally accepts an existing `onReadyListener` promise that must resolve
   * with either 'install' or 'startup'. This is useful for MV3 builds that must
   * install the listeners in `app-init.js`, as listeners installed in imported
   * files are not guaranteed to be called.
   *
   * The `ready` event is *always* resolved, but the `installed` event is not.
   *
   * @param onReadyListener - Optional promise that resolves with 'install' or
   * 'startup'.
   */
  constructor(onReadyListener?: PromiseWithResolvers<Reason>) {
    // Use the provided deferred promise or create a new one
    this.onReadyListener = onReadyListener ?? Promise.withResolvers<Reason>();

    this.ready = this.onReadyListener.promise;
    this.installed = new Promise<void>((resolve) => {
      this.ready.then((reason) => {
        if (reason === 'install') {
          resolve();
        }
      });
    });

    // FOr MV2, we must install the listeners in this file, as they are not
    // guaranteed to be called if installed in `app-init.js`.
    // For MV3, we must use the provided `onReadyListener` promise to resolve
    // the `ready` promise, as listeners installed in imported files are not
    // guaranteed to be called.
    if (!onReadyListener) {
      browser.runtime.onInstalled.addListener(this.onInstalledListener);
      if (!browser.extension.inIncognitoContext) {
        // onStartup doesn't work in incognito mode, so we don't bother
        // listening for it
        browser.runtime.onStartup.addListener(this.onStartupListener);
      }

      // `onInstalled` and `onStartup` are not always called, so we set a
      // timeout to resolve the `ready` promise after 5 seconds.
      // This is to prevent the extension from hanging indefinitely if the
      // listeners are not called.
      // We use a timeout of 5 seconds, as this is what I chose. It is not
      // based on any specific requirement or standard.
      this.startupTimer = window.setTimeout(() => {
        this.uninstallListeners();
        this.onReadyListener?.resolve('startup');
      }, 5000);
    }
  }

  private onStartupListener() {
    this.uninstallListeners();
    this.onReadyListener?.resolve('startup');
  }

  private onInstalledListener({
    reason,
  }: browser.Runtime.OnInstalledDetailsType) {
    this.uninstallListeners();
    if (reason === 'install') {
      this.onReadyListener?.resolve('install');
    } else {
      this.onReadyListener?.resolve('startup');
    }
  }

  /**
   * Uninstalls the listeners, clears the startup timer, and cleans up.
   */
  private uninstallListeners() {
    browser.runtime.onStartup.removeListener(this.onStartupListener);
    browser.runtime.onInstalled.removeListener(this.onInstalledListener);
    clearTimeout(this.startupTimer);
    this.startupTimer = undefined;
    this.onReadyListener = undefined;
  }
}
