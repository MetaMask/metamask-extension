import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSelector } from 'react-redux';
import {
  getPreferences,
  getSelectedAccountCachedBalance,
} from '../../../../selectors';
import { getNativeCurrency } from '../../../../ducks/metamask/metamask';
import { useUserPreferencedCurrency } from '../../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { AssetType } from '../../../../../shared/constants/transaction';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../../shared/constants/network';
import AssetList from './AssetList';
import { AssetWithDisplayData, ERC20Asset, NativeAsset } from './types';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../../selectors', () => ({
  getSelectedAccountCachedBalance: jest.fn(),
}));

jest.mock('../../../../ducks/metamask/metamask', () => ({
  getNativeCurrency: jest.fn(),
}));

jest.mock('../../../../hooks/useUserPreferencedCurrency', () => ({
  useUserPreferencedCurrency: jest.fn(),
}));

jest.mock('../../../../hooks/useCurrencyDisplay', () => ({
  useCurrencyDisplay: jest.fn(),
}));

jest.mock('../..', () => ({
  TokenListItem: jest.fn(() => <div>TokenListItem</div>),
}));

jest.mock('./Asset', () => jest.fn(() => <div>AssetComponent</div>));

describe('AssetList', () => {
  const handleAssetChangeMock = jest.fn();
  const nativeCurrency = 'ETH';
  const balanceValue = '0x121';
  const tokenList: (
    | AssetWithDisplayData<ERC20Asset>
    | AssetWithDisplayData<NativeAsset>
  )[] = [
    {
      address: '0xToken1',
      symbol: 'TOKEN1',
      type: AssetType.token,
      image: 'image1.png',
      string: '10',
      decimals: 18,
      balance: '0',
    },
    {
      address: '0xToken2',
      symbol: 'TOKEN2',
      type: AssetType.token,
      image: 'image2.png',
      string: '20',
      decimals: 6,
      balance: '10',
    },
    {
      address: null,
      symbol: 'ETH',
      type: AssetType.native,
      image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
      string: '30',
      decimals: 18,
      balance: '0x121',
    },
  ];
  const primaryCurrency = 'USD';
  const secondaryCurrency = 'ETH';

  beforeEach(() => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getNativeCurrency) {
        return nativeCurrency;
      }
      if (selector === getSelectedAccountCachedBalance) {
        return balanceValue;
      }
      if (selector === getPreferences) {
        return true;
      }
      return undefined;
    });

    (useUserPreferencedCurrency as jest.Mock)
      .mockReturnValueOnce({
        currency: primaryCurrency,
        numberOfDecimals: 4,
      })
      .mockReturnValueOnce({
        currency: secondaryCurrency,
        numberOfDecimals: 4,
      });

    (useCurrencyDisplay as jest.Mock)
      .mockReturnValueOnce(['100 USD', { value: '100', suffix: 'USD' }])
      .mockReturnValueOnce(['1 ETH', { value: '1', suffix: 'ETH' }]);

    handleAssetChangeMock.mockClear();
  });

  it('should render the token list', () => {
    render(
      <AssetList
        handleAssetChange={handleAssetChangeMock}
        asset={{
          type: AssetType.native,
          image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
          symbol: 'ETH',
        }}
        tokenList={tokenList}
      />,
    );

    expect(screen.getAllByText('TokenListItem')).toHaveLength(1);
    expect(screen.getAllByText('AssetComponent')).toHaveLength(2);
  });

  it('should call handleAssetChange when a token is clicked', () => {
    render(
      <AssetList
        handleAssetChange={handleAssetChangeMock}
        asset={{
          type: AssetType.native,
          image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
          symbol: 'ETH',
        }}
        tokenList={tokenList}
      />,
    );

    fireEvent.click(screen.getAllByText('AssetComponent')[0]);
    expect(handleAssetChangeMock).toHaveBeenCalledWith(tokenList[0]);
  });

  it('should disable the token if it is in the blocked tokens list', () => {
    (useSelector as jest.Mock)
      .mockImplementationOnce(() => ['0xToken1'])
      .mockImplementation((selector) => {
        if (selector === getNativeCurrency) {
          return nativeCurrency;
        }
        if (selector === getSelectedAccountCachedBalance) {
          return balanceValue;
        }
        if (selector === getPreferences) {
          return true;
        }
        return undefined;
      });

    render(
      <AssetList
        handleAssetChange={handleAssetChangeMock}
        asset={{
          type: AssetType.native,
          image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
          symbol: 'ETH',
        }}
        tokenList={tokenList}
        isTokenDisabled={(token) => token.address === '0xToken1'}
      />,
    );

    expect(screen.getAllByTestId('asset-list-item')[0]).toHaveClass(
      'multichain-asset-picker-list-item--disabled',
    );
  });
});
