import type { BrazeWorkerCommand, BrazeWorkerRequest } from '../braze/protocol';

const send = globalThis.postMessage.bind(globalThis);
const timeout = globalThis.setTimeout.bind(globalThis);
const interval = globalThis.setInterval.bind(globalThis);
const requests = new Map<number, (status: number) => void>();
let requestId = 0;

class BrazeXMLHttpRequest {
  status = 0;

  responseText = '';

  readyState = 0;

  onload?: () => void;

  onerror?: () => void;

  #method = '';

  #url = '';

  open(method: string, url: string) {
    this.#method = method;
    this.#url = url;
  }

  setRequestHeader() {
    // The broker supplies all headers.
  }

  getAllResponseHeaders() {
    return '';
  }

  send(body: unknown) {
    requestId += 1;
    const id = requestId;
    if (typeof body !== 'string' || body.length > 4096 || requests.size >= 4) {
      timeout(() => this.#complete(0), 0);
      return;
    }
    requests.set(id, (status) => this.#complete(status));
    send({
      id,
      method: this.#method,
      url: this.#url,
      body,
    } satisfies BrazeWorkerRequest);
  }

  #complete(status: number) {
    this.status = status;
    this.responseText = status ? '{}' : '';
    this.readyState = 4;
    if (status) {
      this.onload?.();
    } else {
      this.onerror?.();
    }
  }
}

/** Install inert browser stand-ins before evaluating the SDK module. */
function installBrowserShims() {
  const page = Object.freeze({
    href: 'https://metamask.invalid/',
    hostname: 'metamask.invalid',
    protocol: 'https:',
    pathname: '/',
  });
  const storage = new Map<string, string>();
  const noop = () => undefined;
  const shims = {
    location: page,
    navigator: Object.freeze({ userAgent: '', language: 'en' }),
    screen: Object.freeze({ width: 0, height: 0 }),
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: noop,
    CustomEvent: class {},
    setTimeout: (callback: () => void, delay?: number) =>
      timeout(() => callback(), delay),
    setInterval: (callback: () => void, delay?: number) =>
      interval(() => callback(), delay),
    localStorage: Object.freeze({
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, String(value)),
      removeItem: (key: string) => storage.delete(key),
    }),
    document: {
      get cookie() {
        return '';
      },
      set cookie(_value: string) {
        // Never store cookies.
      },
      location: page,
      addEventListener: noop,
      removeEventListener: noop,
      querySelectorAll: () => [],
      getElementsByClassName: () => [],
      createElement(tag: string) {
        if (tag !== 'a') {
          throw new Error('Unsupported Braze SDK element');
        }
        let parsed = new URL(page.href);
        return {
          set href(value: string) {
            parsed = new URL(value, page.href);
          },
          get href() {
            return parsed.href;
          },
          get pathname() {
            return parsed.pathname;
          },
          toString() {
            return parsed.href;
          },
        };
      },
    },
    XMLHttpRequest: BrazeXMLHttpRequest,
  };
  for (const [name, value] of Object.entries(shims)) {
    Object.defineProperty(globalThis, name, { value });
  }
  if (typeof window === 'undefined') {
    Object.defineProperty(globalThis, 'window', { value: shims });
  }
}

let started = false;
globalThis.onmessage = ({ data }: MessageEvent<BrazeWorkerCommand>) => {
  if (data.type === 'response') {
    const complete = requests.get(data.id);
    requests.delete(data.id);
    complete?.(data.status);
  } else if (data.type === 'start' && !started) {
    started = true;
    installBrowserShims();
    const { apiKey, endpoint, profile } = data;
    import('@braze/web-sdk')
      .then((braze) => {
        if (
          !braze.initialize(apiKey, {
            baseUrl: endpoint,
            noCookies: true,
            doNotLoadFontAwesome: true,
            allowUserSuppliedJavascript: false,
            manageServiceWorkerExternally: true,
            disablePushTokenMaintenance: true,
          })
        ) {
          send({ type: 'failed' });
          return;
        }
        braze.changeUser(profile);
      })
      .catch(() => send({ type: 'failed' }));
  }
};
