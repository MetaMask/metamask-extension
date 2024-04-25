export interface Eip1193Provider {
  /**
   *  See [[link-eip-1193]] for details on this method.
   */
  request(request: {
    method: string;
    params?: Array<any> | Record<string, any>;
  }): Promise<any>;
}

export type Snap = {
  permissionName: string;
  id: string;
  version: string;
  initialPermissions: Record<string, unknown>;
};
export type GetSnapsResponse = Record<string, Snap>;

export const SNAP_ORIGIN = 'npm:@metamask/message-signing-snap';

const foundSnap = (snap: Snap) => snap.id === SNAP_ORIGIN;

export async function getSnaps() {
  const provider = await getMetaMaskProviderEIP6963();
  const result: GetSnapsResponse = await provider?.request({
    method: 'wallet_getSnaps',
  });

  return result;
}

export async function connectSnap() {
  const provider = await getMetaMaskProviderEIP6963();
  if (!provider) {
    throw new Error('No provider connected');
  }

  const result: string = await provider.request({
    method: 'wallet_requestSnaps',
    params: {
      [SNAP_ORIGIN]: {},
    },
  });

  return result;
}

export async function getSnap() {
  try {
    const snaps = await getSnaps();
    return Object.values(snaps ?? {}).find((snap) => foundSnap(snap));
  } catch (e) {
    console.error('Failed to obtain installed snap', e);
    return undefined;
  }
}

export const MESSAGE_SIGNING_SNAP = {
  async getPublicKey() {
    const provider = await getMetaMaskProviderEIP6963();
    const publicKey: string = await provider?.request({
      method: 'wallet_invokeSnap',
      params: { snapId: SNAP_ORIGIN, request: { method: 'getPublicKey' } },
    });

    return publicKey;
  },

  async signMessage(message: `metamask:${string}`) {
    const provider = await getMetaMaskProviderEIP6963();
    const signedMessage: string = await provider?.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: SNAP_ORIGIN,
        request: { method: 'signMessage', params: { message } },
      },
    });

    return signedMessage;
  },
};

// We can isolate and create a metamask function/closure
type AnnounceProviderEventDetail = {
  info?: { rdns?: string };
  provider?: Eip1193Provider;
};

const metamaskClientsRdns = {
  main: 'io.metamask',
  flask: 'io.metamask.flask',
  institutional: 'io.metamask.mmi',
};

type MetaMaskClientType = 'all' | keyof typeof metamaskClientsRdns;

// Cache, as when the function is recalled, we can reuse instead of continue waiting
const providerCache: Partial<Record<MetaMaskClientType, Eip1193Provider>> = {};

function getMetaMaskProviderEIP6963(
  type: MetaMaskClientType = 'all',
): Promise<Eip1193Provider | null> {
  return new Promise<Eip1193Provider | null>((res) => {
    const cachedProvider = providerCache[type];
    if (cachedProvider) {
      return res(cachedProvider);
    }

    const providers: Array<{ rdns: string; provider: Eip1193Provider }> = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handleProviderEvent(event: any) {
      const typedEvent: CustomEvent<AnnounceProviderEventDetail> = event;
      const providerDetail = typedEvent?.detail;
      if (providerDetail?.provider && providerDetail?.info?.rdns) {
        providers.push({
          rdns: providerDetail?.info?.rdns,
          provider: providerDetail?.provider,
        });
      }
    }
    window.addEventListener('eip6963:announceProvider', handleProviderEvent);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    /**
     * It may take some time for the events to be emitted from the different wallets.
     * So waiting a small period of time before we use the collected events.
     */
    setTimeout(() => {
      // remove attached listener
      window.removeEventListener(
        'eip6963:announceProvider',
        handleProviderEvent,
      );

      let provider: Eip1193Provider | null;
      if (type === 'all') {
        // return the first MM client we find
        const metamaskClients = Object.values(metamaskClientsRdns);
        provider =
          providers.find((p) => metamaskClients.includes(p.rdns))?.provider ??
          null;
      } else {
        const metamaskRdns = metamaskClientsRdns[type];
        provider =
          providers.find((p) => p.rdns === metamaskRdns)?.provider ?? null;
      }

      if (provider) {
        providerCache[type] = provider;
      }
      return res(provider);
    }, 100);
  });
}
