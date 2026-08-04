import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  type MessengerActions,
  type MessengerEvents,
  type MockAnyNamespace,
} from '@metamask/messenger';
import {
  NetworkConnectionBannerController,
  type NetworkConnectionBannerControllerMessenger,
} from '@metamask/network-connection-banner-controller';
import { getNetworkConnectionBannerControllerMessenger } from './network-connection-banner-controller-messenger';

type RootMessenger = Messenger<
  MockAnyNamespace,
  MessengerActions<NetworkConnectionBannerControllerMessenger>,
  MessengerEvents<NetworkConnectionBannerControllerMessenger>
>;

/**
 * Create a root messenger with mock handlers registered for every peer
 * controller action the banner controller calls.
 *
 * @returns The root messenger and the mock handlers.
 */
function getRootMessenger() {
  const messenger: RootMessenger = new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });

  const getNetworkControllerState = jest.fn().mockReturnValue({
    networkConfigurationsByChainId: {},
    networksMetadata: {},
  });
  const getNetworkEnablementControllerState = jest.fn().mockReturnValue({
    enabledNetworkMap: {},
  });
  const getConnectivityControllerState = jest.fn().mockReturnValue({
    connectivityStatus: 'online',
  });

  messenger.registerActionHandler(
    'NetworkController:getState',
    getNetworkControllerState,
  );
  messenger.registerActionHandler(
    'NetworkEnablementController:getState',
    getNetworkEnablementControllerState,
  );
  messenger.registerActionHandler(
    'ConnectivityController:getState',
    getConnectivityControllerState,
  );

  return {
    messenger,
    getNetworkControllerState,
    getNetworkEnablementControllerState,
    getConnectivityControllerState,
  };
}

describe('getNetworkConnectionBannerControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const { messenger } = getRootMessenger();
    const controllerMessenger =
      getNetworkConnectionBannerControllerMessenger(messenger);

    expect(controllerMessenger).toBeInstanceOf(Messenger);
  });

  it('delegates the peer controller actions the controller needs to evaluate', () => {
    const {
      messenger,
      getNetworkControllerState,
      getConnectivityControllerState,
    } = getRootMessenger();
    const controllerMessenger =
      getNetworkConnectionBannerControllerMessenger(messenger);
    const controller = new NetworkConnectionBannerController({
      messenger: controllerMessenger,
      infuraProjectId: 'test-infura-project-id',
    });

    // Opening the UI on an unlocked wallet starts the initial evaluation,
    // which calls the peer controllers' getState actions through the
    // controller messenger. This throws if the events or actions were not
    // delegated to the controller messenger.
    expect(() => {
      messenger.publish(
        'ClientController:stateChanged',
        { isUiOpen: true } as never,
        [],
      );
      messenger.publish('KeyringController:unlock');
    }).not.toThrow();

    expect(getConnectivityControllerState).toHaveBeenCalled();
    expect(getNetworkControllerState).toHaveBeenCalled();
    expect(controller.state).toStrictEqual({
      networkConnectionBannerStatus: 'available',
      networkConnectionBannerNetwork: null,
    });
  });

  it('delegates the peer controller stateChange events', () => {
    const { messenger } = getRootMessenger();
    const controllerMessenger =
      getNetworkConnectionBannerControllerMessenger(messenger);

    const networkListener = jest.fn();
    const enablementListener = jest.fn();
    const connectivityListener = jest.fn();
    const clientListener = jest.fn();
    const unlockListener = jest.fn();
    const lockListener = jest.fn();
    controllerMessenger.subscribe(
      'NetworkController:stateChange',
      networkListener,
    );
    controllerMessenger.subscribe(
      'NetworkEnablementController:stateChange',
      enablementListener,
    );
    controllerMessenger.subscribe(
      'ConnectivityController:stateChange',
      connectivityListener,
    );
    controllerMessenger.subscribe(
      'ClientController:stateChanged',
      clientListener,
    );
    controllerMessenger.subscribe('KeyringController:unlock', unlockListener);
    controllerMessenger.subscribe('KeyringController:lock', lockListener);

    messenger.publish(
      'NetworkController:stateChange',
      { networkConfigurationsByChainId: {}, networksMetadata: {} } as never,
      [],
    );
    messenger.publish(
      'NetworkEnablementController:stateChange',
      { enabledNetworkMap: {} } as never,
      [],
    );
    messenger.publish(
      'ConnectivityController:stateChange',
      { connectivityStatus: 'offline' } as never,
      [],
    );
    messenger.publish(
      'ClientController:stateChanged',
      { isUiOpen: true } as never,
      [],
    );
    messenger.publish('KeyringController:unlock');
    messenger.publish('KeyringController:lock');

    expect(networkListener).toHaveBeenCalled();
    expect(enablementListener).toHaveBeenCalled();
    expect(connectivityListener).toHaveBeenCalled();
    expect(clientListener).toHaveBeenCalled();
    expect(unlockListener).toHaveBeenCalled();
    expect(lockListener).toHaveBeenCalled();
  });
});
