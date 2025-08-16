import { HttpError } from '@metamask/controller-utils';
import {
  onRpcEndpointDegraded,
  onRpcEndpointUnavailable,
} from './messenger-action-handlers';
import * as networkControllerUtilsModule from './utils';

describe('onRpcEndpointUnavailable', () => {
  let shouldCreateRpcServiceEventsMock: jest.SpyInstance<
    ReturnType<
      typeof networkControllerUtilsModule.shouldCreateRpcServiceEvents
    >,
    Parameters<typeof networkControllerUtilsModule.shouldCreateRpcServiceEvents>
  >;

  beforeEach(() => {
    shouldCreateRpcServiceEventsMock = jest.spyOn(
      networkControllerUtilsModule,
      'shouldCreateRpcServiceEvents',
    );
  });

  describe('if the Segment event should be created', () => {
    describe('if the error is a JSON-RPC error', () => {
      it('creates a Segment event given an Infura endpoint URL, removing the path and including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointUnavailable({
          chainId: '0xaa36a7',
          endpointUrl:
            'https://some-subdomain.infura.io/v3/the-infura-project-id',
          error: new HttpError(420),
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Unavailable',
          properties: {
            chain_id_caip: 'eip155:11155111',
            http_status: 420,
            rpc_endpoint_url: 'some-subdomain.infura.io',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });

      it('creates a Segment event given a custom endpoint URL, removing the path and including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointUnavailable({
          chainId: '0xaa36a7',
          endpointUrl: 'https://flare-api.flare.network/ext/C/rpc',
          error: new HttpError(420),
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Unavailable',
          properties: {
            chain_id_caip: 'eip155:11155111',
            http_status: 420,
            rpc_endpoint_url: 'flare-api.flare.network',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });

      it('creates a Segment event given a Quicknode endpoint URL, removing the path and including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointUnavailable({
          chainId: '0xaa36a7',
          endpointUrl: 'https://some-subdomain.quiknode.pro/abc123456',
          error: new HttpError(420),
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Unavailable',
          properties: {
            chain_id_caip: 'eip155:11155111',
            http_status: 420,
            rpc_endpoint_url: 'some-subdomain.quiknode.pro',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });
    });

    describe('when the error is not a JSON-RPC error', () => {
      it('creates a Segment event given an Infura endpoint URL, removing the path and not including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointUnavailable({
          chainId: '0xaa36a7',
          endpointUrl:
            'https://some-subdomain.infura.io/v3/the-infura-project-id',
          error: new Error('some error'),
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Unavailable',
          properties: {
            chain_id_caip: 'eip155:11155111',
            rpc_endpoint_url: 'some-subdomain.infura.io',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });

      it('creates a Segment event given a custom endpoint URL, removing the path and not including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointUnavailable({
          chainId: '0xaa36a7',
          endpointUrl: 'https://flare-api.flare.network/ext/C/rpc',
          error: new Error('some error'),
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Unavailable',
          properties: {
            chain_id_caip: 'eip155:11155111',
            rpc_endpoint_url: 'flare-api.flare.network',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });

      it('creates a Segment event given a Quicknode endpoint URL, removing the path and not including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointUnavailable({
          chainId: '0xaa36a7',
          endpointUrl: 'https://some-subdomain.quiknode.pro/abc123456',
          error: new Error('some error'),
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Unavailable',
          properties: {
            chain_id_caip: 'eip155:11155111',
            rpc_endpoint_url: 'some-subdomain.quiknode.pro',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });
    });
  });

  describe('if the Segment event should not be created', () => {
    it('does not create a Segment event', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(false);
      const trackEvent = jest.fn();

      onRpcEndpointUnavailable({
        chainId: '0xaa36a7',
        endpointUrl:
          'https://some-subdomain.infura.io/v3/the-infura-project-id',
        error: new Error('some error'),
        trackEvent,
        metaMetricsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      expect(trackEvent).not.toHaveBeenCalled();
    });
  });
});

describe('onRpcEndpointDegraded', () => {
  let shouldCreateRpcServiceEventsMock: jest.SpyInstance<
    ReturnType<
      typeof networkControllerUtilsModule.shouldCreateRpcServiceEvents
    >,
    Parameters<typeof networkControllerUtilsModule.shouldCreateRpcServiceEvents>
  >;

  beforeEach(() => {
    shouldCreateRpcServiceEventsMock = jest.spyOn(
      networkControllerUtilsModule,
      'shouldCreateRpcServiceEvents',
    );
  });

  describe('if the Segment event should be created', () => {
    describe('when the error is a JSON-RPC error', () => {
      it('creates a Segment event given an Infura endpoint URL, removing the path and including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl:
            'https://some-subdomain.infura.io/v3/the-infura-project-id',
          error: new HttpError(420),
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            chain_id_caip: 'eip155:11155111',
            http_status: 420,
            rpc_endpoint_url: 'some-subdomain.infura.io',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });

      it('creates a Segment event given a custom endpoint URL, removing the path and including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl: 'https://flare-api.flare.network/ext/C/rpc',
          error: new HttpError(420),
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            chain_id_caip: 'eip155:11155111',
            http_status: 420,
            rpc_endpoint_url: 'flare-api.flare.network',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });

      it('creates a Segment event given a Quicknode endpoint URL, removing the path and including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl: 'https://some-subdomain.quiknode.pro/abc123456',
          error: new HttpError(420),
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            chain_id_caip: 'eip155:11155111',
            http_status: 420,
            rpc_endpoint_url: 'some-subdomain.quiknode.pro',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });
    });

    describe('when the error is not a JSON-RPC error', () => {
      it('creates a Segment event given an Infura endpoint URL, removing the path and not including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl:
            'https://some-subdomain.infura.io/v3/the-infura-project-id',
          error: new Error('some error'),
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            chain_id_caip: 'eip155:11155111',
            rpc_endpoint_url: 'some-subdomain.infura.io',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });

      it('creates a Segment event given a custom endpoint URL, removing the path and not including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl: 'https://flare-api.flare.network/ext/C/rpc',
          error: new Error('some error'),
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            chain_id_caip: 'eip155:11155111',
            rpc_endpoint_url: 'flare-api.flare.network',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });

      it('creates a Segment event given a Quicknode endpoint URL, removing the path and not including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl: 'https://some-subdomain.quiknode.pro/abc123456',
          error: new Error('some error'),
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            chain_id_caip: 'eip155:11155111',
            rpc_endpoint_url: 'some-subdomain.quiknode.pro',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });
    });

    describe('when there is no error', () => {
      it('creates a Segment event given an Infura endpoint URL, removing the path', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl:
            'https://some-subdomain.infura.io/v3/the-infura-project-id',
          error: undefined,
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            chain_id_caip: 'eip155:11155111',
            rpc_endpoint_url: 'some-subdomain.infura.io',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });

      it('creates a Segment event given a custom endpoint URL, removing the path', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl: 'https://flare-api.flare.network/ext/C/rpc',
          error: undefined,
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            chain_id_caip: 'eip155:11155111',
            rpc_endpoint_url: 'flare-api.flare.network',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });

      it('creates a Segment event given a Quicknode endpoint URL, removing the path', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl: 'https://some-subdomain.quiknode.pro/abc123456',
          error: undefined,
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        // The case of the Segment properties are intentional.
        /* eslint-disable @typescript-eslint/naming-convention */
        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            chain_id_caip: 'eip155:11155111',
            rpc_endpoint_url: 'some-subdomain.quiknode.pro',
          },
        });
        /* eslint-enable @typescript-eslint/naming-convention */
      });
    });
  });

  describe('if the Segment event should not be created', () => {
    it('does not create a Segment event', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(false);
      const trackEvent = jest.fn();

      onRpcEndpointDegraded({
        chainId: '0xaa36a7',
        endpointUrl:
          'https://some-subdomain.infura.io/v3/the-infura-project-id',
        error: new Error('some error'),
        trackEvent,
        metaMetricsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      expect(trackEvent).not.toHaveBeenCalled();
    });
  });
});
