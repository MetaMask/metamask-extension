import {
  Slip44Service,
  type NetworkEnablementController,
  type NetworkEnablementControllerMessenger,
} from '@metamask/network-enablement-controller';
import { Messenger, MOCK_ANY_NAMESPACE } from '@metamask/messenger';
import { getPrivateNetworkEnablementConfiguration } from './network-metadata-privacy';
import * as networkPolicy from '../lib/network-request-policy';

function createController({
  onboarded,
  enabled,
  existing,
}: {
  onboarded: boolean;
  enabled: boolean;
  existing?: number;
}) {
  const root = new Messenger({ namespace: MOCK_ANY_NAMESPACE });
  root.registerActionHandler(
    'OnboardingController:getState',
    () => ({ completedOnboarding: onboarded }) as never,
  );
  root.registerActionHandler(
    'PreferencesController:getState',
    () => ({ useExternalServices: enabled }) as never,
  );
  root.registerActionHandler(
    'NetworkController:getState',
    () =>
      ({
        networkConfigurationsByChainId: { '0x1': { nativeCurrency: 'ETH' } },
      }) as never,
  );
  const config = getPrivateNetworkEnablementConfiguration(
    root as never,
  ) as unknown as {
    getMessenger: (parent: typeof root) => NetworkEnablementControllerMessenger;
    init: (options: {
      messenger: NetworkEnablementControllerMessenger;
      state?: object;
    }) => NetworkEnablementController;
  };
  const controller = config.init({
    messenger: config.getMessenger(root),
    state:
      existing === undefined
        ? undefined
        : {
            nativeAssetIdentifiers: {
              'eip155:1': `eip155:1/slip44:${existing}`,
            },
          },
  });
  return controller;
}

describe('network metadata privacy', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    [false, true],
    [true, false],
    [false, false],
  ])(
    'uses offline metadata when onboarding is %s and external services are %s',
    async (onboarded, enabled) => {
      const remote = jest
        .spyOn(Slip44Service, 'getEvmSlip44')
        .mockResolvedValue(999);
      const controller = createController({
        onboarded,
        enabled,
        existing: 123,
      });
      await controller.initNativeAssetIdentifiers([
        { chainId: 'eip155:1', nativeCurrency: 'ETH' },
      ]);
      expect(remote).not.toHaveBeenCalled();
      expect(controller.state.nativeAssetIdentifiers['eip155:1']).toBe(
        'eip155:1/slip44:123',
      );
    },
  );

  it('waits for the browser policy before requesting remote metadata', async () => {
    let publishPolicy: () => void = () => undefined;
    const policyReady = new Promise<void>((resolve) => {
      publishPolicy = resolve;
    });
    jest
      .spyOn(networkPolicy, 'refreshNetworkRequestPolicy')
      .mockReturnValue(policyReady);
    const remote = jest
      .spyOn(Slip44Service, 'getEvmSlip44')
      .mockResolvedValue(999);
    const controller = createController({ onboarded: true, enabled: true });
    const lookup = controller.initNativeAssetIdentifiers([
      { chainId: 'eip155:1', nativeCurrency: 'ETH' },
    ]);
    await Promise.resolve();
    expect(remote).not.toHaveBeenCalled();
    publishPolicy();
    await lookup;
    expect(remote).toHaveBeenCalledWith(1);
  });

  it('allows a remote lookup only after onboarding and consent', async () => {
    const remote = jest
      .spyOn(Slip44Service, 'getEvmSlip44')
      .mockResolvedValue(999);
    const controller = createController({ onboarded: true, enabled: true });
    await controller.initNativeAssetIdentifiers([
      { chainId: 'eip155:1', nativeCurrency: 'ETH' },
    ]);
    expect(remote).toHaveBeenCalledWith(1);
    expect(controller.state.nativeAssetIdentifiers['eip155:1']).toBe(
      'eip155:1/slip44:999',
    );
  });
});

describe('network metadata refresh', () => {
  it('refreshes offline identifiers after onboarding and consent become available', async () => {
    const { setupNetworkEnablementController } =
      await import('./network-enablement-controller');
    const root = new Messenger({ namespace: MOCK_ANY_NAMESPACE });
    let onboarded = false;
    let enabled = false;
    root.registerActionHandler(
      'OnboardingController:getState',
      () => ({ completedOnboarding: onboarded }) as never,
    );
    root.registerActionHandler(
      'PreferencesController:getState',
      () => ({ useExternalServices: enabled }) as never,
    );
    root.registerActionHandler(
      'NetworkController:getState',
      () =>
        ({
          networkConfigurationsByChainId: { '0x1': { nativeCurrency: 'ETH' } },
        }) as never,
    );
    const clear = jest
      .spyOn(Slip44Service, 'clearCache')
      .mockImplementation(() => undefined);
    const controller = {
      state: { enabledNetworkMap: {}, nativeAssetIdentifiers: {} },
      init: jest.fn().mockResolvedValue(undefined),
      enableAllPopularNetworks: jest.fn(),
      enableNetwork: jest.fn(),
      initNativeAssetIdentifiers: jest.fn().mockResolvedValue(undefined),
    };
    setupNetworkEnablementController({
      messenger: root as never,
      networkEnablementController: controller as never,
      persistedState: {} as never,
    });
    onboarded = true;
    root.publish('OnboardingController:stateChange', {} as never, []);
    expect(clear).not.toHaveBeenCalled();
    enabled = true;
    root.publish('PreferencesController:stateChange', {} as never, []);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(controller.initNativeAssetIdentifiers).toHaveBeenCalledWith([
      { chainId: 'eip155:1', nativeCurrency: 'ETH' },
    ]);
    clear.mockRestore();
  });
});
