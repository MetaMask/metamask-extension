import { migrate, version } from './111';

describe('migration #111', () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: 110 },
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
      meta: { version: 110 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(oldState);
  });

  it('resets domains if SelectedNetworkController state is present', async () => {
    const oldState = {
      SelectedNetworkController: {
        perDomainNetwork: true,
        domains: {
          metamask: 'ropsten',
          otherDomain: 'value',
        },
      },
    };

    const expectedState = {
      SelectedNetworkController: {
        perDomainNetwork: true,
        domains: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: 110 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('resets domains if existing state only contains metamask', async () => {
    const oldState = {
      SelectedNetworkController: {
        perDomainNetwork: false,
        domains: {
          metamask: 'mainnet',
        },
      },
    };

    const expectedState = {
      SelectedNetworkController: {
        perDomainNetwork: false,
        domains: {},
      },
    };

    const transformedState = await migrate({
      meta: { version: 110 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });

  it('handles complex state transformations correctly', async () => {
    const oldState = {
      SelectedNetworkController: {
        perDomainNetwork: false,
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
        perDomainNetwork: false,
        domains: {},
      },
      OtherController: {
        someData: 'dataValue', // Other data remains unchanged
      },
    };

    const transformedState = await migrate({
      meta: { version: 110 },
      data: oldState,
    });

    expect(transformedState.data).toEqual(expectedState);
  });
});
