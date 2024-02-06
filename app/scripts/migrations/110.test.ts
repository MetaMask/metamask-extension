import { migrate, version } from './110';

describe('migration #110', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 109 },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('does nothing if SelectedNetworkController is not present', async () => {
    const oldState = {
      OtherController: {},
    };

    const transformedState = await migrate({
      meta: { version: 109 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('resets domains if SelectedNetworkController state is present', async () => {
    const oldState = {
      SelectedNetworkController: {
        domains: {
          metamask: 'ropsten',
          otherDomain: 'value',
        },
      },
    };

    const expectedState = {
      SelectedNetworkController: {
        domains: {
          metamask: 'ropsten', // Should keep existing metamask domain
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: 109 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('sets metamask domain if already present', async () => {
    const oldState = {
      SelectedNetworkController: {
        domains: {
          metamask: 'value',
        },
      },
    };

    const expectedState = {
      SelectedNetworkController: {
        domains: {
          metamask: 'value',
        },
      },
    };

    const transformedState = await migrate({
      meta: { version: 109 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('does nothing to domains if already only contains metamask with correct value', async () => {
    const oldState = {
      SelectedNetworkController: {
        domains: {
          metamask: 'mainnet',
        },
      },
    };

    const expectedState = {
      ...oldState, // No change expected
    };

    const transformedState = await migrate({
      meta: { version: 109 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('handles complex state transformations correctly', async () => {
    const oldState = {
      SelectedNetworkController: {
        domains: {
          metamask: 'kovan',
          otherDomain1: 'value1',
          otherDomain2: 'value2',
        },
      },
      OtherController: {
        someData: 'dataValue',
      },
    };

    const expectedState = {
      SelectedNetworkController: {
        domains: {
          metamask: 'kovan', // Only keep the metamask domain
        },
      },
      OtherController: {
        someData: 'dataValue', // Other data remains unchanged
      },
    };

    const transformedState = await migrate({
      meta: { version: 109 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });
});
