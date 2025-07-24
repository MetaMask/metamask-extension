import { JsonRpcError } from '@metamask/rpc-errors';
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
      it('creates a Segment event for a JSON-RPC error, hiding the API from the URL and including the HTTP status code and error code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointUnavailable({
          chainId: '0xaa36a7',
          endpointUrl:
            'https://some-subdomain.infura.io/v3/the-infura-project-id',
          error: new JsonRpcError(-34000, 'Some error', {
            httpStatus: 420,
          }),
          infuraProjectId: 'the-infura-project-id',
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Unavailable',
          properties: {
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id_caip: 'eip155:11155111',
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            http_status_code: 420,
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            rpc_endpoint_url: 'some-subdomain.infura.io',
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            rpc_error_code: -34000,
          },
        });
      });
    });

    describe('when the error is not a JSON-RPC error', () => {
      it('creates a Segment event, hiding the API from the URL and not including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointUnavailable({
          chainId: '0xaa36a7',
          endpointUrl:
            'https://some-subdomain.infura.io/v3/the-infura-project-id',
          error: new Error('some error'),
          infuraProjectId: 'the-infura-project-id',
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Unavailable',
          properties: {
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id_caip: 'eip155:11155111',
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            rpc_endpoint_url: 'some-subdomain.infura.io',
          },
        });
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
        infuraProjectId: 'the-infura-project-id',
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
      it('creates a Segment event, hiding the API from the URL and including the HTTP status code and error code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl:
            'https://some-subdomain.infura.io/v3/the-infura-project-id',
          error: new JsonRpcError(-34000, 'Some error', {
            httpStatus: 420,
          }),
          infuraProjectId: 'the-infura-project-id',
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id_caip: 'eip155:11155111',
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            http_status_code: 420,
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            rpc_endpoint_url: 'some-subdomain.infura.io',
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            rpc_error_code: -34000,
          },
        });
      });
    });

    describe('when the error is not a JSON-RPC error', () => {
      it('creates a Segment event, hiding the API from the URL and not including the HTTP status code', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl:
            'https://some-subdomain.infura.io/v3/the-infura-project-id',
          error: new Error('some error'),
          infuraProjectId: 'the-infura-project-id',
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id_caip: 'eip155:11155111',
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            rpc_endpoint_url: 'some-subdomain.infura.io',
          },
        });
      });
    });

    describe('when there is no error', () => {
      it('creates a Segment event, hiding the API from the URL', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl:
            'https://some-subdomain.infura.io/v3/the-infura-project-id',
          error: undefined,
          infuraProjectId: 'the-infura-project-id',
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id_caip: 'eip155:11155111',
            // The case is intentional here.
            // eslint-disable-next-line @typescript-eslint/naming-convention
            rpc_endpoint_url: 'some-subdomain.infura.io',
          },
        });
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
        infuraProjectId: 'the-infura-project-id',
        trackEvent,
        metaMetricsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      expect(trackEvent).not.toHaveBeenCalled();
    });
  });
});
