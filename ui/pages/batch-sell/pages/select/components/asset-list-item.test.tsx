import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import {
  buildBatchSellAsset,
  seedCurrencyLocaleSelectors,
} from '../../../../../../test/data/batch-sell';
import { AssetListItem } from './asset-list-item';

// Provide stub selectors that simply read from whatever state object is passed.
// The real selectors have deep chains; for unit-testing the component we only
// need to control the *values* returned via useSelector.
jest.mock('../../../../../ducks/metamask/metamask', () => ({
  getCurrentCurrency: (state: { currency?: string }) => state?.currency,
}));

jest.mock('../../../../../ducks/locale/locale', () => ({
  getIntlLocale: (state: { locale?: string }) => state?.locale,
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);

const makeAsset = (overrides = {}) =>
  buildBatchSellAsset({
    assetId: 'eip155:1/erc20:0xToken',
    name: 'Ether',
    symbol: 'ETH',
    iconUrl: 'https://example.com/eth.png',
    balance: '1.5',
    ...overrides,
  });

describe('AssetListItem', () => {
  beforeEach(() => {
    seedCurrencyLocaleSelectors(mockUseSelector);
  });

  it('renders the item container with the correct test id', () => {
    render(
      <AssetListItem
        asset={makeAsset()}
        selected={false}
        onSelect={jest.fn()}
        onDeselect={jest.fn()}
      />,
    );

    expect(
      screen.getByTestId('batch-sell-select-asset-list-item'),
    ).toBeInTheDocument();
  });

  it('renders the asset name', () => {
    render(
      <AssetListItem
        asset={makeAsset({ name: 'Tether USD' })}
        selected={false}
        onSelect={jest.fn()}
        onDeselect={jest.fn()}
      />,
    );

    expect(screen.getByText('Tether USD')).toBeInTheDocument();
  });

  it('renders the formatted token balance with symbol', () => {
    render(
      <AssetListItem
        asset={makeAsset({ balance: '2.5', symbol: 'ETH' })}
        selected={false}
        onSelect={jest.fn()}
        onDeselect={jest.fn()}
      />,
    );

    expect(screen.getByText(/ETH/u)).toBeInTheDocument();
  });

  describe('fiat balance', () => {
    it('renders formatted fiat balance when provided', () => {
      render(
        <AssetListItem
          asset={makeAsset({ tokenFiatAmount: 3000 })}
          selected={false}
          onSelect={jest.fn()}
          onDeselect={jest.fn()}
        />,
      );

      expect(screen.getByText(/3,000/u)).toBeInTheDocument();
    });

    it('does not render fiat balance section when not provided', () => {
      const { container } = render(
        <AssetListItem
          asset={makeAsset({ tokenFiatAmount: undefined })}
          selected={false}
          onSelect={jest.fn()}
          onDeselect={jest.fn()}
        />,
      );

      // Only the token-amount text should be present, no fiat-balance text
      expect(
        container.querySelectorAll('[class*="text-right"] p').length,
      ).toBeLessThanOrEqual(1);
    });
  });

  describe('token fiat price', () => {
    it('renders bullet separator when percentageChange is provided alongside tokenFiatPrice', () => {
      render(
        <AssetListItem
          asset={makeAsset({ tokenFiatPrice: 2000, percentageChange: 1.5 })}
          selected={false}
          onSelect={jest.fn()}
          onDeselect={jest.fn()}
        />,
      );

      expect(screen.getByText(/•/u)).toBeInTheDocument();
    });

    it('does not render bullet separator when percentageChange is not provided', () => {
      render(
        <AssetListItem
          asset={makeAsset({
            tokenFiatPrice: 2000,
            percentageChange: undefined,
          })}
          selected={false}
          onSelect={jest.fn()}
          onDeselect={jest.fn()}
        />,
      );

      expect(screen.queryByText(/•/u)).not.toBeInTheDocument();
    });
  });

  describe('percentage change', () => {
    it('renders percentage change when provided as a positive value', () => {
      render(
        <AssetListItem
          asset={makeAsset({ percentageChange: 5.23 })}
          selected={false}
          onSelect={jest.fn()}
          onDeselect={jest.fn()}
        />,
      );

      expect(screen.getByText(/5\.23/u)).toBeInTheDocument();
    });

    it('renders percentage change when provided as a negative value', () => {
      render(
        <AssetListItem
          asset={makeAsset({ percentageChange: -3.5 })}
          selected={false}
          onSelect={jest.fn()}
          onDeselect={jest.fn()}
        />,
      );

      expect(screen.getByText(/3\.5/u)).toBeInTheDocument();
    });

    it('does not render percentage change when not provided', () => {
      render(
        <AssetListItem
          asset={makeAsset({ percentageChange: undefined })}
          selected={false}
          onSelect={jest.fn()}
          onDeselect={jest.fn()}
        />,
      );

      expect(screen.queryByText(/%/u)).not.toBeInTheDocument();
    });

    it('does not render percentage change when value is 0', () => {
      render(
        <AssetListItem
          asset={makeAsset({ percentageChange: 0 })}
          selected={false}
          onSelect={jest.fn()}
          onDeselect={jest.fn()}
        />,
      );

      expect(screen.queryByText(/%/u)).not.toBeInTheDocument();
    });
  });

  describe('checkbox', () => {
    it('renders the checkbox', () => {
      render(
        <AssetListItem
          asset={makeAsset()}
          selected={false}
          onSelect={jest.fn()}
          onDeselect={jest.fn()}
        />,
      );

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('checkbox is checked when selected=true', () => {
      render(
        <AssetListItem
          asset={makeAsset()}
          selected
          onSelect={jest.fn()}
          onDeselect={jest.fn()}
        />,
      );

      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('checkbox is unchecked when selected=false', () => {
      render(
        <AssetListItem
          asset={makeAsset()}
          selected={false}
          onSelect={jest.fn()}
          onDeselect={jest.fn()}
        />,
      );

      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('calls onSelect with the asset when an unchecked checkbox is clicked', () => {
      const onSelect = jest.fn();
      const asset = makeAsset();

      render(
        <AssetListItem
          asset={asset}
          selected={false}
          onSelect={onSelect}
          onDeselect={jest.fn()}
        />,
      );

      fireEvent.click(screen.getByRole('checkbox'));

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(asset);
    });

    it('calls onDeselect with the asset when a checked checkbox is clicked', () => {
      const onDeselect = jest.fn();
      const asset = makeAsset();

      render(
        <AssetListItem
          asset={asset}
          selected
          onSelect={jest.fn()}
          onDeselect={onDeselect}
        />,
      );

      fireEvent.click(screen.getByRole('checkbox'));

      expect(onDeselect).toHaveBeenCalledTimes(1);
      expect(onDeselect).toHaveBeenCalledWith(asset);
    });
  });
});
