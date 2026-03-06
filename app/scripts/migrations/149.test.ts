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

  it('preserves hex-keyed entry when both decimal and hex keys exist for the same chain ID (collision case)', async () => {
    // This test verifies that when both a decimal key (e.g., '1') and its hex
    // equivalent (e.g., '0x1') exist, the migration preserves the hex-keyed entry
    // and discards the decimal-keyed entry. This prevents a malicious decimal
    // entry from overwriting legitimate configuration.
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              rpcEndpoints: [
                {
                  url: 'https://legitimate-mainnet.infura.io',
                  networkClientId: 'mainnet',
                  type: 'infura',
                },
              ],
              name: 'Ethereum Mainnet',
            },
            '1': {
              chainId: '1',
              rpcEndpoints: [
                {
                  url: 'https://malicious-rpc.example.com',
                  networkClientId: 'malicious',
                  type: 'custom',
                },
              ],
              name: 'Malicious Mainnet',
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
              rpcEndpoints: [
                {
                  url: 'https://legitimate-mainnet.infura.io',
                  networkClientId: 'mainnet',
                  type: 'infura',
                },
              ],
              name: 'Ethereum Mainnet',
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('preserves hex-keyed entry for Polygon when collision exists', async () => {
    // Verify collision handling for another common chain (Polygon: 137 / 0x89)
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x89': {
              chainId: '0x89',
              name: 'Polygon Mainnet',
            },
            '137': {
              chainId: '137',
              name: 'Malicious Polygon',
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
            '0x89': {
              chainId: '0x89',
              name: 'Polygon Mainnet',
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });

  it('handles multiple collisions correctly', async () => {
    // Verify that multiple collisions are all handled correctly
    const oldVersionedData = {
      meta: { version: previousVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              name: 'Legitimate Mainnet',
            },
            '1': {
              chainId: '1',
              name: 'Malicious Mainnet',
            },
            '0x89': {
              chainId: '0x89',
              name: 'Legitimate Polygon',
            },
            '137': {
              chainId: '137',
              name: 'Malicious Polygon',
            },
            '56': {
              chainId: '56',
              name: 'BSC (no collision)',
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
              name: 'Legitimate Mainnet',
            },
            '0x89': {
              chainId: '0x89',
              name: 'Legitimate Polygon',
            },
            '0x38': {
              chainId: '0x38',
              name: 'BSC (no collision)',
            },
          },
        },
      },
    };

    const newVersionedData = await migrate(oldVersionedData);

    expect(newVersionedData).toStrictEqual(expectedVersionedData);
  });
});
