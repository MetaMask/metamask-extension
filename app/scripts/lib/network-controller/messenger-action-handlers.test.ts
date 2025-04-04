import { QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME } from '../../../../shared/constants/network';
import { onRpcEndpointUnavailable } from './messenger-action-handlers';

const QUICKNODE_MAINNET_URL = 'https://example.quicknode.com/mainnet';
const QUICKNODE_LINEA_MAINNET_URL =
  'https://example.quicknode.com/linea-mainnet';
const QUICKNODE_ARBITRUM_URL = 'https://example.quicknode.com/arbitrum';
const QUICKNODE_AVALANCHE_URL = 'https://example.quicknode.com/avalanche';
const QUICKNODE_OPTIMISM_URL = 'https://example.quicknode.com/optimism';
const QUICKNODE_POLYGON_URL = 'https://example.quicknode.com/polygon';
const QUICKNODE_BASE_URL = 'https://example.quicknode.com/base';

describe('onRpcEndpointUnavailable', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    process.env.QUICKNODE_MAINNET_URL = QUICKNODE_MAINNET_URL;
    process.env.QUICKNODE_LINEA_MAINNET_URL = QUICKNODE_LINEA_MAINNET_URL;
    process.env.QUICKNODE_ARBITRUM_URL = QUICKNODE_ARBITRUM_URL;
    process.env.QUICKNODE_AVALANCHE_URL = QUICKNODE_AVALANCHE_URL;
    process.env.QUICKNODE_OPTIMISM_URL = QUICKNODE_OPTIMISM_URL;
    process.env.QUICKNODE_POLYGON_URL = QUICKNODE_POLYGON_URL;
    process.env.QUICKNODE_BASE_URL = QUICKNODE_BASE_URL;
  });

  afterEach(() => {
    for (const key of new Set([
      ...Object.keys(originalEnv),
      ...Object.keys(process.env),
    ])) {
      if (originalEnv[key]) {
        process.env[key] = originalEnv[key];
      } else {
        delete process.env[key];
      }
    }
  });

  it('creates a Segment event if the endpoint is an Infura URL containing our API key and the error is not a connection error', () => {
    const infuraProjectId = 'the-infura-project-id';
    const trackEvent = jest.fn();

    onRpcEndpointUnavailable({
      chainId: '0xaa36a7',
      endpointUrl: `https://some-subdomain.infura.io/v3/${infuraProjectId}`,
      error: new Error('some error'),
      infuraProjectId,
      trackEvent,
    });

    expect(trackEvent).toHaveBeenCalledWith({
      category: 'Network',
      event: 'RPC Service Unavailable',
      properties: {
        chain_id_caip: 'eip155:11155111',
        rpc_endpoint_url: 'some-subdomain.infura.io',
      },
    });
  });

  it('does not create a Segment event if the endpoint is an Infura URL but does not contain our API key', () => {
    const trackEvent = jest.fn();

    onRpcEndpointUnavailable({
      chainId: '0xaa36a7',
      endpointUrl:
        'https://some-subdomain.infura.io/v3/different-infura-project-id',
      error: new Error('some error'),
      infuraProjectId: 'the-infura-project-id',
      trackEvent,
    });

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not create a Segment event if the endpoint is an Infura URL containing our API key but the error is a connection error', () => {
    const trackEvent = jest.fn();

    onRpcEndpointUnavailable({
      chainId: '0xaa36a7',
      endpointUrl: 'https://some-subdomain.infura.io/v3/the-infura-project-id',
      error: new TypeError('Failed to fetch'),
      infuraProjectId: 'the-infura-project-id',
      trackEvent,
    });

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('does not create a Segment event if the endpoint URL ends with infura.io, contains our API key, and the error is not a connection error', () => {
    const infuraProjectId = 'the-infura-project-id';
    const trackEvent = jest.fn();

    onRpcEndpointUnavailable({
      chainId: '0xaa36a7',
      endpointUrl: `https://someinfura.io/v3/${infuraProjectId}`,
      error: new Error('some error'),
      infuraProjectId,
      trackEvent,
    });

    expect(trackEvent).not.toHaveBeenCalled();
  });

  for (const [infuraNetwork, getQuicknodeEndpointUrl] of Object.entries(
    QUICKNODE_ENDPOINT_URLS_BY_INFURA_NETWORK_NAME,
  )) {
    describe(`for the Infura network ${infuraNetwork}`, () => {
      it(`creates a Segment event if the endpoint is a known Quicknode URL and the error is not a connection error`, () => {
        // We can assume this is set.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const endpointUrl = getQuicknodeEndpointUrl()!;
        const trackEvent = jest.fn();

        onRpcEndpointUnavailable({
          chainId: '0xaa36a7',
          endpointUrl,
          error: new Error('some error'),
          infuraProjectId: 'the-infura-project-id',
          trackEvent,
        });

        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Unavailable',
          properties: {
            chain_id_caip: 'eip155:11155111',
            rpc_endpoint_url: 'example.quicknode.com',
          },
        });
      });

      it(`creates a Segment event if the endpoint is a known Quicknode URL but the error is a connection error`, () => {
        // We can assume this is set.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const endpointUrl = getQuicknodeEndpointUrl()!;
        const trackEvent = jest.fn();

        onRpcEndpointUnavailable({
          chainId: '0xaa36a7',
          endpointUrl,
          error: new TypeError('Failed to fetch'),
          infuraProjectId: 'the-infura-project-id',
          trackEvent,
        });

        expect(trackEvent).not.toHaveBeenCalled();
      });
    });
  }

  it('does not create a Segment event given a non-Infura, non-Quicknode URL', () => {
    const trackEvent = jest.fn();

    onRpcEndpointUnavailable({
      chainId: '0xaa36a7',
      endpointUrl: 'http://some.custom.endpoint',
      error: new Error('some error'),
      infuraProjectId: 'the-infura-project-id',
      trackEvent,
    });

    expect(trackEvent).not.toHaveBeenCalled();
  });
});
