import { AssetSelector, Box, Field } from '@metamask/snaps-sdk/jsx';
import { fireEvent } from '@testing-library/dom';
import { renderInterface } from '../test-utils';

describe('SnapUIAssetSelector', () => {
  const mockInternalAccount = {
    accounts: {
      '8c33fc18-6c52-44b1-b8fa-550b934a05ef': {
        address: '7S3P4HxJpyyigGzodYwHtCxZyUQe9JiBMHyRWXArAaKv',
        id: '8c33fc18-6c52-44b1-b8fa-550b934a05ef',
        name: 'Solana Account',
        keyring: {
          type: 'Snap Keyring',
        },
      },
    },
  };

  const mockBalances = {
    '8c33fc18-6c52-44b1-b8fa-550b934a05ef': {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:105': {
        amount: '1',
        unit: 'SOL',
      },
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
        {
          amount: '2',
          unit: 'USDC',
        },
    },
  };

  const mockAccountsAssets = {
    ['8c33fc18-6c52-44b1-b8fa-550b934a05ef' as const]: [
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:105' as const,
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as const,
    ],
  };

  const mockAssetsMetadata = {
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:105': {
      fungible: true as const,
      iconUrl:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
      name: 'Solana',
      symbol: 'SOL',
      units: [
        {
          decimals: 9,
          name: 'Solana',
          symbol: 'SOL',
        },
      ],
    },
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
      {
        fungible: true as const,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
        name: 'USDC',
        symbol: 'USDC',
        units: [
          {
            decimals: 9,
            name: 'USDC',
            symbol: 'USDC',
          },
        ],
      },
  };

  const mockConversionRates = {
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:105': {
      conversionTime: 1745405595549,
      currency: 'swift:0/iso4217:USD',
      expirationTime: 1745409195549,
      rate: '151.36',
    },
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
      {
        conversionTime: 1745405595549,
        currency: 'swift:0/iso4217:USD',
        expirationTime: 1745409195549,
        rate: '1.00',
      },
  };

  const mockState = {
    metamask: {
      internalAccounts: mockInternalAccount,
      balances: mockBalances,
      accountsAssets: mockAccountsAssets,
      assetsMetadata: mockAssetsMetadata,
      conversionRates: mockConversionRates,
    },
  };

  const mockInterfaceState = {
    'asset-selector': {
      asset: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:105',
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

  it('can switch assets', () => {
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

    const assetOptions = getAllByTestId('snap-ui-renderer__selector-item');

    expect(assetOptions).toHaveLength(2);

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
