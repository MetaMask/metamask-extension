import React from 'react';
import { ChainId, getNativeAssetForChainId } from '@metamask/bridge-controller';
import type { CaipAssetType } from '@metamask/utils';
import { BRIDGE_CHAINID_COMMON_TOKEN_PAIR } from '../../../../shared/constants/bridge';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import configureStore from '../../../store/store';
import { toBridgeToken } from '../../../ducks/bridge/utils';
import { BridgeAsset } from './asset';

describe('BridgeAsset', () => {
  it('should render native asset', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <BridgeAsset
        asset={toBridgeToken(getNativeAssetForChainId('0x1'))}
        selected={true}
      />,
      configureStore(createBridgeMockStore({})),
    );

    expect(getByText('ETH')).toBeInTheDocument();
    expect(getByTestId(/^bridge-asset--/u)).toMatchSnapshot();
  });

  it('should render ERC20 asset', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <BridgeAsset
        asset={toBridgeToken(
          BRIDGE_CHAINID_COMMON_TOKEN_PAIR['eip155:1'] as never,
        )}
        selected={false}
      />,
      configureStore(createBridgeMockStore({})),
    );
    expect(getByText(messages.musdSymbol.message)).toBeInTheDocument();
    expect(getByTestId(/^bridge-asset--/u)).toMatchSnapshot();
  });

  it('should render asset with balance', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <BridgeAsset
        asset={{
          ...toBridgeToken(
            BRIDGE_CHAINID_COMMON_TOKEN_PAIR['eip155:1'] as never,
          ),
          balance: '100',
          tokenFiatAmount: 100,
        }}
        selected={false}
      />,
      configureStore(createBridgeMockStore({})),
    );
    expect(getByText(messages.musdSymbol.message)).toBeInTheDocument();
    expect(getByTestId(/^bridge-asset--/u)).toMatchSnapshot();
  });
});

describe('BridgeAsset network logo fallback', () => {
  it('should render a native asset whose chain is not in the network image maps', () => {
    // toBridgeToken derives chainId from assetId, so the unknown chain has
    // to be set on assetId for the network logo lookups to miss.
    const unknownChainNativeAsset = {
      ...getNativeAssetForChainId('0x1'),
      assetId: 'eip155:9999/slip44:60' as CaipAssetType,
    };

    const { container } = renderWithProvider(
      <BridgeAsset
        asset={toBridgeToken(unknownChainNativeAsset)}
        selected={false}
      />,
      configureStore(createBridgeMockStore({})),
    );

    expect(container.innerHTML).not.toContain('eth_logo.svg');
  });
});
