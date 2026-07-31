import { HttpError } from '@metamask/controller-utils';
import * as utilModule from '../util';
import {
  onRpcEndpointDegraded,
  onRpcEndpointUnavailable,
} from './messenger-action-handlers';
import * as networkControllerUtilsModule from './utils';

const mockTrackEvent = jest.fn();

jest.mock('../../controllers/analytics', () => ({
  createEventBuilder: jest.requireActual('../../controllers/analytics')
    .createEventBuilder,
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

describe('onRpcEndpointUnavailable', () => {
  let shouldCreateRpcServiceEventsMock: jest.SpyInstance<
    ReturnType<
      typeof networkControllerUtilsModule.shouldCreateRpcServiceEvents
    >,
    Parameters<typeof networkControllerUtilsModule.shouldCreateRpcServiceEvents>
  >;
  let isPublicEndpointUrlMock: jest.SpyInstance<
    ReturnType<typeof utilModule.isPublicEndpointUrl>,
    Parameters<typeof utilModule.isPublicEndpointUrl>
  >;

  beforeEach(() => {
    mockTrackEvent.mockClear();
    shouldCreateRpcServiceEventsMock = jest.spyOn(
      networkControllerUtilsModule,
      'shouldCreateRpcServiceEvents',
    );

    isPublicEndpointUrlMock = jest.spyOn(utilModule, 'isPublicEndpointUrl');
  });

  it('calls shouldCreateRpcServiceEvents with the correct parameters', () => {
    shouldCreateRpcServiceEventsMock.mockReturnValue(true);
    isPublicEndpointUrlMock.mockReturnValue(true);

    onRpcEndpointUnavailable({
      chainId: '0xaa36a7',
      endpointUrl: 'https://example.com',
      error: new HttpError(420),
      infuraProjectId: 'the-infura-project-id',
      analyticsId:
        '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
    });

    expect(shouldCreateRpcServiceEventsMock).toHaveBeenCalledWith({
      error: new HttpError(420),
      analyticsId:
        '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
    });
  });

  describe('if the Segment event should be created', () => {
    it('calls trackEvent with the correct parameters', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(true);
      isPublicEndpointUrlMock.mockReturnValue(true);

      onRpcEndpointUnavailable({
        chainId: '0xaa36a7',
        endpointUrl: 'https://example.com',
        error: undefined,
        infuraProjectId: 'the-infura-project-id',
        analyticsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      // The names of Segment properties have a particular case.
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'RPC Service Unavailable',
          properties: {
            category: 'Network',
            chain_id_caip: 'eip155:11155111',
            rpc_domain: 'example.com',
            rpc_endpoint_url: 'example.com',
          },
          sensitiveProperties: {},
        }),
      );
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    it('captures the HTTP status in the error if present', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(true);
      isPublicEndpointUrlMock.mockReturnValue(true);

      onRpcEndpointUnavailable({
        chainId: '0xaa36a7',
        endpointUrl: 'https://example.com',
        error: new HttpError(420),
        infuraProjectId: 'the-infura-project-id',
        analyticsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      // The names of Segment properties have a particular case.
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'RPC Service Unavailable',
          properties: {
            category: 'Network',
            chain_id_caip: 'eip155:11155111',
            http_status: 420,
            rpc_domain: 'example.com',
            rpc_endpoint_url: 'example.com',
          },
        }),
      );
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    it('anonymizes the endpoint URL if it is a custom endpoint', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(true);
      isPublicEndpointUrlMock.mockReturnValue(false);

      onRpcEndpointUnavailable({
        chainId: '0xaa36a7',
        endpointUrl: 'https://custom-endpoint.com',
        error: undefined,
        infuraProjectId: 'the-infura-project-id',
        analyticsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      // The names of Segment properties have a particular case.
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'RPC Service Unavailable',
          properties: {
            category: 'Network',
            chain_id_caip: 'eip155:11155111',
            rpc_domain: 'custom',
            rpc_endpoint_url: 'custom',
          },
        }),
      );
      /* eslint-enable @typescript-eslint/naming-convention */
    });
  });

  describe('if the Segment event should not be created', () => {
    it('does not call trackEvent', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(false);

      onRpcEndpointUnavailable({
        chainId: '0xaa36a7',
        endpointUrl: 'https://example.com',
        error: new Error('some error'),
        infuraProjectId: 'the-infura-project-id',
        analyticsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      expect(mockTrackEvent).not.toHaveBeenCalled();
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
  let isPublicEndpointUrlMock: jest.SpyInstance<
    ReturnType<typeof utilModule.isPublicEndpointUrl>,
    Parameters<typeof utilModule.isPublicEndpointUrl>
  >;

  beforeEach(() => {
    mockTrackEvent.mockClear();
    shouldCreateRpcServiceEventsMock = jest.spyOn(
      networkControllerUtilsModule,
      'shouldCreateRpcServiceEvents',
    );

    isPublicEndpointUrlMock = jest.spyOn(utilModule, 'isPublicEndpointUrl');
  });

  it('calls shouldCreateRpcServiceEvents with the correct parameters', () => {
    shouldCreateRpcServiceEventsMock.mockReturnValue(true);
    isPublicEndpointUrlMock.mockReturnValue(true);

    onRpcEndpointDegraded({
      chainId: '0xaa36a7',
      endpointUrl: 'https://example.com',
      error: new HttpError(420),
      infuraProjectId: 'the-infura-project-id',
      rpcMethodName: 'eth_blockNumber',
      type: 'retries_exhausted',
      retryReason: 'non_successful_http_status',
      analyticsId:
        '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
    });

    expect(shouldCreateRpcServiceEventsMock).toHaveBeenCalledWith({
      error: new HttpError(420),
      analyticsId:
        '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
    });
  });

  describe('if the Segment event should be created', () => {
    it('calls trackEvent with the correct parameters', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(true);
      isPublicEndpointUrlMock.mockReturnValue(true);

      onRpcEndpointDegraded({
        chainId: '0xaa36a7',
        endpointUrl: 'https://example.com',
        error: undefined,
        infuraProjectId: 'the-infura-project-id',
        rpcMethodName: 'eth_blockNumber',
        type: 'slow_success',
        analyticsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      // The names of Segment properties have a particular case.
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'RPC Service Degraded',
          properties: {
            category: 'Network',
            chain_id_caip: 'eip155:11155111',
            type: 'slow_success',
            rpc_domain: 'example.com',
            rpc_endpoint_url: 'example.com',
            rpc_method_name: 'eth_blockNumber',
          },
        }),
      );
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    it('captures the HTTP status in the error if present', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(true);
      isPublicEndpointUrlMock.mockReturnValue(true);

      onRpcEndpointDegraded({
        chainId: '0xaa36a7',
        endpointUrl: 'https://example.com',
        error: new HttpError(420),
        infuraProjectId: 'the-infura-project-id',
        rpcMethodName: 'eth_blockNumber',
        type: 'retries_exhausted',
        retryReason: 'non_successful_http_status',
        analyticsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      // The names of Segment properties have a particular case.
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'RPC Service Degraded',
          properties: {
            category: 'Network',
            chain_id_caip: 'eip155:11155111',
            type: 'retries_exhausted',
            http_status: 420,
            retry_reason: 'non_successful_http_status',
            rpc_domain: 'example.com',
            rpc_endpoint_url: 'example.com',
            rpc_method_name: 'eth_blockNumber',
          },
        }),
      );
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    it('anonymizes the endpoint URL if it is a custom endpoint', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(true);
      isPublicEndpointUrlMock.mockReturnValue(false);

      onRpcEndpointDegraded({
        chainId: '0xaa36a7',
        endpointUrl: 'https://custom-endpoint.com',
        error: undefined,
        infuraProjectId: 'the-infura-project-id',
        rpcMethodName: 'eth_blockNumber',
        type: 'slow_success',
        analyticsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      // The names of Segment properties have a particular case.
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'RPC Service Degraded',
          properties: {
            category: 'Network',
            chain_id_caip: 'eip155:11155111',
            type: 'slow_success',
            rpc_domain: 'custom',
            rpc_endpoint_url: 'custom',
            rpc_method_name: 'eth_blockNumber',
          },
        }),
      );
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    it('includes duration_ms and trace_id when present in the payload', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(true);
      isPublicEndpointUrlMock.mockReturnValue(true);

      onRpcEndpointDegraded({
        chainId: '0xaa36a7',
        duration: 5123,
        endpointUrl: 'https://example.com',
        error: undefined,
        infuraProjectId: 'the-infura-project-id',
        rpcMethodName: 'eth_blockNumber',
        traceId: 'abc-123-trace',
        type: 'slow_success',
        analyticsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      // The names of Segment properties have a particular case.
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'RPC Service Degraded',
          properties: {
            category: 'Network',
            chain_id_caip: 'eip155:11155111',
            type: 'slow_success',
            rpc_domain: 'example.com',
            rpc_endpoint_url: 'example.com',
            rpc_method_name: 'eth_blockNumber',
            duration_ms: 5123,
            trace_id: 'abc-123-trace',
          },
        }),
      );
      /* eslint-enable @typescript-eslint/naming-convention */
    });
  });

  describe('if the Segment event should not be created', () => {
    it('does not call trackEvent', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(false);

      onRpcEndpointDegraded({
        chainId: '0xaa36a7',
        endpointUrl: 'https://example.com',
        error: new Error('some error'),
        infuraProjectId: 'the-infura-project-id',
        rpcMethodName: 'eth_blockNumber',
        type: 'retries_exhausted',
        analyticsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });
  });
});
