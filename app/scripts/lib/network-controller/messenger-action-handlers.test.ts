import {
  onRpcEndpointDegraded,
  onRpcEndpointUnavailable,
} from './messenger-action-handlers';
import * as networkControllerUtilsModule from './utils';

describe('onRpcEndpointUnavailable', () => {
  let getIsOurInfuraEndpointUrlMock: jest.SpyInstance<
    ReturnType<typeof networkControllerUtilsModule.getIsOurInfuraEndpointUrl>,
    Parameters<typeof networkControllerUtilsModule.getIsOurInfuraEndpointUrl>
  >;
  let getIsQuicknodeEndpointUrlMock: jest.SpyInstance<
    ReturnType<typeof networkControllerUtilsModule.getIsQuicknodeEndpointUrl>,
    Parameters<typeof networkControllerUtilsModule.getIsQuicknodeEndpointUrl>
  >;
  let shouldCreateRpcServiceEventsMock: jest.SpyInstance<
    ReturnType<
      typeof networkControllerUtilsModule.shouldCreateRpcServiceEvents
    >,
    Parameters<typeof networkControllerUtilsModule.shouldCreateRpcServiceEvents>
  >;

  beforeEach(() => {
    getIsOurInfuraEndpointUrlMock = jest
      .spyOn(networkControllerUtilsModule, 'getIsOurInfuraEndpointUrl')
      .mockReturnValue(false);
    getIsQuicknodeEndpointUrlMock = jest
      .spyOn(networkControllerUtilsModule, 'getIsQuicknodeEndpointUrl')
      .mockReturnValue(false);
    shouldCreateRpcServiceEventsMock = jest
      .spyOn(networkControllerUtilsModule, 'shouldCreateRpcServiceEvents')
      .mockReturnValue(false);
  });

  describe('if the Segment event should be created', () => {
    describe('if the endpoint is an Infura URL using our API key', () => {
      describe('if the error is a connection error', () => {
        it('does not create a Segment event', () => {
          shouldCreateRpcServiceEventsMock.mockReturnValue(true);
          getIsOurInfuraEndpointUrlMock.mockReturnValue(true);
          const trackEvent = jest.fn();

          onRpcEndpointUnavailable({
            chainId: '0xaa36a7',
            endpointUrl: 'https://endpoint.url',
            error: new TypeError('Failed to fetch'),
            infuraProjectId: 'the-infura-project-id',
            trackEvent,
            metaMetricsId:
              '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
          });

          expect(trackEvent).not.toHaveBeenCalled();
        });
      });

      describe('if the error is not a connection error', () => {
        it('creates a Segment event, hiding the API from the URL', () => {
          shouldCreateRpcServiceEventsMock.mockReturnValue(true);
          getIsOurInfuraEndpointUrlMock.mockReturnValue(true);
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
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id_caip: 'eip155:11155111',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              rpc_endpoint_url: 'some-subdomain.infura.io',
            },
          });
        });
      });
    });

    describe('if the endpoint is a Quicknode URL', () => {
      describe('if the error is a connection error', () => {
        it('does not create a Segment event', () => {
          shouldCreateRpcServiceEventsMock.mockReturnValue(true);
          getIsQuicknodeEndpointUrlMock.mockReturnValue(true);
          const trackEvent = jest.fn();

          onRpcEndpointUnavailable({
            chainId: '0xaa36a7',
            endpointUrl: 'https://endpoint.url',
            error: new TypeError('Failed to fetch'),
            infuraProjectId: 'the-infura-project-id',
            trackEvent,
            metaMetricsId:
              '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
          });

          expect(trackEvent).not.toHaveBeenCalled();
        });
      });

      describe('if the error is not a connection error', () => {
        it('creates a Segment event, simplifying the URL to just the host', () => {
          shouldCreateRpcServiceEventsMock.mockReturnValue(true);
          getIsQuicknodeEndpointUrlMock.mockReturnValue(true);
          const trackEvent = jest.fn();

          onRpcEndpointUnavailable({
            chainId: '0xaa36a7',
            endpointUrl: 'https://endpoint.url',
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
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id_caip: 'eip155:11155111',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              rpc_endpoint_url: 'endpoint.url',
            },
          });
        });
      });
    });

    describe('if the endpoint is not an Infura URL using our API key or a Quicknode URL', () => {
      describe('even if the error is not a connection error', () => {
        it('does not create a Segment event', () => {
          shouldCreateRpcServiceEventsMock.mockReturnValue(true);
          getIsOurInfuraEndpointUrlMock.mockReturnValue(false);
          getIsQuicknodeEndpointUrlMock.mockReturnValue(false);
          const trackEvent = jest.fn();

          onRpcEndpointUnavailable({
            chainId: '0xaa36a7',
            endpointUrl: 'http://some.custom.endpoint',
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
  });

  describe('if the Segment event should not be created', () => {
    describe('even if the endpoint is an Infura URL using our API key', () => {
      describe('even if the error is not a connection error', () => {
        it('does not create a Segment event', () => {
          shouldCreateRpcServiceEventsMock.mockReturnValue(false);
          getIsOurInfuraEndpointUrlMock.mockReturnValue(true);
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

    describe('even if the endpoint is a Quicknode URL', () => {
      describe('even if the error is not a connection error', () => {
        it('does not create a Segment event', () => {
          shouldCreateRpcServiceEventsMock.mockReturnValue(false);
          getIsOurInfuraEndpointUrlMock.mockReturnValue(true);
          const trackEvent = jest.fn();

          onRpcEndpointUnavailable({
            chainId: '0xaa36a7',
            endpointUrl: 'https://endpoint.url',
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
  });
});

describe('onRpcEndpointDegraded', () => {
  let getIsOurInfuraEndpointUrlMock: jest.SpyInstance<
    ReturnType<typeof networkControllerUtilsModule.getIsOurInfuraEndpointUrl>,
    Parameters<typeof networkControllerUtilsModule.getIsOurInfuraEndpointUrl>
  >;
  let getIsQuicknodeEndpointUrlMock: jest.SpyInstance<
    ReturnType<typeof networkControllerUtilsModule.getIsQuicknodeEndpointUrl>,
    Parameters<typeof networkControllerUtilsModule.getIsQuicknodeEndpointUrl>
  >;
  let shouldCreateRpcServiceEventsMock: jest.SpyInstance<
    ReturnType<
      typeof networkControllerUtilsModule.shouldCreateRpcServiceEvents
    >,
    Parameters<typeof networkControllerUtilsModule.shouldCreateRpcServiceEvents>
  >;

  beforeEach(() => {
    getIsOurInfuraEndpointUrlMock = jest
      .spyOn(networkControllerUtilsModule, 'getIsOurInfuraEndpointUrl')
      .mockReturnValue(false);
    getIsQuicknodeEndpointUrlMock = jest
      .spyOn(networkControllerUtilsModule, 'getIsQuicknodeEndpointUrl')
      .mockReturnValue(false);
    shouldCreateRpcServiceEventsMock = jest
      .spyOn(networkControllerUtilsModule, 'shouldCreateRpcServiceEvents')
      .mockReturnValue(false);
  });

  describe('if the Segment event should be created', () => {
    describe('if the endpoint is an Infura URL using our API key', () => {
      it('creates a Segment event, hiding the API from the URL', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        getIsOurInfuraEndpointUrlMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl:
            'https://some-subdomain.infura.io/v3/the-infura-project-id',
          infuraProjectId: 'the-infura-project-id',
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id_caip: 'eip155:11155111',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            rpc_endpoint_url: 'some-subdomain.infura.io',
          },
        });
      });
    });

    describe('if the endpoint is a Quicknode URL', () => {
      it('creates a Segment event, simplifying the URL to just the host', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        getIsQuicknodeEndpointUrlMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl: 'https://endpoint.url',
          infuraProjectId: 'the-infura-project-id',
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        expect(trackEvent).toHaveBeenCalledWith({
          category: 'Network',
          event: 'RPC Service Degraded',
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id_caip: 'eip155:11155111',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            rpc_endpoint_url: 'endpoint.url',
          },
        });
      });
    });

    describe('if the endpoint is not an Infura URL using our API key or a Quicknode URL', () => {
      it('does not create a Segment event', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(true);
        getIsOurInfuraEndpointUrlMock.mockReturnValue(false);
        getIsQuicknodeEndpointUrlMock.mockReturnValue(false);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl: 'http://some.custom.endpoint',
          infuraProjectId: 'the-infura-project-id',
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        expect(trackEvent).not.toHaveBeenCalled();
      });
    });
  });

  describe('if the Segment event should not be created', () => {
    describe('even if the endpoint is an Infura URL using our API key', () => {
      it('does not create a Segment event', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(false);
        getIsOurInfuraEndpointUrlMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl:
            'https://some-subdomain.infura.io/v3/the-infura-project-id',
          infuraProjectId: 'the-infura-project-id',
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        expect(trackEvent).not.toHaveBeenCalled();
      });
    });

    describe('even if the endpoint is a Quicknode URL', () => {
      it('does not create a Segment event', () => {
        shouldCreateRpcServiceEventsMock.mockReturnValue(false);
        getIsOurInfuraEndpointUrlMock.mockReturnValue(true);
        const trackEvent = jest.fn();

        onRpcEndpointDegraded({
          chainId: '0xaa36a7',
          endpointUrl: 'https://endpoint.url',
          infuraProjectId: 'the-infura-project-id',
          trackEvent,
          metaMetricsId:
            '0x86bacb9b2bf9a7e8d2b147eadb95ac9aaa26842327cd24afc8bd4b3c1d136420',
        });

        expect(trackEvent).not.toHaveBeenCalled();
      });
    });
  });
});
