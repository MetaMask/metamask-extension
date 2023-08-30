// describe('SelectedNetworkController', () => {
//   it('can be instantiated with default values', () => {

//   });

//   it('can set the networkClientId for a domain', () => {

//   });

//   it('can set the networkClientId for the metamask domain specifically', () => {

//   });

//   it('can reset the state / selections to the default state', () => {

//   });

//   describe('getNetworkClientIdForDomain', () => {
//     it('gives the metamask domain when the perDomainNetwork option is false (default)', () => {

//     });

//     it('when the perDomainNetwork feature flag is on, it returns items other than the metamask domain', () => {

//     });
//   });

//   it('updates the  networkClientId for the metamask domain when the networkControllers selectedNetworkClientId changes', () => {

//   });
// });

import SelectedNetworkController, {
  SelectedNetworkControllerOptions,
} from './selected-network-controller';

describe.only('SelectedNetworkController', () => {
  it('can be instantiated with default values', () => {
    const options: SelectedNetworkControllerOptions = {
      messenger: {} as any, // Mock the messenger
    };
    const controller = new SelectedNetworkController(options);
    expect(controller.state).toEqual({
      domains: {},
      perDomainNetwork: false,
    });
  });

  it('can set the networkClientId for a domain', () => {
    const options: SelectedNetworkControllerOptions = {
      messenger: {} as any, // Mock the messenger
    };
    const controller = new SelectedNetworkController(options);
    const domain = 'example.com';
    const networkClientId = 'network1';
    controller.setNetworkClientIdForDomain(domain, networkClientId);
    expect(controller.state.domains[domain]).toBe(networkClientId);
  });

  it('can set the networkClientId for the metamask domain specifically', () => {
    const options: SelectedNetworkControllerOptions = {
      messenger: {} as any, // Mock the messenger
    };
    const controller = new SelectedNetworkController(options);
    const networkClientId = 'network2';
    controller.setNetworkClientIdForMetamask(networkClientId);
    expect(controller.state.domains.metamask).toBe(networkClientId);
  });

  it('can reset the state / selections to the default state', () => {
    const options: SelectedNetworkControllerOptions = {
      messenger: {} as any, // Mock the messenger
    };
    const controller = new SelectedNetworkController(options);
    controller.setNetworkClientIdForDomain('example.com', 'network1');
    controller.setNetworkClientIdForDomain('test.com', 'network2');
    controller.setNetworkClientIdForMetamask('network3');
    controller.resetState();
    expect(controller.state).toEqual({
      domains: {},
      perDomainNetwork: false,
    });
  });

  describe('getNetworkClientIdForDomain', () => {
    it('gives the metamask domain when the perDomainNetwork option is false (default)', () => {
      const options: SelectedNetworkControllerOptions = {
        messenger: {} as any, // Mock the messenger
      };
      const controller = new SelectedNetworkController(options);
      const networkClientId = 'network4';
      controller.setNetworkClientIdForMetamask(networkClientId);
      const result = controller.getNetworkClientIdForDomain('example.com');
      expect(result).toBe(networkClientId);
    });

    it('when the perDomainNetwork feature flag is on, it returns items other than the metamask domain', () => {
      const options: SelectedNetworkControllerOptions = {
        messenger: {} as any, // Mock the messenger
      };
      const controller = new SelectedNetworkController(options);
      controller.state.perDomainNetwork = true;
      const networkClientId1 = 'network5';
      const networkClientId2 = 'network6';
      controller.setNetworkClientIdForDomain('example.com', networkClientId1);
      controller.setNetworkClientIdForDomain('test.com', networkClientId2);
      const result1 = controller.getNetworkClientIdForDomain('example.com');
      const result2 = controller.getNetworkClientIdForDomain('test.com');
      expect(result1).toBe(networkClientId1);
      expect(result2).toBe(networkClientId2);
    });
  });

  it('updates the networkClientId for the metamask domain when the networkControllers selectedNetworkClientId changes', () => {
    const mockMessagingSystem = {
      registerActionHandler: jest.fn(),
      subscribe: jest.fn(),
    };
    const options: SelectedNetworkControllerOptions = {
      messenger: mockMessagingSystem as any,
    };
    const controller = new SelectedNetworkController(options);
    const stateChangeHandler = mockMessagingSystem.subscribe.mock.calls[0][1];
    const state: any = {
      selectedNetworkClientId: 'newNetwork',
    };
    const patch: any = [
      {
        path: ['selectedNetworkClientId'],
        op: 'replace',
        value: 'newNetwork',
      },
    ];
    controller.setNetworkClientIdForMetamask('oldNetwork');
    stateChangeHandler(state, patch);
    expect(controller.state.domains.metamask).toBe('newNetwork');
  });
});
