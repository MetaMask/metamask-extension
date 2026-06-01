import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { buildBatchSellAsset } from '../../../../../../test/data/batch-sell/factories';
import { BATCH_SELL_ASSET_IDS } from '../../../../../../test/data/batch-sell/constants';
import { SelectReceivedAssetModal } from './select-received-asset-modal';

jest.mock('../../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../../../ducks/metamask/metamask', () => ({
  getCurrentCurrency: (state: { currency?: string }) => state?.currency,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);

beforeEach(() => {
  mockUseSelector.mockReset();
  mockUseSelector.mockReturnValue('USD' as never);
});

const ASSET_USDC = BATCH_SELL_ASSET_IDS.USDC;
const ASSET_USDT = BATCH_SELL_ASSET_IDS.USDT;

const assets = [
  buildBatchSellAsset({
    assetId: ASSET_USDC,
    symbol: 'USDC',
    tokenFiatAmount: 100,
  }),
  buildBatchSellAsset({
    assetId: ASSET_USDT,
    symbol: 'USDT',
    tokenFiatAmount: 50,
  }),
];

describe('SelectReceivedAssetModal', () => {
  it('does not render anything when open is false', () => {
    render(
      <SelectReceivedAssetModal
        assets={assets}
        selectedAssetId={ASSET_USDC}
        open={false}
        onClose={jest.fn()}
        onSelectAsset={jest.fn()}
      />,
    );

    expect(screen.queryByText('USDC')).not.toBeInTheDocument();
  });

  it('renders the modal title when open', () => {
    render(
      <SelectReceivedAssetModal
        assets={assets}
        selectedAssetId={ASSET_USDC}
        open
        onClose={jest.fn()}
        onSelectAsset={jest.fn()}
      />,
    );

    expect(screen.getByText('batchSellReceiveStablecoin')).toBeInTheDocument();
  });

  it('renders one row per asset', () => {
    render(
      <SelectReceivedAssetModal
        assets={assets}
        selectedAssetId={ASSET_USDC}
        open
        onClose={jest.fn()}
        onSelectAsset={jest.fn()}
      />,
    );

    expect(screen.getByText('USDC')).toBeInTheDocument();
    expect(screen.getByText('USDT')).toBeInTheDocument();
  });

  it('calls onSelectAsset with the asset id when a row is clicked', () => {
    const onSelectAsset = jest.fn();

    render(
      <SelectReceivedAssetModal
        assets={assets}
        selectedAssetId={ASSET_USDC}
        open
        onClose={jest.fn()}
        onSelectAsset={onSelectAsset}
      />,
    );

    fireEvent.click(screen.getByText('USDT'));

    expect(onSelectAsset).toHaveBeenCalledWith(ASSET_USDT);
  });
});
