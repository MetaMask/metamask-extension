import { migrate, version } from './120.2';

const oldVersion = 120.1;

describe('migration #120.2', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if SelectedNetworkController state is not set', async () => {
    const oldState = {
      OtherController: {},
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('sets SelectedNetworkController state to an object containing an empty object "domains" if SelectedNetworkController state is not itself an object', async () => {
    const oldState = {
      SelectedNetworkController: 'foo',
    };

    const expectedState = {
      SelectedNetworkController: { domains: {} },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('removes "perDomainNetwork" property and resets "domains" object in SelectedNetworkController state if "perDomainNetwork" property is present', async () => {
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

    const expectedState = {
      SelectedNetworkController: {
        domains: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('leavs "domains" state unchanged in SelectedNetworkController if "perDomainNetwork" property is not present in SelectedNetworkController state', async () => {
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
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });
});
