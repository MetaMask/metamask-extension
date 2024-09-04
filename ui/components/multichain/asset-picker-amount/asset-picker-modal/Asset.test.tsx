import React from 'react';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { getTokenList } from '../../../../selectors';
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { TokenListItem } from '../../token-list-item';
import { AssetType } from '../../../../../shared/constants/transaction';
import Asset from './Asset';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../../hooks/useTokenFiatAmount', () => ({
  useTokenFiatAmount: jest.fn(),
}));

jest.mock('../../../../selectors', () => ({
  getTokenList: jest.fn(),
}));

jest.mock('../../../../ducks/locale/locale', () => ({
  getIntlLocale: jest.fn(),
}));

jest.mock('../../token-list-item', () => ({
  TokenListItem: jest.fn(() => <div>TokenListItem</div>),
}));

describe('Asset', () => {
  const initialMockState = {
    getTokenList: {
      '0x123': {
        address: '0x123',
        symbol: 'WETH',
        name: 'Token',
        iconUrl: 'token-icon-url',
      },
    },
    getIntlLocale: 'en-US',
  };

  const mockState = { ...initialMockState };

  (useTokenFiatAmount as jest.Mock).mockReturnValue('$10.10');

  beforeEach(() => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === getTokenList) {
        return mockState.getTokenList;
      } else if (selector === getIntlLocale) {
        return mockState.getIntlLocale;
      }
      return undefined;
    });

    jest.clearAllMocks();
  });

  it('should render TokenListItem with correct props when address is provided', () => {
    const { getByText } = render(
      <Asset
        type={AssetType.token}
        image="token-icon-url"
        address="0x123"
        symbol="WETH"
        string="10"
        balance="10000000000000000000"
        decimals={18}
        tooltipText="tooltip"
      />,
    );

    expect(getByText('TokenListItem')).toBeInTheDocument();
    expect(TokenListItem).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenSymbol: 'WETH',
        tokenImage: 'token-icon-url',
        primary: '10',
        secondary: '$10.10',
        title: 'Token',
        tooltipText: 'tooltip',
      }),
      {},
    );
  });
});
