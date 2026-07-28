import { KnownCaipNamespace } from '@metamask/utils';
import { getAllEnabledNetworkClientIds } from './multichain';

describe('getAllEnabledNetworkClientIds', () => {
  const networkConfigurationsByChainId = {
    '0x1': {
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [{ networkClientId: 'mainnet' }],
    },
    '0xe708': {
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [{ networkClientId: 'linea-mainnet' }],
    },
  } as const;

  it('returns client IDs for enabled EIP-155 networks only', () => {
    const result = getAllEnabledNetworkClientIds(
      {
        [KnownCaipNamespace.Eip155]: {
          '0x1': true,
          '0xe708': false,
        },
      },
      networkConfigurationsByChainId,
    );

    expect(result).toStrictEqual(['mainnet']);
  });

  it('returns an empty array when no EIP-155 networks are enabled', () => {
    const result = getAllEnabledNetworkClientIds(
      {
        [KnownCaipNamespace.Eip155]: {
          '0x1': false,
        },
      },
      networkConfigurationsByChainId,
    );

    expect(result).toStrictEqual([]);
  });

  it('returns an empty array when enabledNetworkMap is undefined', () => {
    const result = getAllEnabledNetworkClientIds(
      undefined,
      networkConfigurationsByChainId,
    );

    expect(result).toStrictEqual([]);
  });
});
