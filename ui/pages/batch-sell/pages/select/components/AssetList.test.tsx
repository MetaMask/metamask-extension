import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { AssetList } from './AssetList';

// Stub AssetListItem so AssetList tests don't need Redux
jest.mock('./AssetListItem', () => ({
  AssetListItem: ({
    asset,
    selected,
    onSelect,
    onDeselect,
  }: {
    asset: BatchSellAsset;
    selected: boolean;
    onSelect: (a: BatchSellAsset) => void;
    onDeselect: (a: BatchSellAsset) => void;
  }) => (
    <div data-testid="asset-list-item" data-asset-id={asset.assetId}>
      <span>{asset.name}</span>
      <span>{selected ? 'selected' : 'unselected'}</span>
      <button onClick={() => onSelect(asset)}>Select</button>
      <button onClick={() => onDeselect(asset)}>Deselect</button>
    </div>
  ),
}));

const makeAsset = (symbol: string): BatchSellAsset => ({
  assetId: `eip155:1/erc20:0x${symbol}`,
  name: symbol,
  symbol,
  image: '',
  balance: '1',
  isNative: false,
  chainId: 'eip155:1',
});

const ETH = makeAsset('ETH');
const USDC = makeAsset('USDC');
const DAI = makeAsset('DAI');

describe('AssetList', () => {
  it('renders the container with the correct test id', () => {
    render(
      <AssetList
        assets={[]}
        selectedAssetsId={[]}
        onSelect={jest.fn()}
        onDeselect={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId('batch-sell-select-asset-list'),
    ).toBeInTheDocument();
  });

  it('renders nothing when the assets array is empty', () => {
    render(
      <AssetList
        assets={[]}
        selectedAssetsId={[]}
        onSelect={jest.fn()}
        onDeselect={jest.fn()}
      />,
    );

    expect(screen.queryAllByTestId('asset-list-item')).toHaveLength(0);
  });

  it('renders one AssetListItem per asset', () => {
    render(
      <AssetList
        assets={[ETH, USDC, DAI]}
        selectedAssetsId={[]}
        onSelect={jest.fn()}
        onDeselect={jest.fn()}
      />,
    );

    expect(screen.getAllByTestId('asset-list-item')).toHaveLength(3);
  });

  it('passes the correct asset data to each item', () => {
    render(
      <AssetList
        assets={[ETH, USDC]}
        selectedAssetsId={[]}
        onSelect={jest.fn()}
        onDeselect={jest.fn()}
      />,
    );

    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  it('marks an asset as selected when its id is in selectedAssetsId', () => {
    render(
      <AssetList
        assets={[ETH, USDC]}
        selectedAssetsId={[ETH.assetId]}
        onSelect={jest.fn()}
        onDeselect={jest.fn()}
      />,
    );

    const items = screen.getAllByTestId('asset-list-item');
    const ethItem = items.find(
      (el) => el.getAttribute('data-asset-id') === ETH.assetId,
    );
    const usdcItem = items.find(
      (el) => el.getAttribute('data-asset-id') === USDC.assetId,
    );

    expect(ethItem).toHaveTextContent('selected');
    expect(usdcItem).toHaveTextContent('unselected');
  });

  it('marks all assets as unselected when selectedAssetsId is empty', () => {
    render(
      <AssetList
        assets={[ETH, USDC]}
        selectedAssetsId={[]}
        onSelect={jest.fn()}
        onDeselect={jest.fn()}
      />,
    );

    screen.getAllByText('unselected').forEach((el) => {
      expect(el).toBeInTheDocument();
    });
    expect(screen.queryByText('selected')).not.toBeInTheDocument();
  });

  it('calls onSelect with the asset when an item fires onSelect', () => {
    const onSelect = jest.fn();

    render(
      <AssetList
        assets={[ETH, USDC]}
        selectedAssetsId={[]}
        onSelect={onSelect}
        onDeselect={jest.fn()}
      />,
    );

    const ethButton = screen
      .getAllByRole('button', { name: 'Select' })
      .find(
        (btn) =>
          btn.closest('[data-asset-id]')?.getAttribute('data-asset-id') ===
          ETH.assetId,
      );
    expect(ethButton).toBeDefined();
    fireEvent.click(ethButton as HTMLElement);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(ETH);
  });

  it('calls onDeselect with the asset when an item fires onDeselect', () => {
    const onDeselect = jest.fn();

    render(
      <AssetList
        assets={[ETH]}
        selectedAssetsId={[ETH.assetId]}
        onSelect={jest.fn()}
        onDeselect={onDeselect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Deselect' }));

    expect(onDeselect).toHaveBeenCalledTimes(1);
    expect(onDeselect).toHaveBeenCalledWith(ETH);
  });

  it('uses asset.assetId as the React key (each item has a unique data-asset-id)', () => {
    render(
      <AssetList
        assets={[ETH, USDC, DAI]}
        selectedAssetsId={[]}
        onSelect={jest.fn()}
        onDeselect={jest.fn()}
      />,
    );

    const ids = screen
      .getAllByTestId('asset-list-item')
      .map((el) => el.getAttribute('data-asset-id'));

    expect(new Set(ids).size).toBe(3);
    expect(ids).toContain(ETH.assetId);
    expect(ids).toContain(USDC.assetId);
    expect(ids).toContain(DAI.assetId);
  });
});
