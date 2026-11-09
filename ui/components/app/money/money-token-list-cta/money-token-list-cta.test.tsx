import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import type { Hex } from '@metamask/utils';
import type { TokenWithFiatAmount } from '../../assets/types';
import {
  MONEY_TOKEN_LIST_CTA_TEST_ID,
  MoneyTokenListCta,
} from './money-token-list-cta';

const token = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Hex,
  chainId: '0x1',
  symbol: 'USDC',
} as unknown as TokenWithFiatAmount;

describe('MoneyTokenListCta', () => {
  it('renders the CTA label', () => {
    const { getByText } = render(
      <MoneyTokenListCta
        cta={{
          label: 'Get 6% APY',
          isLoading: false,
          shouldShow: jest.fn(),
          onClick: jest.fn(),
        }}
        token={token}
      />,
    );

    expect(getByText('Get 6% APY')).toBeInTheDocument();
  });

  it('calls onClick with the token without triggering the row click', () => {
    const onClick = jest.fn();
    const onRowClick = jest.fn();
    const { getByTestId } = render(
      <div onClick={onRowClick}>
        <MoneyTokenListCta
          cta={{
            label: 'Get 6% APY',
            isLoading: false,
            shouldShow: jest.fn(),
            onClick,
          }}
          token={token}
        />
      </div>,
    );

    fireEvent.click(
      getByTestId(
        `${MONEY_TOKEN_LIST_CTA_TEST_ID}-${token.chainId}-${token.address}`,
      ),
    );

    expect(onClick).toHaveBeenCalledWith(token);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('disables the CTA while a deposit is being set up', () => {
    const onClick = jest.fn();
    const { getByTestId } = render(
      <MoneyTokenListCta
        cta={{
          label: 'Get 6% APY',
          isLoading: true,
          shouldShow: jest.fn(),
          onClick,
        }}
        token={token}
      />,
    );
    const button = getByTestId(
      `${MONEY_TOKEN_LIST_CTA_TEST_ID}-${token.chainId}-${token.address}`,
    );

    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });
});
