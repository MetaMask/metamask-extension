import { cloneDeep } from 'lodash';
import { migrate, version } from './120.5';

const oldVersion = 120.4;

describe('migration #120.5', () => {
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

  it('does nothing if SelectedNetworkController state is not set', async () => {
    const oldState = {
      NetworkController: {
        networkConfigurations: {
          123: {},
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('deletes the SelectedNetworkController state if it is corrupted', async () => {
    const oldState = {
      NetworkController: {
        networkConfigurations: {
          123: {},
        },
      },
      SelectedNetworkController: 'invalid',
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual({
      NetworkController: {
        networkConfigurations: {
          123: {},
        },
      },
    });
  });

  it('deletes the SelectedNetworkController state if it is missing the domains state', async () => {
    const oldState = {
      NetworkController: {
        networkConfigurations: {
          123: {},
        },
      },
      SelectedNetworkController: {
        somethingElse: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual({
      NetworkController: {
        networkConfigurations: {
          123: {},
        },
      },
    });
  });

  it('deletes the SelectedNetworkController state if the domains state is corrupted', async () => {
    const oldState = {
      NetworkController: {
        networkConfigurations: {
          123: {},
        },
      },
      SelectedNetworkController: {
        domains: 'invalid',
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual({
      NetworkController: {
        networkConfigurations: {
          123: {},
        },
      },
    });
  });

  it('deletes the SelectedNetworkController state if NetworkController state is missing', async () => {
    const oldState = {
      SelectedNetworkController: {
        domains: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual({});
  });

  it('deletes the SelectedNetworkController state if NetworkController state is corrupted', async () => {
    const oldState = {
      NetworkController: 'invalid',
      SelectedNetworkController: {
        domains: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual({
      NetworkController: 'invalid',
    });
  });

  it('deletes the SelectedNetworkController state if NetworkController has no networkConfigurations', async () => {
    const oldState = {
      NetworkController: {},
      SelectedNetworkController: {
        domains: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual({
      NetworkController: {},
    });
  });

  it('deletes the SelectedNetworkController state if NetworkController networkConfigurations state is corrupted', async () => {
    const oldState = {
      NetworkController: { networkConfigurations: 'invalid' },
      SelectedNetworkController: {
        domains: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual({
      NetworkController: { networkConfigurations: 'invalid' },
    });
  });

  it('does nothing if SelectedNetworkController domains state is empty', async () => {
    const oldState = {
      NetworkController: { networkConfigurations: {} },
      SelectedNetworkController: {
        domains: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('does nothing if SelectedNetworkController domains state is valid', async () => {
    const oldState = {
      NetworkController: {
        networkConfigurations: {
          123: {},
        },
      },
      SelectedNetworkController: {
        domains: {
          'example1.test': '123',
          'example2.test': 'mainnet',
          'example3.test': 'goerli',
          'example4.test': 'sepolia',
          'example5.test': 'linea-goerli',
          'example6.test': 'linea-sepolia',
          'example7.test': 'linea-mainnet',
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('deletes the SelectedNetworkController state if an invalid networkConfigurationId is found', async () => {
    const oldState = {
      NetworkController: {
        networkConfigurations: {
          123: {},
        },
      },
      SelectedNetworkController: {
        domains: {
          'domain.test': '456',
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: cloneDeep(oldState),
    });

    expect(transformedState.data).toEqual({
      NetworkController: {
        networkConfigurations: {
          123: {},
        },
      },
    });
  });
});
