import { cloneDeep } from 'lodash';
import { migrate, version } from './120.2';

const sentryCaptureExceptionMock = jest.fn();

global.sentry = {
  captureException: sentryCaptureExceptionMock,
};

const oldVersion = 120.1;

describe('migration #120.2', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(cloneDeep(oldStorage));

    expect(newStorage.meta).toStrictEqual({ version });
  });

  describe('SelectedNetworkController', () => {
    it('does nothing if SelectedNetworkController state is not set', async () => {
      const oldState = {
        OtherController: {},
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('removes SelectedNetworkController state if SelectedNetworkController state is not itself an object', async () => {
      const oldState = {
        SelectedNetworkController: 'foo',
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual({});
    });

    it('removes SelectedNetworkController state if "perDomainNetwork" property is present', async () => {
      const oldState = {
        SelectedNetworkController: {
          domains: {
            'https://metamask.io': {
              network: 'mainnet',
            },
          },
          perDomainNetwork: true,
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual({});
    });

    it('leaves "domains" state unchanged in SelectedNetworkController if "perDomainNetwork" property is not present in SelectedNetworkController state', async () => {
      const oldState = {
        SelectedNetworkController: {
          domains: {
            'https://metamask.io': {
              network: 'mainnet',
            },
            'https://test.io': {
              network: 'linea',
            },
            'https://uniswap.io': {
              network: 'optimism',
            },
          },
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('still migrates SelectedNetworkController state if other controllers have invalid state', async () => {
      const oldState = {
        NetworkController: 'invalid',
        SelectedNetworkController: {
          domains: {
            'https://metamask.io': {
              network: 'mainnet',
            },
          },
          perDomainNetwork: true,
        },
        SnapController: 'invalid',
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data.SelectedNetworkController).toBeUndefined();
    });
  });

  describe('SnapController', () => {
    it('does nothing if SnapController state is not set', async () => {
      const oldState = {
        PreferencesController: {},
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('captures an error and leaves state unchanged if SnapController state is corrupted', async () => {
      const oldState = {
        SnapController: 'invalid',
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: Invalid SnapController state of type 'string'`,
        ),
      );
    });

    it('strips SnapController.snapErrors if it exists', async () => {
      const oldState = {
        SnapController: {
          snapErrors: {},
          snapStates: {},
          unencryptedSnapStates: {},
          snaps: {},
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual({
        SnapController: {
          snapStates: {},
          unencryptedSnapStates: {},
          snaps: {},
        },
      });
    });

    it('does nothing if SnapController.snapErrors doesnt exist', async () => {
      const oldState = {
        SnapController: {
          snapStates: {},
          unencryptedSnapStates: {},
          snaps: {},
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('still migrates SnapController state if other controllers have invalid state', async () => {
      const oldState = {
        NetworkController: 'invalid',
        SelectedNetworkController: 'invalid',
        SnapController: {
          snapErrors: {},
          snapStates: {},
          unencryptedSnapStates: {},
          snaps: {},
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data.SnapController).toEqual({
        snapStates: {},
        unencryptedSnapStates: {},
        snaps: {},
      });
    });
  });

  describe('NetworkController', () => {
    it('does nothing if NetworkController state is not set', async () => {
      const oldState = {
        PreferencesController: {},
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('captures an error and leaves state unchanged if NetworkController state is corrupted', async () => {
      const oldState = {
        NetworkController: 'invalid',
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: Invalid NetworkController state of type 'string'`,
        ),
      );
    });

    it('captures an error and leaves state unchanged if providerConfig state is corrupted', async () => {
      const oldState = {
        NetworkController: {
          providerConfig: 'invalid',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: Invalid NetworkController providerConfig state of type 'string'`,
        ),
      );
    });

    it('captures an error and leaves state unchanged if networkConfigurations state is corrupted', async () => {
      const oldState = {
        NetworkController: {
          networkConfigurations: 'invalid',
          providerConfig: {},
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: Invalid NetworkController networkConfigurations state of type 'string'`,
        ),
      );
    });

    it('does nothing if obsolete properties and providerConfig are not set', async () => {
      const oldState = {
        NetworkController: {
          selectedNetworkClientId: 'example',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('does nothing if obsolete properties are not set and providerConfig is set to undefined', async () => {
      const oldState = {
        NetworkController: {
          // This should be impossible because `undefined` cannot be returned from persisted state,
          // it's not valid JSON. But a bug in migration 14 ends up setting this to `undefined`.
          providerConfig: undefined,
          selectedNetworkClientId: 'example',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('does nothing if obsolete properties and providerConfig id are not set', async () => {
      const oldState = {
        NetworkController: {
          providerConfig: {},
          selectedNetworkClientId: 'example',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('does not remove a valid providerConfig id', async () => {
      const oldState = {
        NetworkController: {
          networkConfigurations: {
            'valid-id': {},
          },
          providerConfig: {
            id: 'valid-id',
          },
          selectedNetworkClientId: 'example',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('removes all obsolete properties', async () => {
      const oldState = {
        NetworkController: {
          networkDetails: {},
          networkId: 'example',
          networkStatus: 'example',
          previousProviderStore: 'example',
          provider: 'example',
          selectedNetworkClientId: 'example',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual({
        NetworkController: {
          selectedNetworkClientId: 'example',
        },
      });
    });

    it('removes providerConfig id if network configuration is missing', async () => {
      const oldState = {
        NetworkController: {
          providerConfig: {
            id: 'invalid-id',
          },
          selectedNetworkClientId: 'example',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data.NetworkController).toEqual({
        providerConfig: {},
        selectedNetworkClientId: 'example',
      });
    });

    it('removes providerConfig id that does not match any network configuration', async () => {
      const oldState = {
        NetworkController: {
          networkConfigurations: {
            'valid-id': {},
          },
          providerConfig: {
            id: 'invalid-id',
          },
          selectedNetworkClientId: 'example',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data.NetworkController).toEqual({
        networkConfigurations: {
          'valid-id': {},
        },
        providerConfig: {},
        selectedNetworkClientId: 'example',
      });
    });

    it('removes providerConfig id with an invalid type', async () => {
      const oldState = {
        NetworkController: {
          networkConfigurations: {
            '123': {},
          },
          providerConfig: {
            id: 123,
          },
          selectedNetworkClientId: 'example',
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data.NetworkController).toEqual({
        networkConfigurations: {
          '123': {},
        },
        providerConfig: {},
        selectedNetworkClientId: 'example',
      });
    });

    it('still migrates NetworkController state if other controllers have invalid state', async () => {
      const oldState = {
        NetworkController: {
          networkDetails: {},
          networkId: 'example',
          networkStatus: 'example',
          previousProviderStore: 'example',
          provider: 'example',
          selectedNetworkClientId: 'example',
        },
        SelectedNetworkController: 'invalid',
        SnapController: 'invalid',
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data.NetworkController).toEqual({
        selectedNetworkClientId: 'example',
      });
    });
  });

  describe('PhishingController', () => {
    it('does nothing if PhishingController state is not set', async () => {
      const oldState = {
        PreferencesController: {},
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('captures an error and leaves state unchanged if PhishingController state is corrupted', async () => {
      const oldState = {
        PhishingController: 'invalid',
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
      expect(sentryCaptureExceptionMock).toHaveBeenCalledWith(
        new Error(
          `Migration ${version}: Invalid PhishingController state of type 'string'`,
        ),
      );
    });

    it('does nothing if obsolete properties are not set', async () => {
      const oldState = {
        PhishingController: {
          phishingLists: [],
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual(oldState);
    });

    it('removes all obsolete properties', async () => {
      const oldState = {
        PhishingController: {
          listState: {},
          phishingLists: [],
        },
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data).toEqual({
        PhishingController: {
          phishingLists: [],
        },
      });
    });

    it('still migrates PhishingController state if other controllers have invalid state', async () => {
      const oldState = {
        NetworkController: 'invalid',
        PhishingController: {
          listState: {},
          phishingLists: [],
        },
        SelectedNetworkController: 'invalid',
        SnapController: 'invalid',
      };

      const transformedState = await migrate({
        meta: { version: oldVersion },
        data: cloneDeep(oldState),
      });

      expect(transformedState.data.PhishingController).toEqual({
        phishingLists: [],
      });
    });
  });

  it('migrates state from all controllers', async () => {
    const oldState = {
      NetworkController: {
        networkDetails: {},
        networkId: 'example',
        networkStatus: 'example',
        previousProviderStore: 'example',
        provider: 'example',
        providerConfig: {
          id: 'some-id',
        },
        selectedNetworkClientId: 'example',
      },
      PhishingController: {
        listState: {},
        phishingLists: [],
      },
      SelectedNetworkController: {
        domains: {
          'https://metamask.io': {
            network: 'mainnet',
          },
        },
        perDomainNetwork: true,
      },
      SnapController: {
        snapErrors: {},
        snapStates: {},
        unencryptedSnapStates: {},
        snaps: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual({
      NetworkController: {
        providerConfig: {},
        selectedNetworkClientId: 'example',
      },
      PhishingController: {
        phishingLists: [],
      },
      SnapController: {
        snapStates: {},
        unencryptedSnapStates: {},
        snaps: {},
      },
    });
  });
});
