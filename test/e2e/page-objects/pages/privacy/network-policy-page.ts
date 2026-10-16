import { Driver, PAGES } from '../../../webdriver/driver';

export type NetworkProbeResult = {
  reached: boolean;
  status?: number;
  error?: string;
};

/** Browser probes exercise the network boundary without an application fetch helper. */
class NetworkPolicyPage {
  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async fetch(url: string): Promise<NetworkProbeResult> {
    return this.driver.executeScript(`
      return fetch(${JSON.stringify(url)}).then(
        response => ({ reached: true, status: response.status }),
        error => ({ reached: false, error: String(error) }),
      );
    `);
  }

  async fetchInBackground(url: string): Promise<NetworkProbeResult> {
    return this.driver.executeScriptInExtensionServiceWorker(`
      return fetch(${JSON.stringify(url)}).then(
        response => ({ reached: true, status: response.status }),
        error => ({ reached: false, error: String(error) }),
      );
    `) as Promise<NetworkProbeResult>;
  }

  async fetchInBlobWorker(url: string): Promise<NetworkProbeResult> {
    return this.driver.executeScript(this.workerProbeScript(url));
  }

  async fetchInFreshFrame(url: string): Promise<NetworkProbeResult> {
    return this.driver.executeScript(`
      const frame = document.createElement('iframe');
      document.body.append(frame);
      return frame.contentWindow.fetch(${JSON.stringify(url)}).then(
        response => ({ reached: true, status: response.status }),
        error => ({ reached: false, error: String(error) }),
      ).then(result => { frame.remove(); return result; });
    `);
  }

  async fetchInOpaqueSandbox(url: string): Promise<NetworkProbeResult> {
    return this.probeOpaqueSandbox(`return fetch(${JSON.stringify(url)}).then(
      response => ({ reached: true, status: response.status }),
      error => ({ reached: false, error: String(error) }),
    );`);
  }

  async fetchInOpaqueSandboxWorker(
    url: string,
    frameUrl: string,
  ): Promise<NetworkProbeResult> {
    // The packaged Snap runner prevents native Blob Workers independently of
    // DNR. Use a permitted remote document with the same opaque child origin
    // to exercise Worker attribution without the runner's script restrictions.
    const frame = await this.driver.executeScript(`
      return new Promise(resolve => {
        const iframe = document.createElement('iframe');
        iframe.dataset.networkPolicyProbe = 'true';
        iframe.sandbox = 'allow-scripts';
        iframe.onload = () => resolve(iframe);
        iframe.src = ${JSON.stringify(frameUrl)};
        document.body.append(iframe);
      });
    `);
    await this.driver.switchToFrame(frame);
    try {
      return await this.driver.executeScript(`
        if (globalThis.origin !== 'null') throw new Error('Expected an opaque sandbox origin');
        ${this.workerProbeScript(url)}
      `);
    } finally {
      await this.driver.switchToDefaultContent();
      await this.driver.executeScript(
        `document.querySelector('iframe[data-network-policy-probe]')?.remove();`,
      );
    }
  }

  async fetchWithPoisonedRequest(url: string): Promise<NetworkProbeResult> {
    return this.driver.executeScript(`
      const request = new Request(${JSON.stringify(url)});
      const original = Object.getOwnPropertyDescriptor(Request.prototype, 'url');
      Object.defineProperty(Request.prototype, 'url', {
        configurable: true,
        get: () => 'https://allowed.example/',
      });
      return fetch(request).then(
        response => ({ reached: true, status: response.status }),
        error => ({ reached: false, error: String(error) }),
      ).then(result => {
        Object.defineProperty(Request.prototype, 'url', original);
        return result;
      });
    `);
  }

  async openExtension(): Promise<void> {
    await this.driver.navigate(PAGES.HOME);
  }

  async openNativeExtensionDocument(): Promise<void> {
    // A packaged JSON document has the real extension origin without starting
    // application JavaScript or LavaMoat. DNR must protect this realm as well.
    await this.driver.openNewPage(`${this.driver.extensionUrl}/manifest.json`);
  }

  private async probeOpaqueSandbox(
    script: string,
  ): Promise<NetworkProbeResult> {
    await this.driver.executeScript(`
      return new Promise(resolve => {
        const frame = document.createElement('iframe');
        frame.dataset.networkPolicyProbe = 'true';
        frame.onload = () => resolve(true);
        frame.src = 'snaps/index.html';
        document.body.append(frame);
      });
    `);
    // Selenium's script atoms require globals which Snow scuttles in this
    // sandbox. An isolated DevTools world supplies native primitives while
    // retaining the frame's opaque origin and extension top-frame association.
    const connection = await this.driver.driver.createCDPConnection('browser');
    const targets = await connection.send('Target.getTargets');
    const target = targets.result?.targetInfos?.find(
      (info: { type: string; url: string }) =>
        info.type === 'iframe' &&
        info.url === `${this.driver.extensionUrl}/snaps/index.html`,
    );
    if (!target) {
      throw new Error('Opaque Snap sandbox target is unavailable');
    }
    const attached = await connection.send('Target.attachToTarget', {
      targetId: target.targetId,
      flatten: true,
    });
    const sessionId = attached.result?.sessionId;
    connection.sessionId = sessionId;
    try {
      const tree = await connection.send('Page.getFrameTree');
      const world = await connection.send('Page.createIsolatedWorld', {
        frameId: tree.result.frameTree.frame.id,
        worldName: 'network-policy-native-probe',
      });
      const response = await connection.send('Runtime.evaluate', {
        expression: `(async () => {
          if (globalThis.origin !== 'null') throw new Error('Expected an opaque sandbox origin');
          ${script}
        })()`,
        contextId: world.result.executionContextId,
        awaitPromise: true,
        returnByValue: true,
      });
      const { result } = response;
      if (result.exceptionDetails) {
        throw new Error(
          result.exceptionDetails.exception?.description ??
            result.exceptionDetails.text,
        );
      }
      return result.result.value as NetworkProbeResult;
    } finally {
      connection.sessionId = null;
      await connection.send('Target.detachFromTarget', { sessionId });
      await this.driver.executeScript(
        `document.querySelector('iframe[data-network-policy-probe]')?.remove();`,
      );
    }
  }

  private workerProbeScript(url: string): string {
    const source = `onmessage = ({ data }) => fetch(data).then(
      response => postMessage({ reached: true, status: response.status }),
      error => postMessage({ reached: false, error: String(error) }),
    );`;
    return `
      const workerUrl = URL.createObjectURL(new Blob(
        [${JSON.stringify(source)}], { type: 'text/javascript' },
      ));
      const worker = new Worker(workerUrl);
      return new Promise((resolve, reject) => {
        worker.onmessage = ({ data }) => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          resolve(data);
        };
        worker.onerror = event => reject(new Error(event.message));
        worker.postMessage(${JSON.stringify(url)});
      });
    `;
  }
}

export default NetworkPolicyPage;
