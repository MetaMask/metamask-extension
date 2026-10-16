import { Messenger } from '@metamask/messenger';
import { JsonRpcError } from '@metamask/rpc-errors';
import browserApi from 'webextension-polyfill';
import {
  getRpcValidationFetchUrl,
  RPC_VALIDATION_PAGE,
  RPC_VALIDATION_PORT,
  type RpcValidationResponse,
} from '../../../shared/lib/rpc-endpoint-validation';

export type RpcEndpointValidationServiceMessenger = Messenger<
  'RpcEndpointValidationService',
  never,
  never
>;

type Options = {
  messenger: RpcEndpointValidationServiceMessenger;
  allowRpcValidation?: (details: {
    tabId: number;
    url: string;
  }) => Promise<() => Promise<void>>;
  browser?: {
    runtime: Pick<typeof chrome.runtime, 'id' | 'getURL' | 'onConnect'>;
    tabs: { remove: (tabId: number) => Promise<void> };
  };
};

/**
 * Validates a user-selected RPC in an isolated tab. No general-purpose network
 * capability, request options, raw response, or policy mutation reaches the UI.
 */
export class RpcEndpointValidationService {
  readonly name = 'RpcEndpointValidationService';

  readonly state = null;

  readonly #browser: NonNullable<Options['browser']>;

  readonly #allowRpcValidation: Options['allowRpcValidation'];

  #queue: Promise<unknown> = Promise.resolve();

  #pending = 0;

  constructor({
    browser = (globalThis.browser ??
      globalThis.chrome) as unknown as NonNullable<Options['browser']>,
    allowRpcValidation,
  }: Options) {
    this.#browser = browser;
    this.#allowRpcValidation = allowRpcValidation;
  }

  /**
   * Read only eth_chainId from the URL selected in a trusted network form.
   *
   * @param url - The user's candidate RPC endpoint URL.
   * @returns Its validated chain ID.
   */
  async validateRpcEndpoint(url: string): Promise<string> {
    const fetchUrl = getRpcValidationFetchUrl(url);
    if (this.#pending >= 3) {
      throw new Error('RPC endpoint validation is already in progress.');
    }
    this.#pending += 1;
    const validation = this.#queue.then(() => this.#validate(url, fetchUrl));
    // Serialize brokers so normal form updates cannot leave concurrent tabs or
    // grant a shared temporary URL exception to another extension context.
    this.#queue = validation.catch(() => undefined);
    try {
      return await validation;
    } finally {
      this.#pending -= 1;
    }
  }

  async #validate(url: string, fetchUrl: string): Promise<string> {
    const { runtime, tabs } = this.#browser;
    const pageUrl = runtime.getURL(
      `${RPC_VALIDATION_PAGE}#${crypto.randomUUID()}`,
    );
    let resolvePort: (port: chrome.runtime.Port) => void;
    const connection = new Promise<chrome.runtime.Port>((resolve) => {
      resolvePort = resolve;
    });
    const onConnect = (port: chrome.runtime.Port) => {
      if (
        port.name === RPC_VALIDATION_PORT &&
        port.sender?.id === runtime.id &&
        port.sender.url === pageUrl &&
        port.sender.frameId === 0
      ) {
        resolvePort(port);
      }
    };
    runtime.onConnect.addListener(onConnect);

    let tabId: number | undefined;
    let brokerPort: chrome.runtime.Port | undefined;
    let revokePermission: (() => Promise<void>) | undefined;
    try {
      const tab = await browserApi.tabs.create({ url: pageUrl, active: false });
      tabId = tab.id;
      if (tabId === undefined) {
        throw new Error('Cannot open the RPC validation context.');
      }
      brokerPort = await waitForBroker(connection, 5_000);
      if (brokerPort.sender?.tab?.id !== tabId) {
        throw new Error('Invalid RPC validation context.');
      }

      revokePermission = await this.#allowRpcValidation?.({
        tabId,
        url: fetchUrl,
      });
      const response = new Promise<RpcValidationResponse>((resolve, reject) => {
        brokerPort?.onMessage.addListener(resolve);
        brokerPort?.onDisconnect.addListener(() =>
          reject(new Error('RPC validation context closed.')),
        );
      });
      brokerPort.postMessage({ url });
      const result = await waitForBroker(response, 12_000);
      if (
        result &&
        'chainId' in result &&
        typeof result.chainId === 'string' &&
        result.chainId.length <= 66 &&
        /^0x(?:0|[1-9a-f][0-9a-f]*)$/iu.test(result.chainId)
      ) {
        return result.chainId;
      }
      const error = result && 'error' in result ? result.error : undefined;
      throw new JsonRpcError(-32603, 'RPC endpoint validation failed.', {
        ...(typeof error?.code === 'number' ? { code: error.code } : {}),
        ...(typeof error?.httpStatus === 'number'
          ? { httpStatus: error.httpStatus }
          : {}),
      });
    } finally {
      runtime.onConnect.removeListener(onConnect);
      brokerPort?.disconnect();
      // Closing the tab first removes the only context to which the temporary
      // permission applies, even if browser rule cleanup subsequently fails.
      try {
        if (tabId !== undefined) {
          await tabs.remove(tabId).catch(() => undefined);
        }
      } finally {
        await revokePermission?.();
      }
    }
  }
}

/**
 * Bound the lifetime of a broker connection without racing policy mutations.
 *
 * @param result - A broker connection or response.
 * @param timeoutMs - Maximum time to wait.
 * @returns The broker result.
 */
async function waitForBroker<Result>(
  result: Promise<Result>,
  timeoutMs: number,
): Promise<Result> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      result,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error('RPC endpoint validation timed out.')),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
