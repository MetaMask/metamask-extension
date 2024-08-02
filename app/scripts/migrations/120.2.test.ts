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
});
