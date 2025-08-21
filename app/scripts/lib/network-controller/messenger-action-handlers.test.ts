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

  it('calls shouldCreateRpcServiceEvents with the correct parameters', () => {
    shouldCreateRpcServiceEventsMock.mockReturnValue(true);
    const trackEvent = jest.fn();

    onRpcEndpointUnavailable({
      chainId: '0xaa36a7',
      endpointUrl: 'https://example.com',
      error: new HttpError(420),
      infuraProjectId: 'the-infura-project-id',
      trackEvent,
      metaMetricsId:
        '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
    });

    expect(shouldCreateRpcServiceEventsMock).toHaveBeenCalledWith({
      endpointUrl: 'https://example.com',
      error: new HttpError(420),
      infuraProjectId: 'the-infura-project-id',
      metaMetricsId:
        '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
    });
  });

  describe('if the Segment event should be created', () => {
    it('calls trackEvent with the correct parameters', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(true);
      const trackEvent = jest.fn();

      onRpcEndpointUnavailable({
        chainId: '0xaa36a7',
        endpointUrl: 'https://example.com',
        error: undefined,
        infuraProjectId: 'the-infura-project-id',
        trackEvent,
        metaMetricsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      // The names of Segment properties have a particular case.
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(trackEvent).toHaveBeenCalledWith({
        category: 'Network',
        event: 'RPC Service Unavailable',
        properties: {
          chain_id_caip: 'eip155:11155111',
          rpc_endpoint_url: 'example.com',
        },
      });
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    it('captures the HTTP status in the error if present', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(true);
      const trackEvent = jest.fn();

      onRpcEndpointUnavailable({
        chainId: '0xaa36a7',
        endpointUrl: 'https://example.com',
        error: new HttpError(420),
        infuraProjectId: 'the-infura-project-id',
        trackEvent,
        metaMetricsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      // The names of Segment properties have a particular case.
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(trackEvent).toHaveBeenCalledWith({
        category: 'Network',
        event: 'RPC Service Unavailable',
        properties: {
          chain_id_caip: 'eip155:11155111',
          http_status: 420,
          rpc_endpoint_url: 'example.com',
        },
      });
      /* eslint-enable @typescript-eslint/naming-convention */
    });
  });

  describe('if the Segment event should not be created', () => {
    it('does not call trackEvent', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(false);
      const trackEvent = jest.fn();

      onRpcEndpointUnavailable({
        chainId: '0xaa36a7',
        endpointUrl: 'https://example.com',
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

  it('calls shouldCreateRpcServiceEvents with the correct parameters', () => {
    shouldCreateRpcServiceEventsMock.mockReturnValue(true);
    const trackEvent = jest.fn();

    onRpcEndpointDegraded({
      chainId: '0xaa36a7',
      endpointUrl: 'https://example.com',
      error: new HttpError(420),
      infuraProjectId: 'the-infura-project-id',
      trackEvent,
      metaMetricsId:
        '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
    });

    expect(shouldCreateRpcServiceEventsMock).toHaveBeenCalledWith({
      endpointUrl: 'https://example.com',
      error: new HttpError(420),
      infuraProjectId: 'the-infura-project-id',
      metaMetricsId:
        '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
    });
  });

  describe('if the Segment event should be created', () => {
    it('calls trackEvent with the correct parameters', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(true);
      const trackEvent = jest.fn();

      onRpcEndpointDegraded({
        chainId: '0xaa36a7',
        endpointUrl: 'https://example.com',
        error: undefined,
        infuraProjectId: 'the-infura-project-id',
        trackEvent,
        metaMetricsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      // The names of Segment properties have a particular case.
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(trackEvent).toHaveBeenCalledWith({
        category: 'Network',
        event: 'RPC Service Degraded',
        properties: {
          chain_id_caip: 'eip155:11155111',
          rpc_endpoint_url: 'example.com',
        },
      });
      /* eslint-enable @typescript-eslint/naming-convention */
    });

    it('captures the HTTP status in the error if present', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(true);
      const trackEvent = jest.fn();

      onRpcEndpointDegraded({
        chainId: '0xaa36a7',
        endpointUrl: 'https://example.com',
        error: new HttpError(420),
        infuraProjectId: 'the-infura-project-id',
        trackEvent,
        metaMetricsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      // The names of Segment properties have a particular case.
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(trackEvent).toHaveBeenCalledWith({
        category: 'Network',
        event: 'RPC Service Degraded',
        properties: {
          chain_id_caip: 'eip155:11155111',
          http_status: 420,
          rpc_endpoint_url: 'example.com',
        },
      });
      /* eslint-enable @typescript-eslint/naming-convention */
    });
  });

  describe('if the Segment event should not be created', () => {
    it('does not call trackEvent', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(false);
      const trackEvent = jest.fn();

      onRpcEndpointDegraded({
        chainId: '0xaa36a7',
        endpointUrl: 'https://example.com',
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
