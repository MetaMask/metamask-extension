import React from 'react';
import { ChainId, getNativeAssetForChainId } from '@metamask/bridge-controller';
import { BRIDGE_CHAINID_COMMON_TOKEN_PAIR } from '../../../../../../shared/constants/bridge';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../../../../test/data/bridge/mock-bridge-store';
import configureStore from '../../../../../store/store';
import { toBridgeToken } from '../../../../../ducks/bridge/utils';
import { SelectedAssetButton } from './selected-asset-button';

const renderButton = (asset: ReturnType<typeof toBridgeToken>) =>
  renderWithProvider(
    <SelectedAssetButton asset={asset} onClick={jest.fn()} />,
    configureStore(createBridgeMockStore({})),
  );

describe('SelectedAssetButton', () => {
  it('renders with a native asset', () => {
    const { getByText, container } = renderButton(
      toBridgeToken(getNativeAssetForChainId('0x1')),
    );

    expect(getByText('ETH')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders with an ERC20 asset', () => {
    const { getByText, container } = renderButton(
      toBridgeToken(BRIDGE_CHAINID_COMMON_TOKEN_PAIR['eip155:1'] as never),
    );

    expect(getByText('mUSD')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders with a non-EVM asset', () => {
    const { getByText, container } = renderButton(
      toBridgeToken(getNativeAssetForChainId(ChainId.BTC)),
    );

    expect(getByText('BTC')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('renders the network badge overlay', () => {
    const { container } = renderButton(
      toBridgeToken(getNativeAssetForChainId('0x1')),
    );

    // BadgeWrapper renders an absolute-positioned overlay badge
    const badgeWrapper = container.querySelector('.relative.inline-flex');
    expect(badgeWrapper).toBeInTheDocument();
  });

  it('applies the bridge-selected-asset-button class', () => {
    const { container } = renderButton(
      toBridgeToken(getNativeAssetForChainId('0x1')),
    );

    expect(
      container.querySelector('.bridge-selected-asset-button'),
    ).toBeInTheDocument();
  });
});
