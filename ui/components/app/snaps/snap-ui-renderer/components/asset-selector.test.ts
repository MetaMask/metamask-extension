import { AssetSelector, Box, Field } from '@metamask/snaps-sdk/jsx';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderInterface } from '../test-utils';

describe('SnapUIAssetSelector', () => {
  const solNativeAssetId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:105';
  const solUsdcAssetId =
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  const accountId = '8c33fc18-6c52-44b1-b8fa-550b934a05ef';

  const mockInternalAccount = {
    selectedAccount: accountId,
    accounts: {
      [accountId]: {
        address: '7S3P4HxJpyyigGzodYwHtCxZyUQe9JiBMHyRWXArAaKv',
        id: accountId,
        type: 'solana:dataAccount',
        scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
        methods: [],
        options: {},
        metadata: {
          name: 'Solana Account',
          keyring: {
            type: 'Snap Keyring',
          },
        },
      },
    },
  };

  const mockAssetsBalance = {
    [accountId]: {
      [solNativeAssetId]: {
        amount: '1',
      },
      [solUsdcAssetId]: {
        amount: '2',
      },
    },
  };

  const mockAssetsInfo = {
    [solNativeAssetId]: {
      type: 'native',
      decimals: 9,
      symbol: 'SOL',
      name: 'Solana',
      image:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
    },
    [solUsdcAssetId]: {
      type: 'token',
      decimals: 9,
      symbol: 'USDC',
      name: 'USDC',
      image:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
    },
  };

  const mockAssetsPrice = {
    [solNativeAssetId]: {
      assetPriceType: 'fungible',
      price: 151.36,
      usdPrice: 151.36,
      lastUpdated: 1745405595549,
    },
    [solUsdcAssetId]: {
      assetPriceType: 'fungible',
      price: 1,
      usdPrice: 1,
      lastUpdated: 1745405595549,
    },
  };

  const mockState = {
    metamask: {
      internalAccounts: mockInternalAccount,
      accountIdByAddress: {
        '7S3P4HxJpyyigGzodYwHtCxZyUQe9JiBMHyRWXArAaKv': accountId,
      },
      selectedCurrency: 'usd',
      assetsBalance: mockAssetsBalance,
      assetsInfo: mockAssetsInfo,
      assetsPrice: mockAssetsPrice,
    },
  };

  const mockInterfaceState = {
    'asset-selector': {
      asset: solNativeAssetId,
      name: 'Solana',
      symbol: 'SOL',
    },
  };

  it('renders an asset selector', () => {
    const { container } = renderInterface(
      Box({
        children: AssetSelector({
          name: 'asset-selector',
          addresses: [
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7S3P4HxJpyyigGzodYwHtCxZyUQe9JiBMHyRWXArAaKv',
          ],
        }),
      }),
      {
        state: mockInterfaceState,
        metamaskState: mockState,
      },
    );

    expect(
      container.getElementsByClassName('snap-ui-renderer__asset-selector'),
    ).toHaveLength(1);

    expect(
      container.getElementsByClassName(
        'snap-ui-renderer__asset-selector-option',
      ),
    ).toHaveLength(1);

    expect(container).toMatchSnapshot();
  });

  it('can be disabled', () => {
    const { container } = renderInterface(
      Box({
        children: AssetSelector({
          name: 'asset-selector',
          disabled: true,
          addresses: [
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7S3P4HxJpyyigGzodYwHtCxZyUQe9JiBMHyRWXArAaKv',
          ],
        }),
      }),
      {
        state: mockInterfaceState,
        metamaskState: mockState,
      },
    );

    const assetSelector = container.getElementsByClassName(
      'snap-ui-renderer__asset-selector',
    )[0];

    expect(assetSelector).toBeDisabled();
  });

  it('can switch assets', async () => {
    const { container, getAllByTestId, getByText } = renderInterface(
      Box({
        children: AssetSelector({
          name: 'asset-selector',
          addresses: [
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7S3P4HxJpyyigGzodYwHtCxZyUQe9JiBMHyRWXArAaKv',
          ],
        }),
      }),
      {
        state: mockInterfaceState,
        metamaskState: mockState,
      },
    );

    const assetSelector = container.getElementsByClassName(
      'snap-ui-renderer__asset-selector',
    )[0];

    fireEvent.click(assetSelector);

    await waitFor(() =>
      expect(getAllByTestId('snap-ui-renderer__selector-item')).toHaveLength(2),
    );

    const assetOptions = getAllByTestId('snap-ui-renderer__selector-item');

    fireEvent.click(assetOptions[1]);

    expect(getByText('USDC')).toBeInTheDocument();
  });

  it('renders inside a field', () => {
    const { container, getByText } = renderInterface(
      Box({
        children: Field({
          label: 'Asset Selector',
          children: AssetSelector({
            name: 'asset-selector',
            addresses: [
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7S3P4HxJpyyigGzodYwHtCxZyUQe9JiBMHyRWXArAaKv',
            ],
          }),
        }),
      }),
      {
        state: mockInterfaceState,
        metamaskState: mockState,
      },
    );

    expect(
      container.getElementsByClassName('snap-ui-renderer__asset-selector'),
    ).toHaveLength(1);

    expect(getByText('Asset Selector')).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });

  it('can show an error', () => {
    const { container, getByText } = renderInterface(
      Box({
        children: Field({
          label: 'Asset Selector',
          children: AssetSelector({
            name: 'asset-selector',
            addresses: [
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:7S3P4HxJpyyigGzodYwHtCxZyUQe9JiBMHyRWXArAaKv',
            ],
          }),
          error: 'This is an error',
        }),
      }),
      {
        state: mockInterfaceState,
        metamaskState: mockState,
      },
    );

    expect(
      container.getElementsByClassName('snap-ui-renderer__asset-selector'),
    ).toHaveLength(1);

    expect(getByText('This is an error')).toBeInTheDocument();
  });
});
