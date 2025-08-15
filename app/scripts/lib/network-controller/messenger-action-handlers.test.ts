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
    it('calls trackRpcEndpointEvent with the correct parameters', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(true);
      const trackEvent = jest.fn();

      onRpcEndpointUnavailable({
        chainId: '0xaa36a7',
        endpointUrl:
          'https://some-subdomain.infura.io/v3/the-infura-project-id',
        error: new HttpError(420),
        infuraProjectId: 'the-infura-project-id',
        trackEvent,
        metaMetricsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      expect(shouldCreateRpcServiceEventsMock).toHaveBeenCalledWith({
        endpointUrl:
          'https://some-subdomain.infura.io/v3/the-infura-project-id',
        error: new HttpError(420),
        infuraProjectId: 'the-infura-project-id',
        metaMetricsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });
    });
  });

  describe('if the Segment event should not be created', () => {
    it('does not call trackRpcEndpointEvent', () => {
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

      expect(shouldCreateRpcServiceEventsMock).toHaveBeenCalledWith({
        endpointUrl:
          'https://some-subdomain.infura.io/v3/the-infura-project-id',
        error: new Error('some error'),
        infuraProjectId: 'the-infura-project-id',
        metaMetricsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });
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
    it('calls trackRpcEndpointEvent with the correct parameters', () => {
      shouldCreateRpcServiceEventsMock.mockReturnValue(true);
      const trackEvent = jest.fn();

      onRpcEndpointDegraded({
        chainId: '0xaa36a7',
        endpointUrl:
          'https://some-subdomain.infura.io/v3/the-infura-project-id',
        error: new HttpError(420),
        infuraProjectId: 'the-infura-project-id',
        trackEvent,
        metaMetricsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });

      expect(shouldCreateRpcServiceEventsMock).toHaveBeenCalledWith({
        endpointUrl:
          'https://some-subdomain.infura.io/v3/the-infura-project-id',
        error: new HttpError(420),
        infuraProjectId: 'the-infura-project-id',
        metaMetricsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });
    });
  });

  describe('if the Segment event should not be created', () => {
    it('does not call trackRpcEndpointEvent', () => {
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

      expect(shouldCreateRpcServiceEventsMock).toHaveBeenCalledWith({
        endpointUrl:
          'https://some-subdomain.infura.io/v3/the-infura-project-id',
        error: new Error('some error'),
        infuraProjectId: 'the-infura-project-id',
        metaMetricsId:
          '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
      });
    });
  });
});
