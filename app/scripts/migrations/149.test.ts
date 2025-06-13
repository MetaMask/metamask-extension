import { migrate } from './149';

const expectedVersion = 149;
const previousVersion = expectedVersion - 1;

describe(`migration #${expectedVersion}`, () => {
  it('does nothing if state has no NetworkController property', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {},
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if state.NetworkController is not an object', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: 'not-an-object',
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if state.NetworkController has no networkConfigurationsByChainId property', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {},
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if state.NetworkController.networkConfigurationsByChainId is not an object', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: 'not-an-object',
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if any value in state.NetworkController.networkConfigurationsByChainId is not an object', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': 'not-an-object',
            '0x2': {},
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if any value in state.NetworkController.networkConfigurationsByChainId does not contain a chainId', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': 'not-an-object',
            '0x2': {},
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('does nothing if state.NetworkController.networkConfigurationsByChainId contains any keys that cannot be converted to hex strings', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            'unconvertable-string': {
              chainId: '0x1',
            },
            '2': {
              chainId: '2',
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('corrects a chainId property so it matches the key of the network configuration, even after converting the key', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '1': {
              chainId: '2345',
            },
            '0x2': {
              chainId: '0x2',
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
            },
            '0x2': {
              chainId: '0x2',
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('returns a new version of the data with decimal keys in state.NetworkController.networkConfigurationsByChainId converted to hex strings', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '100': {
              chainId: '0x64',
            },
            '128': {
              chainId: '0x80',
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x64': {
              chainId: '0x64',
            },
            '0x80': {
              chainId: '0x80',
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('returns a new version of the data with chainId properties in state.NetworkController.networkConfigurationsByChainId converted to hex strings', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x64': {
              chainId: '100',
            },
            '0x80': {
              chainId: '128',
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x64': {
              chainId: '0x64',
            },
            '0x80': {
              chainId: '0x80',
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('leaves chain IDs that are already hex strings untouched', async () => {
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x64': {
              chainId: '0x64',
            },
            '0x80': {
              chainId: '0x80',
            },
          },
        },
      },
    };
    const expectedVersionedData = {
      meta: { version: expectedVersion },
      data: oldVersionedData.data,
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });
});
