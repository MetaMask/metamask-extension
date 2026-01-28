import React from 'react';
import { ChainId, getNativeAssetForChainId } from '@metamask/bridge-controller';
import { BRIDGE_CHAINID_COMMON_TOKEN_PAIR } from '../../../../../../shared/constants/bridge';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../../../../test/data/bridge/mock-bridge-store';
import configureStore from '../../../../../store/store';
import { toBridgeToken } from '../../../../../ducks/bridge/utils';
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
    expect(getByTestId('bridge-asset')).toMatchSnapshot();
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
    expect(getByText('mUSD')).toBeInTheDocument();
    expect(getByTestId('bridge-asset')).toMatchSnapshot();
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
    expect(getByText('mUSD')).toBeInTheDocument();
    expect(getByTestId('bridge-asset')).toMatchSnapshot();
  });

  it('should render asset with accountType', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <BridgeAsset
        asset={{
          ...toBridgeToken(getNativeAssetForChainId(ChainId.BTC)),
          accountType: 'bip122:p2wpkh',
        }}
        selected={false}
      />,
      configureStore(createBridgeMockStore({})),
    );
    expect(getByText('BTC')).toBeInTheDocument();
    expect(getByText('Native SegWit')).toBeInTheDocument();
    expect(getByTestId('bridge-asset')).toMatchSnapshot();
  });
});
